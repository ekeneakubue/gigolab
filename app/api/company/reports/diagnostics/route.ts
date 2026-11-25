import { NextResponse } from "next/server";

import { getCompanySession } from "@/lib/company-auth";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAYS = 366;
const MAX_ROWS = 1000;

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

export async function GET(request: Request) {
  try {
    const session = await getCompanySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { companyId } = session;
    const { from, to } = parseRange(new URL(request.url));

    const requests = await prisma.testRequest.findMany({
      where: { companyId, requestedAt: { gte: from, lt: to } },
      orderBy: { requestedAt: "desc" },
      select: {
        id: true,
        requestCode: true,
        requestedAt: true,
        verifiedAt: true,
        resultsReleased: true,
        status: true,
        priority: true,
        sampleType: true,
        patient: { select: { name: true, patientCode: true } },
        doctor: { select: { name: true } },
        items: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            amount: true,
            result: true,
            test: { select: { id: true, name: true, department: { select: { id: true, name: true } } } },
          },
        },
      },
    });

    const dayCount = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / DAY_MS));
    const daily = Array.from({ length: dayCount }, (_, index) => ({
      date: new Date(from.getTime() + index * DAY_MS).toISOString(),
      tests: 0,
      completed: 0,
    }));

    const status = { Pending: 0, InProgress: 0, Completed: 0 };
    const priority = { Routine: 0, Urgent: 0, STAT: 0 };
    const departments = new Map<
      string,
      { name: string; tests: number; completed: number; withResult: number; amount: number }
    >();
    const tests = new Map<string, { name: string; department: string; count: number; amount: number }>();

    let testCount = 0;
    let withResult = 0;
    let released = 0;
    let revenue = 0;
    let tatTotalMs = 0;
    let tatCount = 0;
    let tatBreaches = 0;

    const rows: Array<{
      id: string;
      requestId: string;
      requestCode: string;
      requestedAt: string;
      patientName: string;
      patientCode: string;
      doctorName: string;
      testName: string;
      department: string;
      sampleType: string;
      priority: string;
      status: string;
      hasResult: boolean;
      released: boolean;
      amount: number;
      tatHours: number | null;
    }> = [];

    for (const req of requests) {
      status[req.status] += 1;
      priority[req.priority] += 1;
      if (req.resultsReleased) released += 1;

      let tatHours: number | null = null;
      if (req.verifiedAt) {
        const ms = req.verifiedAt.getTime() - req.requestedAt.getTime();
        if (ms >= 0) {
          tatTotalMs += ms;
          tatCount += 1;
          tatHours = ms / (60 * 60 * 1000);
          const target = req.priority === "STAT" ? 2 : req.priority === "Urgent" ? 6 : 24;
          if (tatHours > target) tatBreaches += 1;
        }
      }

      const dayIndex = Math.floor((req.requestedAt.getTime() - from.getTime()) / DAY_MS);
      const day = daily[Math.min(dayCount - 1, Math.max(0, dayIndex))];

      for (const item of req.items) {
        const hasResult = item.result.trim().length > 0;
        testCount += 1;
        revenue += item.amount;
        if (hasResult) withResult += 1;
        day.tests += 1;
        if (req.status === "Completed") day.completed += 1;

        const dept = item.test.department;
        const deptRow =
          departments.get(dept.id) ?? { name: dept.name, tests: 0, completed: 0, withResult: 0, amount: 0 };
        deptRow.tests += 1;
        deptRow.amount += item.amount;
        if (req.status === "Completed") deptRow.completed += 1;
        if (hasResult) deptRow.withResult += 1;
        departments.set(dept.id, deptRow);

        const testRow =
          tests.get(item.test.id) ?? { name: item.test.name, department: dept.name, count: 0, amount: 0 };
        testRow.count += 1;
        testRow.amount += item.amount;
        tests.set(item.test.id, testRow);

        if (rows.length < MAX_ROWS) {
          rows.push({
            id: item.id,
            requestId: req.id,
            requestCode: req.requestCode,
            requestedAt: req.requestedAt.toISOString(),
            patientName: req.patient.name,
            patientCode: req.patient.patientCode,
            doctorName: req.doctor?.name ?? "",
            testName: item.test.name,
            department: dept.name,
            sampleType: req.sampleType,
            priority: req.priority,
            status: req.status,
            hasResult,
            released: req.resultsReleased,
            amount: item.amount,
            tatHours,
          });
        }
      }
    }

    return NextResponse.json({
      range: { from: from.toISOString(), to: to.toISOString() },
      summary: {
        requests: requests.length,
        tests: testCount,
        withResult,
        released,
        revenue,
        avgTatHours: tatCount > 0 ? tatTotalMs / tatCount / (60 * 60 * 1000) : null,
        tatMeasured: tatCount,
        tatBreaches,
      },
      status,
      priority,
      daily,
      departments: [...departments.values()].sort((a, b) => b.tests - a.tests),
      topTests: [...tests.values()].sort((a, b) => b.count - a.count).slice(0, 10),
      rows,
      truncated: testCount > MAX_ROWS,
    });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to load diagnostics report.");
    return NextResponse.json({ error: message }, { status });
  }
}
