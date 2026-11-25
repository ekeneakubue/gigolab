import { NextResponse } from "next/server";

import { getCompanySession } from "@/lib/company-auth";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAYS = 366;
const MAX_ROWS = 2000;
/** A test request within this window of the appointment counts as a conversion. */
const CONVERSION_WINDOW_MS = 2 * DAY_MS;

function parseRange(url: URL) {
  const from = new Date(url.searchParams.get("from") ?? "");
  const to = new Date(url.searchParams.get("to") ?? "");
  if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && to > from) {
    const capped = Math.min(to.getTime(), from.getTime() + MAX_DAYS * DAY_MS);
    return { from, to: new Date(capped) };
  }
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return { from: start, to: new Date(start.getTime() + DAY_MS) };
}

function normalizeReason(reason: string) {
  const trimmed = reason.trim().replace(/\s+/g, " ");
  if (!trimmed) return "Unspecified";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export async function GET(request: Request) {
  try {
    const session = await getCompanySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { companyId } = session;
    const { from, to } = parseRange(new URL(request.url));
    const span = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - span);
    const now = new Date();

    const [appointments, prevGroups] = await Promise.all([
      prisma.appointment.findMany({
        where: { companyId, scheduledAt: { gte: from, lt: to } },
        orderBy: { scheduledAt: "desc" },
        select: {
          id: true,
          scheduledAt: true,
          createdAt: true,
          reason: true,
          notes: true,
          status: true,
          patient: {
            select: { id: true, name: true, patientCode: true, phone: true, email: true, gender: true },
          },
        },
      }),
      prisma.appointment.groupBy({
        by: ["status"],
        where: { companyId, scheduledAt: { gte: prevFrom, lt: from } },
        _count: { _all: true },
      }),
    ]);

    const patientIds = [...new Set(appointments.map((row) => row.patient.id))];

    const [earlierVisits, testRequests] = patientIds.length
      ? await Promise.all([
          prisma.appointment.groupBy({
            by: ["patientId"],
            where: { companyId, patientId: { in: patientIds }, scheduledAt: { lt: from } },
            _count: { _all: true },
          }),
          prisma.testRequest.findMany({
            where: {
              companyId,
              patientId: { in: patientIds },
              requestedAt: {
                gte: new Date(from.getTime() - CONVERSION_WINDOW_MS),
                lt: new Date(to.getTime() + CONVERSION_WINDOW_MS),
              },
            },
            select: { patientId: true, requestedAt: true, totalAmount: true },
          }),
        ])
      : [[], []];

    const returningPatients = new Set(earlierVisits.map((row) => row.patientId));
    const requestsByPatient = new Map<string, { at: number; amount: number }[]>();
    for (const row of testRequests) {
      const list = requestsByPatient.get(row.patientId) ?? [];
      list.push({ at: row.requestedAt.getTime(), amount: row.totalAmount });
      requestsByPatient.set(row.patientId, list);
    }

    const status = { Pending: 0, Confirmed: 0, Completed: 0, Cancelled: 0 };
    const previousStatus = { Pending: 0, Confirmed: 0, Completed: 0, Cancelled: 0 };
    for (const row of prevGroups) previousStatus[row.status] = row._count._all;

    const dayCount = Math.max(1, Math.ceil(span / DAY_MS));
    const daily = Array.from({ length: dayCount }, (_, index) => ({
      date: new Date(from.getTime() + index * DAY_MS).toISOString(),
      Pending: 0,
      Confirmed: 0,
      Completed: 0,
      Cancelled: 0,
    }));

    const reasons = new Map<string, { reason: string; count: number; completed: number; cancelled: number }>();
    const gender = new Map<string, number>();
    const patientSeen = new Set<string>();

    let upcoming = 0;
    let overdue = 0;
    let leadTotalMs = 0;
    let leadCount = 0;
    let converted = 0;
    let convertedRevenue = 0;
    let conversionEligible = 0;

    const rows: Array<{
      id: string;
      scheduledAt: string;
      createdAt: string;
      reason: string;
      notes: string;
      status: keyof typeof status;
      overdue: boolean;
      converted: boolean;
      patientName: string;
      patientCode: string;
      phone: string;
      email: string;
      returning: boolean;
    }> = [];

    for (const appt of appointments) {
      status[appt.status] += 1;

      const dayIndex = Math.floor((appt.scheduledAt.getTime() - from.getTime()) / DAY_MS);
      daily[Math.min(dayCount - 1, Math.max(0, dayIndex))][appt.status] += 1;

      const open = appt.status === "Pending" || appt.status === "Confirmed";
      const isOverdue = open && appt.scheduledAt < now;
      if (open && appt.scheduledAt >= now) upcoming += 1;
      if (isOverdue) overdue += 1;

      const leadMs = appt.scheduledAt.getTime() - appt.createdAt.getTime();
      if (leadMs >= 0) {
        leadTotalMs += leadMs;
        leadCount += 1;
      }

      const reasonKey = normalizeReason(appt.reason);
      const reasonRow = reasons.get(reasonKey.toLowerCase()) ?? {
        reason: reasonKey,
        count: 0,
        completed: 0,
        cancelled: 0,
      };
      reasonRow.count += 1;
      if (appt.status === "Completed") reasonRow.completed += 1;
      if (appt.status === "Cancelled") reasonRow.cancelled += 1;
      reasons.set(reasonKey.toLowerCase(), reasonRow);

      if (!patientSeen.has(appt.patient.id)) {
        patientSeen.add(appt.patient.id);
        const g = appt.patient.gender.trim() || "Unspecified";
        const label = g.charAt(0).toUpperCase() + g.slice(1).toLowerCase();
        gender.set(label, (gender.get(label) ?? 0) + 1);
      }

      let isConverted = false;
      if (appt.status !== "Cancelled") {
        conversionEligible += 1;
        const at = appt.scheduledAt.getTime();
        const match = (requestsByPatient.get(appt.patient.id) ?? []).find(
          (req) => Math.abs(req.at - at) <= CONVERSION_WINDOW_MS,
        );
        if (match) {
          isConverted = true;
          converted += 1;
          convertedRevenue += match.amount;
        }
      }

      if (rows.length < MAX_ROWS) {
        rows.push({
          id: appt.id,
          scheduledAt: appt.scheduledAt.toISOString(),
          createdAt: appt.createdAt.toISOString(),
          reason: reasonKey,
          notes: appt.notes,
          status: appt.status,
          overdue: isOverdue,
          converted: isConverted,
          patientName: appt.patient.name,
          patientCode: appt.patient.patientCode,
          phone: appt.patient.phone,
          email: appt.patient.email,
          returning: returningPatients.has(appt.patient.id),
        });
      }
    }

    const previousTotal = Object.values(previousStatus).reduce((sum, value) => sum + value, 0);

    return NextResponse.json({
      range: { from: from.toISOString(), to: to.toISOString() },
      summary: {
        total: appointments.length,
        previousTotal,
        previousCompleted: previousStatus.Completed,
        previousCancelled: previousStatus.Cancelled,
        patients: patientSeen.size,
        returningPatients: [...patientSeen].filter((id) => returningPatients.has(id)).length,
        upcoming,
        overdue,
        avgLeadHours: leadCount > 0 ? leadTotalMs / leadCount / (60 * 60 * 1000) : null,
        converted,
        conversionEligible,
        convertedRevenue,
      },
      status,
      daily,
      reasons: [...reasons.values()].sort((a, b) => b.count - a.count).slice(0, 10),
      gender: [...gender.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
      rows,
      truncated: appointments.length > MAX_ROWS,
    });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to load appointments report.");
    return NextResponse.json({ error: message }, { status });
  }
}
