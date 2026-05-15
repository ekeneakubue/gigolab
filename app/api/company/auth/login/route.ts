import { NextResponse } from "next/server";

import {
  companySessionCookieOptions,
  createCompanySessionToken,
} from "@/lib/company-auth";
import { isValidCompanyCode } from "@/lib/company-code";
import { verifyPassword } from "@/lib/password";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      code?: string;
      password?: string;
    };

    const code = body.code?.trim() ?? "";
    const password = body.password ?? "";

    if (!code || !password) {
      return NextResponse.json(
        { error: "Lab code and password are required." },
        { status: 400 }
      );
    }

    if (!isValidCompanyCode(code)) {
      return NextResponse.json(
        { error: "Invalid lab code format." },
        { status: 400 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        name: true,
        initials: true,
        passwordHash: true,
        status: true,
      },
    });

    if (!company || !verifyPassword(password, company.passwordHash)) {
      return NextResponse.json(
        { error: "Invalid lab code or password." },
        { status: 401 }
      );
    }

    if (company.status === "Inactive") {
      return NextResponse.json(
        { error: "This lab account is inactive. Contact your administrator." },
        { status: 403 }
      );
    }

    await prisma.company.update({
      where: { id: company.id },
      data: { lastActiveAt: new Date() },
    });

    const token = await createCompanySessionToken({
      companyId: company.id,
      code: company.code,
      name: company.name,
      initials: company.initials,
    });

    const response = NextResponse.json({
      company: {
        id: company.id,
        code: company.code,
        name: company.name,
        initials: company.initials,
      },
    });

    response.cookies.set(companySessionCookieOptions(token));
    return response;
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Could not sign in.");
    return NextResponse.json({ error: message }, { status });
  }
}
