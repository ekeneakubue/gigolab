import { UserRole } from "@prisma/client";

import { slugifyRoleName } from "@/lib/company-role";
import { prisma } from "@/lib/prisma";
import { listUserRoleLabelsFromDatabase, toRoleLabel } from "@/lib/user-role";

export type AdminNavFeature = {
  id: string;
  name: string;
  route: string;
  type: "Page" | "Menu";
  modules: Array<{ id?: string; label: string; children: AdminNavFeature["modules"] }>;
};

/** Admin sidebar features assignable on system roles. */
export const ADMIN_NAV_FEATURES: AdminNavFeature[] = [
  {
    id: "admin-dashboard",
    name: "Dashboard",
    route: "/admin",
    type: "Page",
    modules: [],
  },
  {
    id: "admin-companies",
    name: "Companies",
    route: "/admin/companies",
    type: "Page",
    modules: [],
  },
  {
    id: "admin-app-features",
    name: "App Features",
    route: "/admin/app-features",
    type: "Page",
    modules: [],
  },
  {
    id: "admin-roles",
    name: "Roles",
    route: "/admin/roles",
    type: "Page",
    modules: [],
  },
  {
    id: "admin-users",
    name: "Users",
    route: "/admin/users",
    type: "Page",
    modules: [],
  },
  {
    id: "admin-settings",
    name: "Settings",
    route: "/admin/settings",
    type: "Page",
    modules: [],
  },
];

const ADMIN_KIND_ROLES = new Set([
  toRoleLabel(UserRole.Admin),
  toRoleLabel(UserRole.Manager),
  toRoleLabel(UserRole.Staff),
  toRoleLabel(UserRole.Supervisor),
]);

export function adminFeaturePermissionKey(featureId: string) {
  return `admin-feature:${featureId}`;
}

export function buildSystemRoleDashboardRoute(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "";
  if (trimmed === "Admin") return "/admin";
  if (ADMIN_KIND_ROLES.has(trimmed)) {
    const slug = slugifyRoleName(trimmed);
    return slug ? `/admin/dashboards/${slug}` : "";
  }
  const slug = slugifyRoleName(trimmed);
  return slug ? `/company/dashboards/${slug}` : "";
}

export function systemRoleKindForName(name: string): "Admin" | "Lab" {
  return ADMIN_KIND_ROLES.has(name.trim()) ? "Admin" : "Lab";
}

function defaultPermissionKeysForKind(kind: "Admin" | "Lab") {
  if (kind === "Admin") {
    return ADMIN_NAV_FEATURES.map((feature) => adminFeaturePermissionKey(feature.id));
  }
  return [adminFeaturePermissionKey("admin-dashboard")];
}

function defaultDescription(name: string, kind: "Admin" | "Lab") {
  if (kind === "Admin") {
    return `${name} access for the Gigolab admin portal.`;
  }
  return `${name} system role used when assigning lab users.`;
}

async function upsertMissingSystemRole(name: string, existingNames: Set<string>) {
  if (existingNames.has(name.toLowerCase())) return;

  const kind = systemRoleKindForName(name);
  let dashboardRoute = buildSystemRoleDashboardRoute(name);
  if (!dashboardRoute) return;

  // Avoid unique collisions when a company role already owns a similar route.
  const routeTaken = await prisma.systemRole.findFirst({
    where: { dashboardRoute },
    select: { id: true },
  });
  if (routeTaken) {
    const slug = slugifyRoleName(name);
    dashboardRoute =
      kind === "Admin"
        ? `/admin/dashboards/${slug}-${Date.now().toString(36)}`
        : `/company/dashboards/${slug}-${Date.now().toString(36)}`;
  }

  try {
    await prisma.systemRole.create({
      data: {
        name,
        description: defaultDescription(name, kind),
        dashboardRoute,
        kind,
        permissionKeys: defaultPermissionKeysForKind(kind),
      },
    });
    existingNames.add(name.toLowerCase());
  } catch {
    // Unique race — ignore
  }
}

/**
 * Seed system_roles from every UserRole enum label (Admin + lab roles)
 * and any custom names already used on company_roles (e.g. Front Desk).
 */
export async function ensureDefaultSystemRoles() {
  const existing = await prisma.systemRole.findMany({ select: { name: true } });
  const existingNames = new Set(existing.map((role) => role.name.toLowerCase()));

  const dbLabels = await listUserRoleLabelsFromDatabase();
  const companyRoleNames = await prisma.companyRole.findMany({
    select: { name: true },
    distinct: ["name"],
  });

  const allLabels = Array.from(
    new Set([
      ...dbLabels,
      ...Object.values(UserRole).map((role) => toRoleLabel(role)),
      ...companyRoleNames.map((role) => role.name.trim()).filter(Boolean),
    ]),
  );

  for (const name of allLabels) {
    await upsertMissingSystemRole(name, existingNames);
  }
}

export function mapSystemRole(role: {
  id: string;
  name: string;
  description: string;
  dashboardRoute: string;
  kind: string;
  permissionKeys: string[];
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    dashboardRoute: role.dashboardRoute,
    kind: role.kind,
    permissionKeys: role.permissionKeys ?? [],
    permissions:
      role.permissionKeys.length > 0 ? `${role.permissionKeys.length} permissions` : "—",
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}
