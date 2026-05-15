import { NextResponse } from "next/server";
import { Prisma, type AccountStatus, type UserRole } from "@prisma/client";

import { getCompanySession } from "@/lib/company-auth";
import { hashPassword } from "@/lib/password";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

const COMPANY_ROLE_OPTIONS: UserRole[] = [
  "Staff",
  "Technician",
  "Receptionist",
  "Supervisor",
  "LabManager",
];

function toInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
  return initials || "NA";
}

function parseRole(value: string | undefined): UserRole {
  if (!value) return "Staff";
  if (value === "Lab Manager") return "LabManager";
  if (COMPANY_ROLE_OPTIONS.includes(value as UserRole)) return value as UserRole;
  return "Staff";
}

function mapUser(user: Prisma.UserGetPayload<object>) {
  return {
    id: user.id,
    name: user.name,
    initials: user.initials,
    email: user.email,
    imageUrl: user.imageUrl,
    role: user.role === "LabManager" ? "Lab Manager" : user.role,
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
      status?: AccountStatus;
      imageUrl?: string | null;
    };

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const imageUrl = body.imageUrl?.trim() || null;
    const role = parseRole(body.role);
    const status = body.status ?? "Active";

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

    const created = await prisma.user.create({
      data: {
        companyId: session.companyId,
        name,
        initials: toInitials(name),
        email,
        role,
        status,
        accessLabel: "Tests limited",
        passwordHash: hashPassword(password),
        imageUrl,
      },
    });

    return NextResponse.json(mapUser(created), { status: 201 });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to create user.");
    return NextResponse.json({ error: message }, { status });
  }
}
