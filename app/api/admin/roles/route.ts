import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { isUniqueConstraintError, prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import {
  buildSystemRoleDashboardRoute,
  ensureDefaultSystemRoles,
  mapSystemRole,
  systemRoleKindForName,
} from "@/lib/system-role";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await ensureDefaultSystemRoles();

    const roles = await prisma.systemRole.findMany({
      orderBy: [{ kind: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(roles.map(mapSystemRole));
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to load roles.");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as {
      name?: string;
      description?: string;
      dashboardRoute?: string;
      kind?: string;
      permissionKeys?: string[];
    };

    const name = body.name?.trim() ?? "";
    const kind =
      body.kind === "Admin" || body.kind === "Lab"
        ? body.kind
        : systemRoleKindForName(name);
    const description =
      body.description?.trim() ||
      (kind === "Admin"
        ? `${name} access for the Gigolab admin portal.`
        : `${name} system role used when assigning lab users.`);
    const dashboardRoute =
      body.dashboardRoute?.trim() || buildSystemRoleDashboardRoute(name);
    const permissionKeys = Array.isArray(body.permissionKeys)
      ? body.permissionKeys.filter((key) => typeof key === "string" && key.trim())
      : [];

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

    const created = await prisma.systemRole.create({
      data: {
        name,
        description,
        dashboardRoute,
        kind,
        permissionKeys,
      },
    });

    return NextResponse.json(mapSystemRole(created), { status: 201 });
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
