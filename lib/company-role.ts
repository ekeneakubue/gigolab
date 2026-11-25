import type { AppFeatureModuleNode, AppFeaturePayload } from "@/lib/app-features";
import { ensureDefaultAppFeatures } from "@/lib/app-features";
import { prisma } from "@/lib/prisma";
import { listUserRoleLabelsFromDatabase, toRoleLabel } from "@/lib/user-role";
import { UserRole } from "@prisma/client";

/** Lab-facing system roles seeded into company_roles from the DB UserRole enum. */
const DEFAULT_COMPANY_ROLE_ENUMS: UserRole[] = [
  UserRole.LabOwner,
  UserRole.LabManager,
  UserRole.LabTechnician,
  UserRole.LabReceptionist,
  UserRole.LabHR,
];

export function slugifyRoleName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildRoleDashboardRoute(name: string) {
  const slug = slugifyRoleName(name);
  return slug ? `/company/dashboards/${slug}` : "";
}

export function roleDashboardSlugFromRoute(route: string) {
  const match = route.trim().match(/^\/company\/dashboards\/([^/?#]+)$/);
  return match?.[1] ?? null;
}

export function featurePermissionKey(featureId: string) {
  return `feature:${featureId}`;
}

export function modulePermissionKey(moduleId: string) {
  return `module:${moduleId}`;
}

function filterModuleTree(
  modules: AppFeatureModuleNode[],
  keys: Set<string>,
): AppFeatureModuleNode[] {
  return modules.flatMap((module) => {
    const children = filterModuleTree(module.children, keys);
    const selfSelected = Boolean(module.id && keys.has(modulePermissionKey(module.id)));
    if (!selfSelected && children.length === 0) return [];
    return [
      {
        id: module.id,
        label: module.label,
        children,
      },
    ];
  });
}

/** Keep only features/modules present in a role's permissionKeys. */
export function filterFeaturesByPermissionKeys(
  features: AppFeaturePayload[],
  permissionKeys: string[],
): AppFeaturePayload[] {
  const keys = new Set(permissionKeys);
  if (keys.size === 0) return [];

  return features.flatMap((feature) => {
    const featureSelected = keys.has(featurePermissionKey(feature.id));
    const filtered = filterModuleTree(feature.modules, keys);
    if (!featureSelected && filtered.length === 0) return [];
    // A granted menu with no matching module keys (e.g. none picked) exposes the whole menu.
    const modules = featureSelected && filtered.length === 0 ? feature.modules : filtered;
    return [
      {
        ...feature,
        modules,
      },
    ];
  });
}

/**
 * Seed default company_roles once (when the company has none).
 * Do not re-create roles after deletes — that would undo removals.
 */
export async function ensureDefaultCompanyRoles(companyId: string) {
  const existingCount = await prisma.companyRole.count({ where: { companyId } });
  if (existingCount > 0) return;

  await ensureDefaultAppFeatures();

  const dbLabels = await listUserRoleLabelsFromDatabase();
  const preferredLabels = DEFAULT_COMPANY_ROLE_ENUMS.map(toRoleLabel);

  const systemLabRoles = await prisma.systemRole.findMany({
    where: { kind: "Lab" },
    select: { name: true, description: true, dashboardRoute: true, permissionKeys: true },
    orderBy: { name: "asc" },
  });

  const labelsToSeed = Array.from(
    new Set([
      ...preferredLabels.filter((label) => dbLabels.includes(label)),
      ...systemLabRoles.map((role) => role.name.trim()).filter(Boolean),
    ]),
  );

  const overview = await prisma.appFeature.findFirst({
    where: { route: "/company", status: "Active" },
    select: { id: true },
  });
  const defaultKeys = overview ? [featurePermissionKey(overview.id)] : [];
  const systemByName = new Map(
    systemLabRoles.map((role) => [role.name.toLowerCase(), role] as const),
  );
  const usedRoutes = new Set<string>();

  for (const name of labelsToSeed) {
    const systemRole = systemByName.get(name.toLowerCase());
    let dashboardRoute =
      systemRole?.dashboardRoute?.startsWith("/company/dashboards/")
        ? systemRole.dashboardRoute
        : buildRoleDashboardRoute(name);
    if (!dashboardRoute || defaultKeys.length === 0) continue;

    if (usedRoutes.has(dashboardRoute)) {
      const slug = slugifyRoleName(name);
      dashboardRoute = `/company/dashboards/${slug}-${Date.now().toString(36)}`;
    }

    const permissionKeys =
      systemRole?.permissionKeys?.some((key) => key.startsWith("feature:") || key.startsWith("module:"))
        ? systemRole.permissionKeys
        : defaultKeys;

    try {
      await prisma.companyRole.create({
        data: {
          companyId,
          name,
          description:
            systemRole?.description?.trim() || `${name} access for this lab.`,
          dashboardRoute,
          permissionKeys,
        },
      });
      usedRoutes.add(dashboardRoute);
    } catch {
      // Unique race / route conflict — ignore; next GET will load whatever exists.
    }
  }
}
