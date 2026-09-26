import { NextResponse } from "next/server";

import { getCompanySession } from "@/lib/company-auth";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

async function findOwnedAgeGroup(id: string, companyId: string) {
  return prisma.ageGroup.findFirst({
    where: { id, companyId },
    select: { id: true },
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getCompanySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const existing = await findOwnedAgeGroup(id, session.companyId);
    if (!existing) {
      return NextResponse.json({ error: "Age group not found." }, { status: 404 });
    }

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

    const updated = await prisma.ageGroup.update({
      where: { id },
      data: {
        name,
        fromYears,
        fromMonths,
        fromDays,
        toYears,
        toMonths,
        toDays,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to update age group.");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getCompanySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const existing = await findOwnedAgeGroup(id, session.companyId);
    if (!existing) {
      return NextResponse.json({ error: "Age group not found." }, { status: 404 });
    }

    await prisma.ageGroup.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to delete age group.");
    return NextResponse.json({ error: message }, { status });
  }
}
