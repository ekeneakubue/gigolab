import { NextResponse } from "next/server";
import type { AccountStatus } from "@prisma/client";

import { getCompanySession } from "@/lib/company-auth";
import { isUniqueConstraintError, prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

function mapInsuranceType(item: {
  id: string;
  name: string;
  code: string;
  description: string;
  status: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    name: item.name,
    code: item.code,
    description: item.description,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getCompanySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const existing = await prisma.insuranceType.findFirst({
      where: { id, companyId: session.companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Insurance type not found." }, { status: 404 });
    }

    const body = (await request.json()) as {
      name?: string;
      code?: string;
      description?: string;
      status?: AccountStatus;
    };

    const name = body.name?.trim() ?? existing.name;
    const code =
      body.code !== undefined ? body.code.trim().toUpperCase() : existing.code;
    const description =
      body.description !== undefined ? body.description.trim() : existing.description;
    const status = body.status ?? existing.status;

    if (!name) {
      return NextResponse.json({ error: "Insurance type name is required." }, { status: 400 });
    }

    const updated = await prisma.insuranceType.update({
      where: { id },
      data: { name, code, description, status },
    });

    return NextResponse.json(mapInsuranceType(updated));
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "An insurance type with this name already exists." },
        { status: 409 },
      );
    }
    const { status, message } = prismaErrorResponse(error, "Failed to update insurance type.");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getCompanySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const existing = await prisma.insuranceType.findFirst({
      where: { id, companyId: session.companyId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Insurance type not found." }, { status: 404 });
    }

    await prisma.insuranceType.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to delete insurance type.");
    return NextResponse.json({ error: message }, { status });
  }
}
