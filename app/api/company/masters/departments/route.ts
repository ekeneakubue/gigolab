import { NextResponse } from "next/server";

import { getCompanySession } from "@/lib/company-auth";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

function parseSubDepartments(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

export async function GET() {
  const session = await getCompanySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const departments = await prisma.department.findMany({
      where: { companyId: session.companyId },
      include: { subDepartments: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(departments);
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to load departments.");
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
      accountName?: string;
      firmName?: string;
      subDepartments?: unknown;
    };

    const name = body.name?.trim() ?? "";
    const accountName = body.accountName?.trim() ?? "";
    const firmName = body.firmName?.trim() ?? "";
    const subDepartments = parseSubDepartments(body.subDepartments);

    if (!name) {
      return NextResponse.json({ error: "Department name is required." }, { status: 400 });
    }
    if (!accountName) {
      return NextResponse.json({ error: "A/c name is required." }, { status: 400 });
    }
    if (!firmName) {
      return NextResponse.json({ error: "Firm name is required." }, { status: 400 });
    }

    const created = await prisma.department.create({
      data: {
        companyId: session.companyId,
        name,
        accountName,
        firmName,
        subDepartments: {
          create: subDepartments.map((subName) => ({ name: subName })),
        },
      },
      include: { subDepartments: { orderBy: { createdAt: "asc" } } },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to create department.");
    return NextResponse.json({ error: message }, { status });
  }
}
