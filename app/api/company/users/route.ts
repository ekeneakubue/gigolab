import { NextResponse } from "next/server";
import { Prisma, type AccountStatus, type UserRole } from "@prisma/client";

import { getCompanySession } from "@/lib/company-auth";
import { hashPassword } from "@/lib/password";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import { persistImageReference, storageErrorStatus } from "@/lib/r2";
import { parseUserRole, toRoleLabel } from "@/lib/user-role";

/** Roles a company can assign to its own staff from the portal. */
const COMPANY_ROLE_OPTIONS: UserRole[] = ["LabTechnician", "LabHR"];

const userInclude = {
  companyRole: { select: { id: true, name: true, dashboardRoute: true } },
  branch: { select: { id: true, name: true, code: true } },
} satisfies Prisma.UserInclude;

function toInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
  return initials || "NA";
}

function parseCompanyRole(value: string | undefined): UserRole | null {
  if (!value) return COMPANY_ROLE_OPTIONS[0];
  const role = parseUserRole(value);
  return role && COMPANY_ROLE_OPTIONS.includes(role) ? role : null;
}

function mapUser(
  user: Prisma.UserGetPayload<{ include: typeof userInclude }>,
) {
  return {
    id: user.id,
    name: user.name,
    initials: user.initials,
    email: user.email,
    imageUrl: user.imageUrl,
    role: user.companyRole?.name ?? toRoleLabel(user.role),
    companyRoleId: user.companyRoleId,
    dashboardRoute: user.companyRole?.dashboardRoute ?? null,
    branchId: user.branchId,
    branchName: user.branch?.name ?? null,
    branchCode: user.branch?.code ?? null,
    status: user.status,
    accessLabel: user.accessLabel,
    lastSeenAt: user.lastSeenAt,
    createdAt: user.createdAt,
  };
}

export async function GET() {
  const session = await getCompanySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      where: { companyId: session.companyId },
      include: userInclude,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users.map(mapUser));
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to load users.");
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
      email?: string;
      password?: string;
      role?: string;
      companyRoleId?: string | null;
      branchId?: string | null;
      status?: AccountStatus;
      imageUrl?: string | null;
    };

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const imageUrl = await persistImageReference(body.imageUrl?.trim() || null, "avatars");
    const companyRoleId = body.companyRoleId?.trim() || null;
    const branchId = body.branchId?.trim() || null;
    const status = body.status ?? "Active";

    let role = parseCompanyRole(body.role);
    if (companyRoleId) {
      const companyRole = await prisma.companyRole.findFirst({
        where: { id: companyRoleId, companyId: session.companyId },
        select: { id: true },
      });
      if (!companyRole) {
        return NextResponse.json({ error: "Choose a valid company role." }, { status: 400 });
      }
      role = role ?? "LabTechnician";
    }

    if (branchId) {
      const branch = await prisma.branch.findFirst({
        where: { id: branchId, companyId: session.companyId },
        select: { id: true },
      });
      if (!branch) {
        return NextResponse.json({ error: "Choose a valid branch." }, { status: 400 });
      }
    }

    if (!role) {
      return NextResponse.json({ error: "Choose a valid role." }, { status: 400 });
    }

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
    }

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          companyId: session.companyId,
          companyRoleId,
          branchId,
          name,
          initials: toInitials(name),
          email,
          role,
          status,
          accessLabel: "Tests limited",
          passwordHash: hashPassword(password),
          imageUrl,
        },
        include: userInclude,
      });

      await tx.company.update({
        where: { id: session.companyId },
        data: { userCount: { increment: 1 } },
      });

      return user;
    });

    return NextResponse.json(mapUser(created), { status: 201 });
  } catch (error) {
    const storageError = storageErrorStatus(error);
    if (storageError) {
      return NextResponse.json({ error: storageError.message }, { status: storageError.status });
    }
    const { status, message } = prismaErrorResponse(error, "Failed to create user.");
    return NextResponse.json({ error: message }, { status });
  }
}
