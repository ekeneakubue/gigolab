import { NextResponse } from "next/server";

import { getCompanySession } from "@/lib/company-auth";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDay(url: URL) {
  const from = new Date(url.searchParams.get("from") ?? "");
  const to = new Date(url.searchParams.get("to") ?? "");
  if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && to > from) {
    return { from, to };
  }
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return { from: start, to: new Date(start.getTime() + DAY_MS) };
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
    const { from, to } = parseDay(new URL(request.url));
    const prevFrom = new Date(from.getTime() - DAY_MS);
    const range = { gte: from, lt: to };
    const prevRange = { gte: prevFrom, lt: from };

    const requestSelect = {
      id: true,
      requestCode: true,
      requestedAt: true,
      paidAt: true,
      totalAmount: true,
      amountPaid: true,
      paymentStatus: true,
      paymentMethod: true,
      paymentRef: true,
      patient: { select: { name: true, patientCode: true } },
      doctor: { select: { name: true } },
    } as const;

    const [billedToday, paidToday, billedYesterday, paidYesterday, openingDues] = await Promise.all([
      prisma.testRequest.findMany({
        where: { companyId, requestedAt: range },
        orderBy: { requestedAt: "asc" },
        select: requestSelect,
      }),
      prisma.testRequest.findMany({
        where: { companyId, paidAt: range },
        orderBy: { paidAt: "asc" },
        select: requestSelect,
      }),
      prisma.testRequest.aggregate({
        where: { companyId, requestedAt: prevRange },
        _sum: { totalAmount: true, amountPaid: true },
        _count: { _all: true },
      }),
      prisma.testRequest.aggregate({
        where: { companyId, paidAt: prevRange },
        _sum: { amountPaid: true },
        _count: { _all: true },
      }),
      prisma.testRequest.aggregate({
        where: {
          companyId,
          requestedAt: { lt: from },
          paymentStatus: { in: ["Unpaid", "Partial"] },
        },
        _sum: { totalAmount: true, amountPaid: true },
        _count: { _all: true },
      }),
    ]);

    const billedAmount = billedToday.reduce((sum, row) => sum + row.totalAmount, 0);
    const paidAgainstToday = billedToday.reduce((sum, row) => sum + row.amountPaid, 0);
    const outstandingToday = Math.max(0, billedAmount - paidAgainstToday);
    const collectedAmount = paidToday.reduce((sum, row) => sum + row.amountPaid, 0);

    const openingOutstanding = Math.max(
      0,
      (openingDues._sum.totalAmount ?? 0) - (openingDues._sum.amountPaid ?? 0),
    );

    const paymentStatus = { Paid: 0, Partial: 0, Unpaid: 0 };
    for (const row of billedToday) paymentStatus[row.paymentStatus] += 1;

    const methods = new Map<string, { method: string; count: number; amount: number; sameDay: number; arrears: number }>();
    let sameDayCollections = 0;
    let arrearsCollections = 0;

    const payments = paidToday.map((row) => {
      const method = methodKey(row.paymentMethod);
      const sameDay = row.requestedAt >= from && row.requestedAt < to;
      if (sameDay) sameDayCollections += row.amountPaid;
      else arrearsCollections += row.amountPaid;

      const entry = methods.get(method) ?? { method, count: 0, amount: 0, sameDay: 0, arrears: 0 };
      entry.count += 1;
      entry.amount += row.amountPaid;
      if (sameDay) entry.sameDay += row.amountPaid;
      else entry.arrears += row.amountPaid;
      methods.set(method, entry);

      return {
        id: row.id,
        requestCode: row.requestCode,
        patientName: row.patient.name,
        patientCode: row.patient.patientCode,
        doctorName: row.doctor?.name ?? "",
        billedAt: row.requestedAt.toISOString(),
        paidAt: row.paidAt?.toISOString() ?? from.toISOString(),
        totalAmount: row.totalAmount,
        amountPaid: row.amountPaid,
        balance: Math.max(0, row.totalAmount - row.amountPaid),
        paymentStatus: row.paymentStatus,
        paymentMethod: method,
        paymentRef: row.paymentRef,
        sameDay,
      };
    });

    const dues = billedToday
      .filter((row) => row.paymentStatus !== "Paid")
      .map((row) => ({
        id: row.id,
        requestCode: row.requestCode,
        patientName: row.patient.name,
        patientCode: row.patient.patientCode,
        doctorName: row.doctor?.name ?? "",
        billedAt: row.requestedAt.toISOString(),
        totalAmount: row.totalAmount,
        amountPaid: row.amountPaid,
        balance: Math.max(0, row.totalAmount - row.amountPaid),
        paymentStatus: row.paymentStatus,
        paymentMethod: methodKey(row.paymentMethod),
      }))
      .sort((a, b) => b.balance - a.balance);

    const doctors = new Map<string, { name: string; bills: number; billed: number; collected: number; outstanding: number }>();
    for (const row of billedToday) {
      const name = row.doctor?.name ?? "Self / walk-in";
      const entry = doctors.get(name) ?? { name, bills: 0, billed: 0, collected: 0, outstanding: 0 };
      entry.bills += 1;
      entry.billed += row.totalAmount;
      entry.collected += row.amountPaid;
      entry.outstanding += Math.max(0, row.totalAmount - row.amountPaid);
      doctors.set(name, entry);
    }

    const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, billed: 0, collected: 0 }));
    for (const row of billedToday) {
      hourly[row.requestedAt.getHours()].billed += row.totalAmount;
    }
    for (const row of paidToday) {
      if (row.paidAt) hourly[row.paidAt.getHours()].collected += row.amountPaid;
    }

    const cashMethods = new Set(["Cash"]);
    const methodRows = [...methods.values()].sort((a, b) => b.amount - a.amount);
    const cashCollected = methodRows
      .filter((row) => cashMethods.has(row.method))
      .reduce((sum, row) => sum + row.amount, 0);
    const nonCashCollected = collectedAmount - cashCollected;

    const prevBilled = billedYesterday._sum.totalAmount ?? 0;
    const prevPaidOnBilled = billedYesterday._sum.amountPaid ?? 0;

    return NextResponse.json({
      range: { from: from.toISOString(), to: to.toISOString() },
      summary: {
        bills: billedToday.length,
        billed: billedAmount,
        collected: collectedAmount,
        payments: paidToday.length,
        outstanding: outstandingToday,
        paidAgainstToday,
        sameDayCollections,
        arrearsCollections,
        openingDues: openingOutstanding,
        openingDueBills: openingDues._count._all,
        cashCollected,
        nonCashCollected,
        collectionRate: billedAmount > 0 ? Math.min(100, (paidAgainstToday / billedAmount) * 100) : 0,
        prevBilled,
        prevCollected: paidYesterday._sum.amountPaid ?? 0,
        prevOutstanding: Math.max(0, prevBilled - prevPaidOnBilled),
        prevBills: billedYesterday._count._all,
        prevPayments: paidYesterday._count._all,
      },
      paymentStatus,
      methods: methodRows,
      hourly,
      doctors: [...doctors.values()].sort((a, b) => b.billed - a.billed).slice(0, 8),
      payments,
      dues,
    });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to load daily account summary.");
    return NextResponse.json({ error: message }, { status });
  }
}
