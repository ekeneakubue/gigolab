import { NextResponse } from "next/server";
import type { AccountStatus } from "@prisma/client";

import { getCompanySession } from "@/lib/company-auth";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

function mapBranch(branch: {
  id: string;
  code: string;
  name: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  isMain: boolean;
  status: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: branch.id,
    code: branch.code,
    name: branch.name,
    location: branch.location,
    address: branch.address,
    phone: branch.phone,
    email: branch.email,
    isMain: branch.isMain,
    status: branch.status,
    createdAt: branch.createdAt,
    updatedAt: branch.updatedAt,
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getCompanySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const existing = await prisma.branch.findFirst({
      where: { id, companyId: session.companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Branch not found." }, { status: 404 });
    }

    const body = (await request.json()) as {
      name?: string;
      location?: string;
      address?: string;
      phone?: string;
      email?: string;
      isMain?: boolean;
      status?: AccountStatus;
    };

    const name = body.name?.trim() ?? existing.name;
    const location =
      body.location !== undefined ? body.location.trim() : existing.location;
    const address =
      body.address !== undefined ? body.address.trim() : existing.address;
    const phone = body.phone !== undefined ? body.phone.trim() : existing.phone;
    const email =
      body.email !== undefined ? body.email.trim().toLowerCase() : existing.email;
    const isMain = body.isMain !== undefined ? Boolean(body.isMain) : existing.isMain;
    const status = body.status ?? existing.status;

    if (!name) {
      return NextResponse.json({ error: "Branch name is required." }, { status: 400 });
    }
    if (!location) {
      return NextResponse.json({ error: "Location is required." }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (isMain && !existing.isMain) {
        await tx.branch.updateMany({
          where: { companyId: session.companyId, isMain: true, NOT: { id } },
          data: { isMain: false },
        });
      }

      return tx.branch.update({
        where: { id },
        data: {
          name,
          location,
          address,
          phone,
          email,
          isMain,
          status,
        },
      });
    });

    return NextResponse.json(mapBranch(updated));
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to update branch.");
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
    const existing = await prisma.branch.findFirst({
      where: { id, companyId: session.companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Branch not found." }, { status: 404 });
    }

    await prisma.branch.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to delete branch.");
    return NextResponse.json({ error: message }, { status });
  }
}
