import { NextResponse } from "next/server";
import type { AppFeatureStatus, AppFeatureType } from "@prisma/client";

import { getAdminSession } from "@/lib/admin-auth";
import {
  mapFeatureForApi,
  replaceFeatureModules,
  type AppFeatureModuleNode,
} from "@/lib/app-features";
import { isUniqueConstraintError, prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

function normalizeModules(input: unknown): AppFeatureModuleNode[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as { id?: unknown; label?: unknown; children?: unknown };
      const label = typeof record.label === "string" ? record.label.trim() : "";
      const children = normalizeModules(record.children);
      if (!label && children.length === 0) return null;
      return {
        id: typeof record.id === "string" ? record.id : undefined,
        label: label || "Untitled",
        children,
      };
    })
    .filter((item): item is AppFeatureModuleNode => item !== null);
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await context.params;
    const existing = await prisma.appFeature.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Feature not found." }, { status: 404 });
    }

    const body = (await request.json()) as {
      name?: string;
      route?: string;
      type?: AppFeatureType;
      status?: AppFeatureStatus;
      description?: string;
      modules?: unknown;
    };

    const name = body.name?.trim() ?? "";
    const route = body.route?.trim() ?? "";
    const type = body.type === "Menu" ? "Menu" : body.type === "Page" ? "Page" : existing.type;
    const status =
      body.status === "Inactive"
        ? "Inactive"
        : body.status === "Active"
          ? "Active"
          : existing.status;
    const description =
      typeof body.description === "string"
        ? body.description.trim() || "Custom company portal feature."
        : existing.description;
    const modules =
      body.modules !== undefined
        ? type === "Menu"
          ? normalizeModules(body.modules)
          : []
        : undefined;

    if (!name || !route) {
      return NextResponse.json({ error: "Name and route are required." }, { status: 400 });
    }

    await prisma.appFeature.update({
      where: { id },
      data: {
        name,
        route,
        type,
        status,
        description,
      },
    });

    if (modules !== undefined) {
      await replaceFeatureModules(id, modules);
    }

    const feature = await prisma.appFeature.findUniqueOrThrow({
      where: { id },
      include: { modules: true },
    });

    return NextResponse.json(mapFeatureForApi(feature));
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "A feature with this route already exists." },
        { status: 409 },
      );
    }
    const { status, message } = prismaErrorResponse(error, "Failed to update app feature.");
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
    const existing = await prisma.appFeature.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Feature not found." }, { status: 404 });
    }

    await prisma.appFeature.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to delete app feature.");
    return NextResponse.json({ error: message }, { status });
  }
}
