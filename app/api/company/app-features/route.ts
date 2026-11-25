import { NextResponse } from "next/server";

import {
  ensureDefaultAppFeatures,
  mapFeatureForApi,
} from "@/lib/app-features";
import { getCompanySession } from "@/lib/company-auth";
import { filterFeaturesByPermissionKeys } from "@/lib/company-role";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getCompanySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const catalog = new URL(request.url).searchParams.get("catalog") === "1";

    await ensureDefaultAppFeatures();

    const [features, companyFeatures] = await Promise.all([
      prisma.appFeature.findMany({
        where: { status: "Active" },
        include: { modules: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }),
      prisma.companyFeature.findMany({
        where: { companyId: session.companyId },
        select: { featureId: true },
      }),
    ]);

    const enabledFeatureIds = new Set(companyFeatures.map((row) => row.featureId));
    // Legacy companies with no assignments keep full Active catalog until edited.
    const entitledFeatures =
      enabledFeatureIds.size === 0
        ? features
        : features.filter((feature) => enabledFeatureIds.has(feature.id));

    let payload = entitledFeatures.map(mapFeatureForApi);

    // Full company catalog for Roles admin; otherwise scope to the signed-in user's role.
    if (!catalog && session.userId) {
      const user = await prisma.user.findFirst({
        where: { id: session.userId, companyId: session.companyId },
        select: {
          companyRole: { select: { permissionKeys: true } },
        },
      });

      if (user?.companyRole) {
        payload = filterFeaturesByPermissionKeys(
          payload,
          user.companyRole.permissionKeys,
        );
      }
    }

    return NextResponse.json(payload);
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to load app features.");
    return NextResponse.json({ error: message }, { status });
  }
}

/** Persist feature list order (sortOrder) from Roles / catalog UIs. */
export async function PATCH(request: Request) {
  try {
    const session = await getCompanySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as { orderedIds?: unknown };
    const orderedIds = Array.isArray(body.orderedIds)
      ? body.orderedIds.filter((id): id is string => typeof id === "string" && id.length > 0)
      : [];

    if (orderedIds.length === 0) {
      return NextResponse.json({ error: "orderedIds is required." }, { status: 400 });
    }

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.appFeature.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to reorder features.");
    return NextResponse.json({ error: message }, { status });
  }
}
