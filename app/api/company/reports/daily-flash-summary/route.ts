import { NextResponse } from "next/server";

import { getCompanySession } from "@/lib/company-auth";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

function parseRange(url: URL) {
  const fromRaw = url.searchParams.get("from");
  const toRaw = url.searchParams.get("to");
  const from = fromRaw ? new Date(fromRaw) : null;
  const to = toRaw ? new Date(toRaw) : null;
  if (from && to && !Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && to > from) {
    return { from, to };
  }
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return { from: start, to: new Date(start.getTime() + DAY_MS) };
}

async function loadTotals(companyId: string, from: Date, to: Date) {
  const range = { gte: from, lt: to };
  const [billed, collected, testCount, newPatients, appointments] = await Promise.all([
    prisma.testRequest.aggregate({
      where: { companyId, requestedAt: range },
      _sum: { totalAmount: true, amountPaid: true },
      _count: { _all: true },
    }),
    prisma.testRequest.aggregate({
      where: { companyId, paidAt: range },
      _sum: { amountPaid: true },
      _count: { _all: true },
    }),
    prisma.testRequestItem.count({ where: { request: { companyId, requestedAt: range } } }),
    prisma.patient.count({ where: { companyId, createdAt: range } }),
    prisma.appointment.count({ where: { companyId, scheduledAt: range } }),
  ]);

  const billedAmount = billed._sum.totalAmount ?? 0;
  const paidOnBilled = billed._sum.amountPaid ?? 0;

  return {
    requests: billed._count._all,
    tests: testCount,
    billed: billedAmount,
    collected: collected._sum.amountPaid ?? 0,
    payments: collected._count._all,
    outstanding: Math.max(0, billedAmount - paidOnBilled),
    newPatients,
    appointments,
  };
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
    const range = { gte: from, lt: to };

    const [current, previous, requests, paidRequests, appointments] = await Promise.all([
      loadTotals(companyId, from, to),
      loadTotals(companyId, prevFrom, from),
      prisma.testRequest.findMany({
        where: { companyId, requestedAt: range },
        select: {
          requestedAt: true,
          status: true,
          priority: true,
          paymentStatus: true,
          totalAmount: true,
          doctor: { select: { id: true, name: true } },
          items: {
            select: {
              amount: true,
              test: {
                select: { id: true, name: true, department: { select: { id: true, name: true } } },
              },
            },
          },
        },
      }),
      prisma.testRequest.findMany({
        where: { companyId, paidAt: range },
        select: { paymentMethod: true, amountPaid: true },
      }),
      prisma.appointment.groupBy({
        by: ["status"],
        where: { companyId, scheduledAt: range },
        _count: { _all: true },
      }),
    ]);

    const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, requests: 0, amount: 0 }));
    const status: Record<string, number> = { Pending: 0, InProgress: 0, Completed: 0 };
    const priority: Record<string, number> = { Routine: 0, Urgent: 0, STAT: 0 };
    const paymentStatus: Record<string, number> = { Paid: 0, Partial: 0, Unpaid: 0 };
    const departments = new Map<string, { name: string; tests: number; amount: number }>();
    const tests = new Map<string, { name: string; count: number; amount: number }>();
    const doctors = new Map<string, { name: string; requests: number; amount: number }>();

    for (const row of requests) {
      const offsetHours = Math.floor((row.requestedAt.getTime() - from.getTime()) / (60 * 60 * 1000));
      const bucket = hourly[Math.min(23, Math.max(0, offsetHours))];
      bucket.requests += 1;
      bucket.amount += row.totalAmount;

      status[row.status] = (status[row.status] ?? 0) + 1;
      priority[row.priority] = (priority[row.priority] ?? 0) + 1;
      paymentStatus[row.paymentStatus] = (paymentStatus[row.paymentStatus] ?? 0) + 1;

      const doctorKey = row.doctor?.id ?? "walk-in";
      const doctor = doctors.get(doctorKey) ?? {
        name: row.doctor?.name ?? "Self / walk-in",
        requests: 0,
        amount: 0,
      };
      doctor.requests += 1;
      doctor.amount += row.totalAmount;
      doctors.set(doctorKey, doctor);

      for (const item of row.items) {
        const dept = item.test.department;
        const deptRow = departments.get(dept.id) ?? { name: dept.name, tests: 0, amount: 0 };
        deptRow.tests += 1;
        deptRow.amount += item.amount;
        departments.set(dept.id, deptRow);

        const testRow = tests.get(item.test.id) ?? { name: item.test.name, count: 0, amount: 0 };
        testRow.count += 1;
        testRow.amount += item.amount;
        tests.set(item.test.id, testRow);
      }
    }

    const methods = new Map<string, { method: string; count: number; amount: number }>();
    for (const row of paidRequests) {
      const method = row.paymentMethod.trim() || "Unspecified";
      const entry = methods.get(method) ?? { method, count: 0, amount: 0 };
      entry.count += 1;
      entry.amount += row.amountPaid;
      methods.set(method, entry);
    }

    const appointmentStatus: Record<string, number> = {
      Pending: 0,
      Confirmed: 0,
      Completed: 0,
      Cancelled: 0,
    };
    for (const row of appointments) appointmentStatus[row.status] = row._count._all;

    return NextResponse.json({
      range: { from: from.toISOString(), to: to.toISOString() },
      current,
      previous,
      hourly,
      status,
      priority,
      paymentStatus,
      paymentMethods: [...methods.values()].sort((a, b) => b.amount - a.amount),
      departments: [...departments.values()].sort((a, b) => b.amount - a.amount),
      topTests: [...tests.values()].sort((a, b) => b.count - a.count || b.amount - a.amount).slice(0, 8),
      topDoctors: [...doctors.values()].sort((a, b) => b.requests - a.requests).slice(0, 6),
      appointmentStatus,
    });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to load daily flash summary.");
    return NextResponse.json({ error: message }, { status });
  }
}
