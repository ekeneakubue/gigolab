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

async function findOwnedDepartment(id: string, companyId: string) {
  return prisma.department.findFirst({
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
    const existing = await findOwnedDepartment(id, session.companyId);
    if (!existing) {
      return NextResponse.json({ error: "Department not found." }, { status: 404 });
    }

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

    const updated = await prisma.$transaction(async (tx) => {
      await tx.subDepartment.deleteMany({ where: { departmentId: id } });
      return tx.department.update({
        where: { id },
        data: {
          name,
          accountName,
          firmName,
          subDepartments: {
            create: subDepartments.map((subName) => ({ name: subName })),
          },
        },
        include: { subDepartments: { orderBy: { createdAt: "asc" } } },
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to update department.");
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
    const existing = await findOwnedDepartment(id, session.companyId);
    if (!existing) {
      return NextResponse.json({ error: "Department not found." }, { status: 404 });
    }

    await prisma.department.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to delete department.");
    return NextResponse.json({ error: message }, { status });
  }
}
