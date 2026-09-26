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
    const packages = await prisma.package.findMany({
      where: { companyId: session.companyId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(packages);
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to load packages.");
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

    const created = await prisma.package.create({
      data: {
        companyId: session.companyId,
        name,
        amount,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to create package.");
    return NextResponse.json({ error: message }, { status });
  }
}
