import { NextResponse } from "next/server";
import type { AccountStatus } from "@prisma/client";

import { generateBranchCode, isValidBranchCode } from "@/lib/branch-code";
import { getCompanySession } from "@/lib/company-auth";
import { isUniqueConstraintError, prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

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

export async function GET() {
  const session = await getCompanySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const branches = await prisma.branch.findMany({
      where: { companyId: session.companyId },
      orderBy: [{ isMain: "desc" }, { name: "asc" }],
    });
    return NextResponse.json({
      companyName: session.name,
      branches: branches.map(mapBranch),
    });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to load branches.");
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
      code?: string;
      name?: string;
      location?: string;
      address?: string;
      phone?: string;
      email?: string;
      isMain?: boolean;
      status?: AccountStatus;
    };

    const name = body.name?.trim() ?? "";
    const location = body.location?.trim() ?? "";
    const address = body.address?.trim() ?? "";
    const phone = body.phone?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const isMain = Boolean(body.isMain);
    const status = body.status ?? "Active";
    const requestedCode = body.code?.trim().toUpperCase() ?? "";

    if (!name) {
      return NextResponse.json({ error: "Branch name is required." }, { status: 400 });
    }
    if (!location) {
      return NextResponse.json({ error: "Location is required." }, { status: 400 });
    }

    const codeCandidates = requestedCode
      ? [requestedCode]
      : Array.from({ length: 8 }, () => generateBranchCode());

    if (requestedCode && !isValidBranchCode(requestedCode)) {
      return NextResponse.json(
        { error: "Branch code must look like BR-XXXX." },
        { status: 400 },
      );
    }

    for (const code of codeCandidates) {
      try {
        const created = await prisma.$transaction(async (tx) => {
          if (isMain) {
            await tx.branch.updateMany({
              where: { companyId: session.companyId, isMain: true },
              data: { isMain: false },
            });
          }

          return tx.branch.create({
            data: {
              companyId: session.companyId,
              code,
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

        return NextResponse.json(mapBranch(created), { status: 201 });
      } catch (error) {
        if (isUniqueConstraintError(error, "code")) {
          if (requestedCode) {
            return NextResponse.json(
              { error: "That branch code is already in use." },
              { status: 409 },
            );
          }
          continue;
        }
        throw error;
      }
    }

    return NextResponse.json(
      { error: "Could not allocate a unique branch code. Please try again." },
      { status: 500 },
    );
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to create branch.");
    return NextResponse.json({ error: message }, { status });
  }
}
