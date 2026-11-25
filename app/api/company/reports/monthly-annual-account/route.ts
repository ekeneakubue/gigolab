import { NextResponse } from "next/server";

import { getCompanySession } from "@/lib/company-auth";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

const MAX_MONTHS = 36;

function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1);
}

function parseRange(url: URL) {
  const from = new Date(url.searchParams.get("from") ?? "");
  const to = new Date(url.searchParams.get("to") ?? "");
  if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && to > from) {
    return { from, to };
  }
  const now = new Date();
  const fromDefault = startOfMonth(now.getFullYear(), 0);
  const toDefault = startOfMonth(now.getFullYear() + 1, 0);
  return { from: fromDefault, to: toDefault };
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildMonths(from: Date, to: Date) {
  const months: { key: string; year: number; month: number; from: Date; to: Date }[] = [];
  let cursor = startOfMonth(from.getFullYear(), from.getMonth());
  while (cursor < to && months.length < MAX_MONTHS) {
    const next = startOfMonth(cursor.getFullYear(), cursor.getMonth() + 1);
    months.push({
      key: monthKey(cursor),
      year: cursor.getFullYear(),
      month: cursor.getMonth() + 1,
      from: cursor,
      to: next,
    });
    cursor = next;
  }
  return months;
}

function methodKey(value: string) {
  const trimmed = value.trim();
  return trimmed || "Unspecified";
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
    const months = buildMonths(from, to);

    const [billed, paid, prevBilled, prevPaid, departments] = await Promise.all([
      prisma.testRequest.findMany({
        where: { companyId, requestedAt: { gte: from, lt: to } },
        select: {
          requestedAt: true,
          totalAmount: true,
          amountPaid: true,
          paymentStatus: true,
          doctor: { select: { name: true } },
          items: {
            select: {
              amount: true,
              test: { select: { department: { select: { name: true } } } },
            },
          },
        },
      }),
      prisma.testRequest.findMany({
        where: { companyId, paidAt: { gte: from, lt: to } },
        select: {
          paidAt: true,
          requestedAt: true,
          amountPaid: true,
          paymentMethod: true,
        },
      }),
      prisma.testRequest.aggregate({
        where: { companyId, requestedAt: { gte: prevFrom, lt: from } },
        _sum: { totalAmount: true, amountPaid: true },
        _count: { _all: true },
      }),
      prisma.testRequest.aggregate({
        where: { companyId, paidAt: { gte: prevFrom, lt: from } },
        _sum: { amountPaid: true },
        _count: { _all: true },
      }),
      prisma.department.findMany({
        where: { companyId },
        select: { name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    type MonthBucket = {
      key: string;
      year: number;
      month: number;
      bills: number;
      billed: number;
      collected: number;
      payments: number;
      outstanding: number;
      paidAgainst: number;
      sameDay: number;
      arrears: number;
    };

    const monthMap = new Map<string, MonthBucket>();
    for (const month of months) {
      monthMap.set(month.key, {
        key: month.key,
        year: month.year,
        month: month.month,
        bills: 0,
        billed: 0,
        collected: 0,
        payments: 0,
        outstanding: 0,
        paidAgainst: 0,
        sameDay: 0,
        arrears: 0,
      });
    }

    const years = new Map<
      number,
      { year: number; bills: number; billed: number; collected: number; outstanding: number; payments: number }
    >();
    const methods = new Map<string, { method: string; count: number; amount: number }>();
    const doctors = new Map<string, { name: string; bills: number; billed: number; outstanding: number }>();
    const deptRevenue = new Map<string, { name: string; amount: number; tests: number }>();
    const paymentStatus = { Paid: 0, Partial: 0, Unpaid: 0 };

    let billedAmount = 0;
    let paidAgainst = 0;
    let collectedAmount = 0;

    for (const row of billed) {
      const key = monthKey(row.requestedAt);
      const bucket = monthMap.get(key);
      if (bucket) {
        bucket.bills += 1;
        bucket.billed += row.totalAmount;
        bucket.paidAgainst += row.amountPaid;
        bucket.outstanding += Math.max(0, row.totalAmount - row.amountPaid);
      }

      const year = row.requestedAt.getFullYear();
      const yearRow = years.get(year) ?? {
        year,
        bills: 0,
        billed: 0,
        collected: 0,
        outstanding: 0,
        payments: 0,
      };
      yearRow.bills += 1;
      yearRow.billed += row.totalAmount;
      yearRow.outstanding += Math.max(0, row.totalAmount - row.amountPaid);
      years.set(year, yearRow);

      billedAmount += row.totalAmount;
      paidAgainst += row.amountPaid;
      paymentStatus[row.paymentStatus] += 1;

      const doctorName = row.doctor?.name ?? "Self / walk-in";
      const doctor = doctors.get(doctorName) ?? { name: doctorName, bills: 0, billed: 0, outstanding: 0 };
      doctor.bills += 1;
      doctor.billed += row.totalAmount;
      doctor.outstanding += Math.max(0, row.totalAmount - row.amountPaid);
      doctors.set(doctorName, doctor);

      for (const item of row.items) {
        const name = item.test.department.name;
        const dept = deptRevenue.get(name) ?? { name, amount: 0, tests: 0 };
        dept.amount += item.amount;
        dept.tests += 1;
        deptRevenue.set(name, dept);
      }
    }

    for (const row of paid) {
      if (!row.paidAt) continue;
      const key = monthKey(row.paidAt);
      const bucket = monthMap.get(key);
      const sameMonth =
        row.requestedAt.getFullYear() === row.paidAt.getFullYear() &&
        row.requestedAt.getMonth() === row.paidAt.getMonth();

      if (bucket) {
        bucket.collected += row.amountPaid;
        bucket.payments += 1;
        if (sameMonth) bucket.sameDay += row.amountPaid;
        else bucket.arrears += row.amountPaid;
      }

      const year = row.paidAt.getFullYear();
      const yearRow = years.get(year) ?? {
        year,
        bills: 0,
        billed: 0,
        collected: 0,
        outstanding: 0,
        payments: 0,
      };
      yearRow.collected += row.amountPaid;
      yearRow.payments += 1;
      years.set(year, yearRow);

      collectedAmount += row.amountPaid;

      const method = methodKey(row.paymentMethod);
      const methodRow = methods.get(method) ?? { method, count: 0, amount: 0 };
      methodRow.count += 1;
      methodRow.amount += row.amountPaid;
      methods.set(method, methodRow);
    }

    // Ensure every known department appears even with zero activity.
    for (const dept of departments) {
      if (!deptRevenue.has(dept.name)) deptRevenue.set(dept.name, { name: dept.name, amount: 0, tests: 0 });
    }

    const monthRows = months.map((month) => monthMap.get(month.key)!);
    const peakMonth = monthRows.reduce<(typeof monthRows)[number] | null>(
      (best, row) => (!best || row.billed > best.billed ? row : best),
      null,
    );
    const peakCollectionMonth = monthRows.reduce<(typeof monthRows)[number] | null>(
      (best, row) => (!best || row.collected > best.collected ? row : best),
      null,
    );

    const prevBilledAmount = prevBilled._sum.totalAmount ?? 0;
    const prevPaidAgainst = prevBilled._sum.amountPaid ?? 0;

    return NextResponse.json({
      range: { from: from.toISOString(), to: to.toISOString() },
      summary: {
        months: monthRows.length,
        bills: billed.length,
        billed: billedAmount,
        collected: collectedAmount,
        payments: paid.length,
        outstanding: Math.max(0, billedAmount - paidAgainst),
        paidAgainst,
        collectionRate: billedAmount > 0 ? Math.min(100, (paidAgainst / billedAmount) * 100) : 0,
        avgMonthlyBilled: monthRows.length > 0 ? billedAmount / monthRows.length : 0,
        avgMonthlyCollected: monthRows.length > 0 ? collectedAmount / monthRows.length : 0,
        prevBilled: prevBilledAmount,
        prevCollected: prevPaid._sum.amountPaid ?? 0,
        prevOutstanding: Math.max(0, prevBilledAmount - prevPaidAgainst),
        prevBills: prevBilled._count._all,
        prevPayments: prevPaid._count._all,
        peakMonth: peakMonth?.key ?? null,
        peakCollectionMonth: peakCollectionMonth?.key ?? null,
      },
      paymentStatus,
      months: monthRows,
      years: [...years.values()].sort((a, b) => a.year - b.year),
      methods: [...methods.values()].sort((a, b) => b.amount - a.amount),
      departments: [...deptRevenue.values()].sort((a, b) => b.amount - a.amount),
      doctors: [...doctors.values()].sort((a, b) => b.billed - a.billed).slice(0, 10),
    });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to load monthly / annual account.");
    return NextResponse.json({ error: message }, { status });
  }
}
