import { NextResponse } from "next/server";
import type { AppFeatureStatus, AppFeatureType } from "@prisma/client";

import { getAdminSession } from "@/lib/admin-auth";
import {
  ensureDefaultAppFeatures,
  mapFeatureForApi,
  normalizeModules,
  replaceFeatureModules,
} from "@/lib/app-features";
import { isUniqueConstraintError, prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await ensureDefaultAppFeatures();

    const features = await prisma.appFeature.findMany({
      include: { modules: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(features.map(mapFeatureForApi));
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to load app features.");
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
      route?: string;
      type?: AppFeatureType;
      status?: AppFeatureStatus;
      description?: string;
      modules?: unknown;
    };

    const name = body.name?.trim() ?? "";
    const route = body.route?.trim() ?? "";
    const type = body.type === "Menu" ? "Menu" : "Page";
    const status = body.status === "Inactive" ? "Inactive" : "Active";
    const description = body.description?.trim() || "Custom company portal feature.";
    const modules = type === "Menu" ? normalizeModules(body.modules) : [];

    if (!name || !route) {
      return NextResponse.json({ error: "Name and route are required." }, { status: 400 });
    }

    const maxSort = await prisma.appFeature.aggregate({ _max: { sortOrder: true } });
    const created = await prisma.appFeature.create({
      data: {
        name,
        route,
        type,
        status,
        description,
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      },
    });

    await replaceFeatureModules(created.id, modules);

    const feature = await prisma.appFeature.findUniqueOrThrow({
      where: { id: created.id },
      include: { modules: true },
    });

    return NextResponse.json(mapFeatureForApi(feature), { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "A feature with this route already exists." },
        { status: 409 },
      );
    }
    const { status, message } = prismaErrorResponse(error, "Failed to create app feature.");
    return NextResponse.json({ error: message }, { status });
  }
}
