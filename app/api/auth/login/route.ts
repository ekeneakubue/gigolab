import { NextResponse } from "next/server";

import {
  adminSessionCookieOptions,
  clearAdminSessionCookieOptions,
  createAdminSessionToken,
} from "@/lib/admin-auth";
import {
  clearCompanySessionCookieOptions,
  companySessionCookieOptions,
  createCompanySessionToken,
} from "@/lib/company-auth";
import { verifyPassword } from "@/lib/password";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import { toRoleLabel } from "@/lib/user-role";

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
        email: true,
        name: true,
        initials: true,
        role: true,
        status: true,
        passwordHash: true,
        companyRoleId: true,
        companyRole: {
          select: {
            id: true,
            name: true,
            dashboardRoute: true,
          },
        },
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

      const token = await createAdminSessionToken({
        userId: user.id,
        name: user.name,
        email: user.email,
        initials: user.initials,
        role: toRoleLabel(user.role),
      });

      const response = NextResponse.json({ redirectTo: ADMIN_DASHBOARD });
      response.cookies.set(adminSessionCookieOptions(token));
      response.cookies.set(clearCompanySessionCookieOptions());
      return response;
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

    const roleLabel = user.companyRole?.name ?? toRoleLabel(user.role);
    const dashboardRoute = user.companyRole?.dashboardRoute || COMPANY_DASHBOARD;
    const token = await createCompanySessionToken({
      companyId: user.company.id,
      code: user.company.code,
      name: user.company.name,
      initials: user.company.initials,
      userId: user.id,
      userName: user.name,
      userInitials: user.initials,
      role: roleLabel,
      companyRoleId: user.companyRole?.id,
      dashboardRoute: user.companyRole?.dashboardRoute,
    });

    const response = NextResponse.json({
      redirectTo: dashboardRoute,
      company: {
        id: user.company.id,
        code: user.company.code,
        name: user.company.name,
        initials: user.company.initials,
      },
      user: {
        id: user.id,
        name: user.name,
        initials: user.initials,
        role: roleLabel,
        companyRoleId: user.companyRole?.id ?? null,
        dashboardRoute: user.companyRole?.dashboardRoute ?? null,
      },
    });

    response.cookies.set(companySessionCookieOptions(token));
    response.cookies.set(clearAdminSessionCookieOptions());
    return response;
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Could not sign in.");
    return NextResponse.json({ error: message }, { status });
  }
}
