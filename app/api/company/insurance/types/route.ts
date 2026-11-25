import { NextResponse } from "next/server";
import type { AccountStatus } from "@prisma/client";

import { getCompanySession } from "@/lib/company-auth";
import { isUniqueConstraintError, prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

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

export async function GET() {
  const session = await getCompanySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const types = await prisma.insuranceType.findMany({
      where: { companyId: session.companyId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(types.map(mapInsuranceType));
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to load insurance types.");
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
      code?: string;
      description?: string;
      status?: AccountStatus;
    };

    const name = body.name?.trim() ?? "";
    const code = body.code?.trim().toUpperCase() ?? "";
    const description = body.description?.trim() ?? "";
    const status = body.status ?? "Active";

    if (!name) {
      return NextResponse.json({ error: "Insurance type name is required." }, { status: 400 });
    }

    const created = await prisma.insuranceType.create({
      data: {
        companyId: session.companyId,
        name,
        code,
        description,
        status,
      },
    });

    return NextResponse.json(mapInsuranceType(created), { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "An insurance type with this name already exists." },
        { status: 409 },
      );
    }
    const { status, message } = prismaErrorResponse(error, "Failed to create insurance type.");
    return NextResponse.json({ error: message }, { status });
  }
}
