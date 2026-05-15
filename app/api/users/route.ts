import { NextResponse } from "next/server";
import { Prisma, type AccountStatus, type UserRole } from "@prisma/client";

import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

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
    role: user.role === "LabManager" ? "Lab Manager" : user.role,
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
      email?: string;
      password?: string;
      role?: UserRole;
      status?: AccountStatus;
      imageUrl?: string | null;
    };

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const imageUrl = body.imageUrl?.trim() || null;
    const role = body.role ?? "Staff";
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

    return NextResponse.json(mapUserForApi(created), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
  }
}
