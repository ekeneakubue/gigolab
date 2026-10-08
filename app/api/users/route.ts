import { NextResponse } from "next/server";
import { Prisma, type AccountStatus } from "@prisma/client";

import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { parseUserRole, toRoleLabel } from "@/lib/user-role";

type ApiUserResponse = {
  id: string;
  name: string;
  initials: string;
  email: string;
  imageUrl: string | null;
  role: string;
  status: "Active" | "Trial" | "Inactive";
  accessLabel: string;
  createdAt: Date;
  lastSeenAt: Date | null;
  company: { id: string; name: string } | null;
};

function toInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  return initials || "NA";
}

function mapUserForApi(
  user: Prisma.UserGetPayload<{ include: { company: { select: { id: true; name: true } } } }>
): ApiUserResponse {
  return {
    id: user.id,
    name: user.name,
    initials: user.initials,
    email: user.email,
    imageUrl: user.imageUrl ?? null,
    role: toRoleLabel(user.role),
    status: user.status,
    accessLabel: user.accessLabel,
    createdAt: user.createdAt,
    lastSeenAt: user.lastSeenAt,
    company: user.company ? { id: user.company.id, name: user.company.name } : null,
  };
}

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(users.map(mapUserForApi));
  } catch {
    return NextResponse.json({ error: "Failed to load users." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      companyId?: string;
      email?: string;
      password?: string;
      role?: string;
      status?: AccountStatus;
      imageUrl?: string | null;
    };

    const name = body.name?.trim() ?? "";
    const companyId = body.companyId?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const imageUrl = body.imageUrl?.trim() || null;
    const role = parseUserRole(body.role);
    const status = body.status ?? "Active";

    if (!role) {
      return NextResponse.json({ error: "Choose a valid role." }, { status: 400 });
    }

    if (!name || !companyId || !email || !password) {
      return NextResponse.json(
        { error: "Name, company, email, and password are required." },
        { status: 400 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Select a company." }, { status: 400 });
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
          companyId: company.id,
          name,
          initials: toInitials(name),
          email,
          role,
          status,
          accessLabel: "Tests limited",
          passwordHash: hashPassword(password),
          imageUrl,
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      await tx.company.update({
        where: { id: company.id },
        data: { userCount: { increment: 1 } },
      });

      return user;
    });

    return NextResponse.json(mapUserForApi(created), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
  }
}
