import { NextResponse } from "next/server";
import { Prisma, type AccountStatus } from "@prisma/client";

import { hashPassword } from "@/lib/password";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import { deleteStoredImage, persistImageReference, replaceStoredImage, storageErrorStatus } from "@/lib/r2";
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

type RouteContext = {
  params: Promise<{ id: string }>;
};

const userInclude = {
  company: {
    select: {
      id: true,
      name: true,
    },
  },
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

function mapUserForApi(
  user: Prisma.UserGetPayload<{ include: typeof userInclude }>
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

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
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
    const password = body.password?.trim() ?? "";
    const imageUrl = await persistImageReference(body.imageUrl?.trim() || null, "avatars");
    const role = parseUserRole(body.role);

    if (!role) {
      return NextResponse.json({ error: "Choose a valid role." }, { status: 400 });
    }

    if (!name || !companyId || !email) {
      return NextResponse.json(
        { error: "Name, company, and email are required." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });
    if (!company) {
      return NextResponse.json({ error: "Select a company." }, { status: 400 });
    }

    const emailOwner = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (emailOwner && emailOwner.id !== id) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
    }

    const status = body.status ?? existing.status;

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          companyId: company.id,
          name,
          initials: toInitials(name),
          email,
          role,
          status,
          imageUrl,
          ...(password ? { passwordHash: hashPassword(password) } : {}),
        },
        include: userInclude,
      });

      if (existing.companyId !== company.id) {
        if (existing.companyId) {
          await tx.company.updateMany({
            where: { id: existing.companyId, userCount: { gt: 0 } },
            data: { userCount: { decrement: 1 } },
          });
        }
        await tx.company.update({
          where: { id: company.id },
          data: { userCount: { increment: 1 } },
        });
      }

      return user;
    });

    await replaceStoredImage(existing.imageUrl, imageUrl);

    return NextResponse.json(mapUserForApi(updated));
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
  try {
    const { id } = await context.params;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.delete({ where: { id } });
      if (existing.companyId) {
        await tx.company.updateMany({
          where: { id: existing.companyId, userCount: { gt: 0 } },
          data: { userCount: { decrement: 1 } },
        });
      }
    });

    await deleteStoredImage(existing.imageUrl);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to delete user.");
    return NextResponse.json({ error: message }, { status });
  }
}
