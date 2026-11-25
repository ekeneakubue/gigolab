import { NextResponse } from "next/server";

import { getCompanySession } from "@/lib/company-auth";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAYS = 366;

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
    const span = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - span);

    const itemSelect = {
      testId: true,
      amount: true,
      request: { select: { requestedAt: true, patientId: true } },
    } as const;

    const [catalogue, packages, currentItems, previousItems, lastOrdered] = await Promise.all([
      prisma.test.findMany({
        where: { companyId },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          amount: true,
          testMrp: true,
          doneFor: true,
          department: { select: { id: true, name: true } },
          subDepartment: { select: { name: true } },
        },
      }),
      prisma.package.findMany({
        where: { companyId },
        orderBy: { name: "asc" },
        select: { id: true, name: true, amount: true },
      }),
      prisma.testRequestItem.findMany({
        where: { request: { companyId, requestedAt: { gte: from, lt: to } } },
        select: itemSelect,
      }),
      prisma.testRequestItem.findMany({
        where: { request: { companyId, requestedAt: { gte: prevFrom, lt: from } } },
        select: { testId: true, amount: true },
      }),
      prisma.testRequestItem.groupBy({
        by: ["testId"],
        where: { request: { companyId } },
        _max: { createdAt: true },
      }),
    ]);

    const lastOrderedById = new Map(lastOrdered.map((row) => [row.testId, row._max.createdAt]));

    type Usage = { orders: number; revenue: number; discount: number; patients: Set<string> };
    const usage = new Map<string, Usage>();
    const listPriceById = new Map(catalogue.map((test) => [test.id, test.amount]));

    const dayCount = Math.max(1, Math.ceil(span / DAY_MS));
    const daily = Array.from({ length: dayCount }, (_, index) => ({
      date: new Date(from.getTime() + index * DAY_MS).toISOString(),
      orders: 0,
      revenue: 0,
    }));

    const allPatients = new Set<string>();
    let revenue = 0;
    let discount = 0;

    for (const item of currentItems) {
      const row = usage.get(item.testId) ?? { orders: 0, revenue: 0, discount: 0, patients: new Set<string>() };
      const listPrice = listPriceById.get(item.testId) ?? item.amount;
      const itemDiscount = Math.max(0, listPrice - item.amount);
      row.orders += 1;
      row.revenue += item.amount;
      row.discount += itemDiscount;
      row.patients.add(item.request.patientId);
      usage.set(item.testId, row);

      allPatients.add(item.request.patientId);
      revenue += item.amount;
      discount += itemDiscount;

      const dayIndex = Math.floor((item.request.requestedAt.getTime() - from.getTime()) / DAY_MS);
      const day = daily[Math.min(dayCount - 1, Math.max(0, dayIndex))];
      day.orders += 1;
      day.revenue += item.amount;
    }

    const previous = new Map<string, { orders: number; revenue: number }>();
    let prevRevenue = 0;
    for (const item of previousItems) {
      const row = previous.get(item.testId) ?? { orders: 0, revenue: 0 };
      row.orders += 1;
      row.revenue += item.amount;
      previous.set(item.testId, row);
      prevRevenue += item.amount;
    }

    const services = catalogue.map((test) => {
      const used = usage.get(test.id);
      const prev = previous.get(test.id);
      return {
        id: test.id,
        name: test.name,
        department: test.department.name,
        subDepartment: test.subDepartment?.name ?? "",
        doneFor: test.doneFor,
        listPrice: test.amount,
        mrp: test.testMrp,
        orders: used?.orders ?? 0,
        revenue: used?.revenue ?? 0,
        discount: used?.discount ?? 0,
        patients: used?.patients.size ?? 0,
        avgPrice: used && used.orders > 0 ? used.revenue / used.orders : 0,
        prevOrders: prev?.orders ?? 0,
        prevRevenue: prev?.revenue ?? 0,
        lastOrderedAt: lastOrderedById.get(test.id)?.toISOString() ?? null,
      };
    });

    const departments = new Map<
      string,
      { name: string; services: number; used: number; orders: number; revenue: number }
    >();
    for (const service of services) {
      const row = departments.get(service.department) ?? {
        name: service.department,
        services: 0,
        used: 0,
        orders: 0,
        revenue: 0,
      };
      row.services += 1;
      if (service.orders > 0) row.used += 1;
      row.orders += service.orders;
      row.revenue += service.revenue;
      departments.set(service.department, row);
    }

    const servicesUsed = services.filter((service) => service.orders > 0).length;

    return NextResponse.json({
      range: { from: from.toISOString(), to: to.toISOString() },
      summary: {
        catalogueSize: catalogue.length,
        servicesUsed,
        unused: catalogue.length - servicesUsed,
        orders: currentItems.length,
        prevOrders: previousItems.length,
        revenue,
        prevRevenue,
        discount,
        patients: allPatients.size,
        avgPrice: currentItems.length > 0 ? revenue / currentItems.length : 0,
        packages: packages.length,
      },
      daily,
      departments: [...departments.values()].sort((a, b) => b.revenue - a.revenue || b.services - a.services),
      services,
      packages,
    });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to load services report.");
    return NextResponse.json({ error: message }, { status });
  }
}
