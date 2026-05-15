import { NextResponse } from "next/server";
import { CompanyPlan, type AccountStatus } from "@prisma/client";

import { generateCompanyCode, isValidCompanyCode } from "@/lib/company-code";
import { hashPassword } from "@/lib/password";
import { isUniqueConstraintError, prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

function toInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  return initials || "NC";
}

function buildCodeCandidates(preferred?: string) {
  const candidates: string[] = [];
  if (preferred && isValidCompanyCode(preferred)) {
    candidates.push(preferred);
  }
  for (let attempt = 0; attempt < 12; attempt++) {
    candidates.push(generateCompanyCode());
  }
  return candidates;
}

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(companies);
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to load companies.");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      code?: string;
      password?: string;
      location?: string;
      status?: AccountStatus;
      contact?: string;
      phone?: string;
      logoUrl?: string | null;
    };

    const name = body.name?.trim() ?? "";
    const location = body.location?.trim() ?? "";
    const contactEmail = body.contact?.trim() ?? "";
    const phone = body.phone?.trim() ?? null;
    const password = body.password ?? "";
    const logoUrl = body.logoUrl?.trim() || null;

    if (!name || !location || !contactEmail) {
      return NextResponse.json(
        { error: "Name, location, and contact email are required." },
        { status: 400 }
      );
    }

    if (!password.trim()) {
      return NextResponse.json(
        { error: "Password is required." },
        { status: 400 }
      );
    }

    const status = body.status ?? "Active";
    const passwordHash = hashPassword(password);
    const candidates = buildCodeCandidates(body.code?.trim());

    for (const code of candidates) {
      try {
        const created = await prisma.company.create({
          data: {
            code,
            passwordHash,
            name,
            initials: toInitials(name),
            location,
            plan: CompanyPlan.Base,
            status,
            contactEmail,
            phone,
            logoUrl,
          },
        });

        return NextResponse.json(created, { status: 201 });
      } catch (error) {
        if (isUniqueConstraintError(error, "code")) continue;
        throw error;
      }
    }

    return NextResponse.json(
      { error: "Could not allocate a unique lab code. Please try again." },
      { status: 500 }
    );
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to create company.");
    return NextResponse.json({ error: message }, { status });
  }
}
