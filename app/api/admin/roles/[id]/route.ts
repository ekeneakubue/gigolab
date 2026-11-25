import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { isUniqueConstraintError, prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import {
  buildSystemRoleDashboardRoute,
  mapSystemRole,
  systemRoleKindForName,
} from "@/lib/system-role";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await context.params;
    const existing = await prisma.systemRole.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Role not found." }, { status: 404 });
    }

    const body = (await request.json()) as {
      name?: string;
      description?: string;
      dashboardRoute?: string;
      kind?: string;
      permissionKeys?: string[];
    };

    const name = body.name?.trim() ?? existing.name;
    const kind =
      body.kind === "Admin" || body.kind === "Lab"
        ? body.kind
        : systemRoleKindForName(name);
    const description =
      typeof body.description === "string"
        ? body.description.trim() || existing.description
        : existing.description;
    const dashboardRoute =
      body.dashboardRoute?.trim() ||
      buildSystemRoleDashboardRoute(name) ||
      existing.dashboardRoute;
    const permissionKeys = Array.isArray(body.permissionKeys)
      ? body.permissionKeys.filter((key) => typeof key === "string" && key.trim())
      : existing.permissionKeys;

    if (!name) {
      return NextResponse.json({ error: "Role name is required." }, { status: 400 });
    }
    if (
      !dashboardRoute.startsWith("/admin") &&
      !dashboardRoute.startsWith("/company/dashboards/")
    ) {
      return NextResponse.json(
        { error: "Dashboard route must be under /admin or /company/dashboards/." },
        { status: 400 },
      );
    }
    if (permissionKeys.length === 0) {
      return NextResponse.json(
        { error: "Select at least one feature or permission." },
        { status: 400 },
      );
    }

    const updated = await prisma.systemRole.update({
      where: { id },
      data: {
        name,
        description,
        dashboardRoute,
        kind,
        permissionKeys,
      },
    });

    return NextResponse.json(mapSystemRole(updated));
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "A role with this name or dashboard route already exists." },
        { status: 409 },
      );
    }
    const { status, message } = prismaErrorResponse(error, "Failed to update role.");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await context.params;
    const existing = await prisma.systemRole.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Role not found." }, { status: 404 });
    }

    await prisma.systemRole.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to delete role.");
    return NextResponse.json({ error: message }, { status });
  }
}
