import { NextResponse } from "next/server";
import { Prisma, type AccountStatus, type UserRole } from "@prisma/client";

import { getCompanySession } from "@/lib/company-auth";
import { hashPassword } from "@/lib/password";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import { deleteStoredImage, persistImageReference, replaceStoredImage, storageErrorStatus } from "@/lib/r2";
import { parseUserRole, toRoleLabel } from "@/lib/user-role";

/** Roles a company can assign to its own staff from the portal. */
const COMPANY_ROLE_OPTIONS: UserRole[] = ["LabTechnician", "LabHR"];

type RouteContext = {
  params: Promise<{ id: string }>;
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

function mapUser(user: Prisma.UserGetPayload<object>) {
  return {
    id: user.id,
    name: user.name,
    initials: user.initials,
    email: user.email,
    imageUrl: user.imageUrl,
    role: toRoleLabel(user.role),
    status: user.status,
    accessLabel: user.accessLabel,
    lastSeenAt: user.lastSeenAt,
    createdAt: user.createdAt,
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getCompanySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
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
    const password = body.password?.trim() ?? "";
    const imageUrl =
      body.imageUrl === undefined
        ? undefined
        : await persistImageReference(body.imageUrl?.trim() || null, "avatars");

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: { id, companyId: session.companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Keep the user's current role when it is not one the portal can assign
    // (e.g. Lab Owner) and the request did not change it.
    let role: UserRole = existing.role;
    if (body.role !== undefined && body.role !== toRoleLabel(existing.role)) {
      const parsed = parseUserRole(body.role);
      if (!parsed || !COMPANY_ROLE_OPTIONS.includes(parsed)) {
        return NextResponse.json({ error: "Choose a valid role." }, { status: 400 });
      }
      role = parsed;
    }

    const emailOwner = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (emailOwner && emailOwner.id !== id) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name,
        initials: toInitials(name),
        email,
        role,
        status: body.status ?? existing.status,
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        ...(password ? { passwordHash: hashPassword(password) } : {}),
      },
    });

    if (imageUrl !== undefined) {
      await replaceStoredImage(existing.imageUrl, imageUrl);
    }

    return NextResponse.json(mapUser(updated));
  } catch (error) {
    const storageError = storageErrorStatus(error);
    if (storageError) {
      return NextResponse.json({ error: storageError.message }, { status: storageError.status });
    }
    const { status, message } = prismaErrorResponse(error, "Failed to update user.");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getCompanySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    const existing = await prisma.user.findFirst({
      where: { id, companyId: session.companyId },
      select: { id: true, imageUrl: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.delete({ where: { id } });
      await tx.company.updateMany({
        where: { id: session.companyId, userCount: { gt: 0 } },
        data: { userCount: { decrement: 1 } },
      });
    });

    await deleteStoredImage(existing.imageUrl);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to delete user.");
    return NextResponse.json({ error: message }, { status });
  }
}
