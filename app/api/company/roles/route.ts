import { NextResponse } from "next/server";

import { getCompanySession } from "@/lib/company-auth";
import {
  buildRoleDashboardRoute,
  ensureDefaultCompanyRoles,
} from "@/lib/company-role";
import { isUniqueConstraintError, prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import { ensureDefaultSystemRoles } from "@/lib/system-role";

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
    permissionKeys: role.permissionKeys ?? [],
    permissions:
      role.permissionKeys.length > 0 ? `${role.permissionKeys.length} permissions` : "—",
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}

export async function GET() {
  try {
    const session = await getCompanySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await ensureDefaultCompanyRoles(session.companyId);

    const roles = await prisma.companyRole.findMany({
      where: { companyId: session.companyId },
      orderBy: [{ name: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(roles.map(mapRole));
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to load roles.");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCompanySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as {
      name?: string;
      description?: string;
      dashboardRoute?: string;
      permissionKeys?: string[];
    };

    const name = body.name?.trim() ?? "";
    const description = body.description?.trim() || "Custom company role.";
    const dashboardRoute =
      body.dashboardRoute?.trim() || buildRoleDashboardRoute(name);
    const permissionKeys = Array.isArray(body.permissionKeys)
      ? body.permissionKeys.filter((key) => typeof key === "string" && key.trim())
      : [];

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

    const created = await prisma.companyRole.create({
      data: {
        companyId: session.companyId,
        name,
        description,
        dashboardRoute,
        permissionKeys,
      },
    });

    // Keep /admin/roles in sync with custom company role names.
    await ensureDefaultSystemRoles().catch(() => undefined);

    return NextResponse.json(mapRole(created), { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "A role with this name or dashboard route already exists." },
        { status: 409 },
      );
    }
    const { status, message } = prismaErrorResponse(error, "Failed to create role.");
    return NextResponse.json({ error: message }, { status });
  }
}
