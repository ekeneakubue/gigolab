import { NextResponse } from "next/server";

import { getCompanySession } from "@/lib/company-auth";
import { buildRoleDashboardRoute } from "@/lib/company-role";
import { isUniqueConstraintError, prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

function mapRole(role: {
  id: string;
  name: string;
  description: string;
  dashboardRoute: string;
  permissionKeys: string[];
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    dashboardRoute: role.dashboardRoute,
    permissionKeys: role.permissionKeys,
    permissions:
      role.permissionKeys.length > 0 ? `${role.permissionKeys.length} permissions` : "—",
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getCompanySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await context.params;
    const existing = await prisma.companyRole.findFirst({
      where: { id, companyId: session.companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Role not found." }, { status: 404 });
    }

    const body = (await request.json()) as {
      name?: string;
      description?: string;
      dashboardRoute?: string;
      permissionKeys?: string[];
    };

    const name = body.name?.trim() ?? existing.name;
    const description =
      typeof body.description === "string"
        ? body.description.trim() || "Custom company role."
        : existing.description;
    const dashboardRoute =
      body.dashboardRoute?.trim() ||
      buildRoleDashboardRoute(name) ||
      existing.dashboardRoute;
    const permissionKeys = Array.isArray(body.permissionKeys)
      ? body.permissionKeys.filter((key) => typeof key === "string" && key.trim())
      : existing.permissionKeys;

    if (!name) {
      return NextResponse.json({ error: "Role name is required." }, { status: 400 });
    }
    if (!dashboardRoute.startsWith("/company/dashboards/")) {
      return NextResponse.json(
        { error: "Dashboard route must be under /company/dashboards/." },
        { status: 400 },
      );
    }
    if (permissionKeys.length === 0) {
      return NextResponse.json(
        { error: "Select at least one feature or sub-menu item." },
        { status: 400 },
      );
    }

    const updated = await prisma.companyRole.update({
      where: { id },
      data: {
        name,
        description,
        dashboardRoute,
        permissionKeys,
      },
    });

    return NextResponse.json(mapRole(updated));
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
    const session = await getCompanySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await context.params;
    const existing = await prisma.companyRole.findFirst({
      where: { id, companyId: session.companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Role not found." }, { status: 404 });
    }

    await prisma.companyRole.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to delete role.");
    return NextResponse.json({ error: message }, { status });
  }
}
