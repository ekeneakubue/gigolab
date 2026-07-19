import { NextResponse } from "next/server";
import type { AccountStatus } from "@prisma/client";

import { hashPassword } from "@/lib/password";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

function toInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  return initials || "NC";
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      name?: string;
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
    const password = body.password?.trim() ?? "";
    const logoUrl =
      body.logoUrl === undefined ? undefined : body.logoUrl?.trim() || null;

    if (!name || !location || !contactEmail) {
      return NextResponse.json(
        { error: "Name, location, and contact email are required." },
        { status: 400 }
      );
    }

    const existing = await prisma.company.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Company not found." }, { status: 404 });
    }

    const status = body.status ?? existing.status;

    const updated = await prisma.company.update({
      where: { id },
      data: {
        name,
        initials: toInitials(name),
        location,
        status,
        contactEmail,
        phone,
        ...(logoUrl !== undefined ? { logoUrl } : {}),
        ...(password ? { passwordHash: hashPassword(password) } : {}),
        lastActiveAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to update company.");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const existing = await prisma.company.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Company not found." }, { status: 404 });
    }

    await prisma.company.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to delete company.");
    return NextResponse.json({ error: message }, { status });
  }
}
