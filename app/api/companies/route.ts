import { NextResponse } from "next/server";
import { CompanyPlan, type AccountStatus } from "@prisma/client";

import { generateDemoCompanyCode, isDemoCompanyCode } from "@/lib/company-demo";
import { generateCompanyCode, isValidCompanyCode } from "@/lib/company-code";
import { hashPassword } from "@/lib/password";
import { isUniqueConstraintError, prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import { persistImageReference, storageErrorStatus } from "@/lib/r2";

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
  if (preferred && isDemoCompanyCode(preferred)) {
    for (let attempt = 0; attempt < 12; attempt++) {
      candidates.push(generateDemoCompanyCode());
    }
    return candidates;
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
    const logoUrl = await persistImageReference(body.logoUrl?.trim() || null, "logos");

    if (!name || !location) {
      return NextResponse.json(
        { error: "Name and location are required." },
        { status: 400 }
      );
    }

    const requestedCode = body.code?.trim();
    const status = body.status ?? (requestedCode && isDemoCompanyCode(requestedCode) ? "Trial" : "Active");
    // Portal sign-in is per user; when no company password is supplied, store an unguessable one.
    const passwordHash = hashPassword(password.trim() || crypto.randomUUID());
    const candidates = buildCodeCandidates(requestedCode);

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
        if (isUniqueConstraintError(error, "code")) {
          continue;
        }
        throw error;
      }
    }

    return NextResponse.json(
      { error: "Could not allocate a unique lab code. Please try again." },
      { status: 500 }
    );
  } catch (error) {
    const storageError = storageErrorStatus(error);
    if (storageError) {
      return NextResponse.json({ error: storageError.message }, { status: storageError.status });
    }
    const { status, message } = prismaErrorResponse(error, "Failed to create company.");
    return NextResponse.json({ error: message }, { status });
  }
}
