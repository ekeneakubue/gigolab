import { NextResponse } from "next/server";

import {
  companySessionCookieOptions,
  createCompanySessionToken,
} from "@/lib/company-auth";
import { verifyPassword } from "@/lib/password";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ADMIN_DASHBOARD = "/admin";
const COMPANY_DASHBOARD = "/company";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
      },
      select: {
        id: true,
        role: true,
        status: true,
        passwordHash: true,
        company: {
          select: {
            id: true,
            code: true,
            name: true,
            initials: true,
            status: true,
          },
        },
      },
    });

    if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.status === "Inactive") {
      return NextResponse.json(
        { error: "This account is inactive. Contact your administrator." },
        { status: 403 }
      );
    }

    const now = new Date();

    if (user.role === "Admin") {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastSeenAt: now },
      });

      return NextResponse.json({ redirectTo: ADMIN_DASHBOARD });
    }

    if (!user.company) {
      return NextResponse.json(
        { error: "This account is not linked to a lab. Contact your administrator." },
        { status: 403 }
      );
    }

    if (user.company.status === "Inactive") {
      return NextResponse.json(
        { error: "This lab account is inactive. Contact your administrator." },
        { status: 403 }
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { lastSeenAt: now },
      }),
      prisma.company.update({
        where: { id: user.company.id },
        data: { lastActiveAt: now },
      }),
    ]);

    const token = await createCompanySessionToken({
      companyId: user.company.id,
      code: user.company.code,
      name: user.company.name,
      initials: user.company.initials,
    });

    const response = NextResponse.json({
      redirectTo: COMPANY_DASHBOARD,
      company: {
        id: user.company.id,
        code: user.company.code,
        name: user.company.name,
        initials: user.company.initials,
      },
    });

    response.cookies.set(companySessionCookieOptions(token));
    return response;
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Could not sign in.");
    return NextResponse.json({ error: message }, { status });
  }
}
