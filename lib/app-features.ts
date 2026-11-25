import type { AppFeatureStatus, AppFeatureType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AppFeatureModuleNode = {
  id?: string;
  label: string;
  children: AppFeatureModuleNode[];
};

export type AppFeaturePayload = {
  id: string;
  name: string;
  route: string;
  type: AppFeatureType;
  status: AppFeatureStatus;
  description: string;
  sortOrder: number;
  modules: AppFeatureModuleNode[];
};

type DbModule = {
  id: string;
  parentId: string | null;
  label: string;
  sortOrder: number;
};

export function buildModuleTree(modules: DbModule[], parentId: string | null = null): AppFeatureModuleNode[] {
  return modules
    .filter((module) => module.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
    .map((module) => ({
      id: module.id,
      label: module.label,
      children: buildModuleTree(modules, module.id),
    }));
}

export function mapFeatureForApi(
  feature: Prisma.AppFeatureGetPayload<{ include: { modules: true } }>,
): AppFeaturePayload {
  return {
    id: feature.id,
    name: feature.name,
    route: feature.route,
    type: feature.type,
    status: feature.status,
    description: feature.description,
    sortOrder: feature.sortOrder,
    modules: buildModuleTree(
      feature.modules.map((module) => ({
        id: module.id,
        parentId: module.parentId,
        label: module.label,
        sortOrder: module.sortOrder,
      })),
    ),
  };
}

/**
 * Upsert the module tree, reusing existing ids (by id, then parent + label) so
 * role permission keys (`module:<id>`) stay valid across feature edits.
 */
export async function replaceFeatureModules(
  featureId: string,
  modules: AppFeatureModuleNode[],
) {
  const existing = await prisma.appFeatureModule.findMany({
    where: { featureId },
    select: { id: true, parentId: true, label: true },
  });
  const unused = new Map(existing.map((module) => [module.id, module]));

  const claim = (node: AppFeatureModuleNode, parentId: string | null) => {
    if (node.id && unused.has(node.id)) {
      unused.delete(node.id);
      return node.id;
    }
    const label = node.label.trim().toLowerCase();
    const match =
      [...unused.values()].find(
        (module) => module.parentId === parentId && module.label.trim().toLowerCase() === label,
      ) ?? [...unused.values()].find((module) => module.label.trim().toLowerCase() === label);
    if (!match) return null;
    unused.delete(match.id);
    return match.id;
  };

  const upsertNodes = async (nodes: AppFeatureModuleNode[], parentId: string | null) => {
    for (let index = 0; index < nodes.length; index++) {
      const node = nodes[index];
      const reuseId = claim(node, parentId);
      const data = { parentId, label: node.label, sortOrder: index };
      const saved = reuseId
        ? await prisma.appFeatureModule.update({ where: { id: reuseId }, data, select: { id: true } })
        : await prisma.appFeatureModule.create({ data: { featureId, ...data }, select: { id: true } });
      if (node.children.length > 0) {
        await upsertNodes(node.children, saved.id);
      }
    }
  };

  await upsertNodes(modules, null);

  if (unused.size > 0) {
    await prisma.appFeatureModule.deleteMany({ where: { id: { in: [...unused.keys()] } } });
  }
}

export const DEFAULT_APP_FEATURES: Array<{
  name: string;
  route: string;
  type: AppFeatureType;
  status: AppFeatureStatus;
  description: string;
  sortOrder: number;
  modules: AppFeatureModuleNode[];
}> = [
  {
    name: "Overview",
    route: "/company",
    type: "Page",
    status: "Active",
    description: "Company portal home dashboard and workspace summary.",
    sortOrder: 0,
    modules: [],
  },
  {
    name: "Administrations",
    route: "/company/administrations",
    type: "Menu",
    status: "Active",
    description: "Admin workflows for users, roles, branches, and departments.",
    sortOrder: 1,
    modules: [
      { label: "Users", children: [] },
      { label: "Roles", children: [] },
      { label: "Patients", children: [] },
      { label: "Branches", children: [] },
      { label: "Departments", children: [] },
    ],
  },
  {
    name: "Diagnostics",
    route: "/company/diagnostics",
    type: "Menu",
    status: "Active",
    description: "Diagnostic test ordering, result prep, review, and settings.",
    sortOrder: 2,
    modules: [
      { label: "Test Requests", children: [] },
      { label: "Prepare Test Result", children: [] },
      { label: "Check Test Result", children: [] },
      { label: "Test Settings", children: [] },
    ],
  },
  {
    name: "Pharmacy",
    route: "/company/pharmacy",
    type: "Page",
    status: "Active",
    description: "Pharmacy inventory and dispensing workflows.",
    sortOrder: 3,
    modules: [],
  },
  {
    name: "Medical Services",
    route: "/company/medical-services",
    type: "Page",
    status: "Active",
    description: "Clinical and medical service coordination.",
    sortOrder: 4,
    modules: [],
  },
  {
    name: "Referrals",
    route: "/company/referals",
    type: "Page",
    status: "Active",
    description: "Referring doctors and clinics that send patients to the lab.",
    sortOrder: 5,
    modules: [],
  },
  {
    name: "Insurance",
    route: "/company/insurance",
    type: "Menu",
    status: "Active",
    description: "Insurance types, providers, and coverage plans.",
    sortOrder: 6,
    modules: [
      { label: "Insurance Type", children: [] },
      { label: "Providers", children: [] },
      { label: "Plans", children: [] },
    ],
  },
  {
    name: "Reports",
    route: "/company/reports",
    type: "Menu",
    status: "Active",
    description: "Operational and financial reporting modules.",
    sortOrder: 7,
    modules: [
      {
        label: "Daily Reports",
        children: [
          { label: "Collective / Due Report", children: [] },
          { label: "Payment Due Report", children: [] },
          { label: "List of Patients", children: [] },
          { label: "Due Tests", children: [] },
          { label: "Login Wise Collection", children: [] },
          { label: "Work List for Technician", children: [] },
          { label: "Diabetic Card Printing", children: [] },
          { label: "List of Patients (Creditors)", children: [] },
          { label: "List of Patients (Coll. Cntr)", children: [] },
          { label: "List of Patients (Outside)", children: [] },
          { label: "Collection - Dept Wise", children: [] },
          { label: "Rate List of Center", children: [] },
          { label: "Expense Report", children: [] },
          { label: "Collection Center Summary", children: [] },
          { label: "Form - E Printing", children: [] },
          { label: "List of Patients (Test Value)", children: [] },
          { label: "Rate Lists Printing", children: [] },
          { label: "List of Patients Mobile No", children: [] },
          { label: "List of Patients Email ID", children: [] },
          { label: "Patients Appointments", children: [] },
          { label: "Discounted Rate", children: [] },
        ],
      },
      { label: "Referral Dr. Reports", children: [] },
      { label: "MIS Reports", children: [] },
      { label: "Prep. Charge Reports", children: [] },
      { label: "Performance Graphics", children: [] },
      { label: "Multi Dept Reports", children: [] },
      { label: "Other Reports", children: [] },
    ],
  },
];

export async function ensureDefaultAppFeatures() {
  const count = await prisma.appFeature.count();
  if (count === 0) {
    for (const feature of DEFAULT_APP_FEATURES) {
      const created = await prisma.appFeature.create({
        data: {
          name: feature.name,
          route: feature.route,
          type: feature.type,
          status: feature.status,
          description: feature.description,
          sortOrder: feature.sortOrder,
        },
      });
      await replaceFeatureModules(created.id, feature.modules);
    }
    return;
  }

  // Backfill newly added default routes (e.g. Referrals) without reseeding everything.
  for (const feature of DEFAULT_APP_FEATURES) {
    const existing = await prisma.appFeature.findUnique({
      where: { route: feature.route },
      select: { id: true },
    });
    if (existing) continue;

    const maxSort = await prisma.appFeature.aggregate({ _max: { sortOrder: true } });
    const created = await prisma.appFeature.create({
      data: {
        name: feature.name,
        route: feature.route,
        type: feature.type,
        status: feature.status,
        description: feature.description,
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      },
    });
    await replaceFeatureModules(created.id, feature.modules);
  }
}
