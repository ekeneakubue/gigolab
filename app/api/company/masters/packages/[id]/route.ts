import { NextResponse } from "next/server";

import { getCompanySession } from "@/lib/company-auth";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

async function findOwnedPackage(id: string, companyId: string) {
  return prisma.package.findFirst({
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
    const existing = await findOwnedPackage(id, session.companyId);
    if (!existing) {
      return NextResponse.json({ error: "Package not found." }, { status: 404 });
    }

    const body = (await request.json()) as {
      name?: string;
      amount?: number;
    };

    const name = body.name?.trim() ?? "";
    const amount = Number(body.amount);

    if (!name) {
      return NextResponse.json({ error: "Package name is required." }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount < 0) {
      return NextResponse.json({ error: "Amount must be a non-negative number." }, { status: 400 });
    }

    const updated = await prisma.package.update({
      where: { id },
      data: { name, amount },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to update package.");
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
    const existing = await findOwnedPackage(id, session.companyId);
    if (!existing) {
      return NextResponse.json({ error: "Package not found." }, { status: 404 });
    }

    await prisma.package.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to delete package.");
    return NextResponse.json({ error: message }, { status });
  }
}
