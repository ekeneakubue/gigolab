import { NextResponse } from "next/server";

import { getCompanySession } from "@/lib/company-auth";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getCompanySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const ageGroups = await prisma.ageGroup.findMany({
      where: { companyId: session.companyId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(ageGroups);
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to load age groups.");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  const session = await getCompanySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      fromYears?: number;
      fromMonths?: number;
      fromDays?: number;
      toYears?: number;
      toMonths?: number;
      toDays?: number;
    };

    const name = body.name?.trim() ?? "";
    const fromYears = Math.trunc(Number(body.fromYears ?? 0));
    const fromMonths = Math.trunc(Number(body.fromMonths ?? 0));
    const fromDays = Math.trunc(Number(body.fromDays ?? 0));
    const toYears = Math.trunc(Number(body.toYears ?? 0));
    const toMonths = Math.trunc(Number(body.toMonths ?? 0));
    const toDays = Math.trunc(Number(body.toDays ?? 0));

    if (!name) {
      return NextResponse.json({ error: "Group name is required." }, { status: 400 });
    }
    if ([fromYears, fromMonths, fromDays, toYears, toMonths, toDays].some((v) => v < 0)) {
      return NextResponse.json({ error: "Age values must be non-negative." }, { status: 400 });
    }

    const created = await prisma.ageGroup.create({
      data: {
        companyId: session.companyId,
        name,
        fromYears,
        fromMonths,
        fromDays,
        toYears,
        toMonths,
        toDays,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to create age group.");
    return NextResponse.json({ error: message }, { status });
  }
}
