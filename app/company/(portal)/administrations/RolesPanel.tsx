"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { buildRoleDashboardRoute } from "@/lib/company-role";

type FeatureModule = {
  id?: string;
  label: string;
  children: FeatureModule[];
};

type AppFeatureOption = {
  id: string;
  name: string;
  route: string;
  type: "Page" | "Menu";
  modules: FeatureModule[];
};

type CompanyRole = {
  id: string;
  name: string;
  description: string;
  dashboardRoute: string;
  permissions: string;
  permissionKeys: string[];
};

type RoleForm = {
  name: string;
  dashboardRoute: string;
  description: string;
  permissionKeys: string[];
  routeAuto: boolean;
};

const inputClass =
  "mt-1.5 h-10 w-full rounded-xl border border-emerald-200 px-3 text-base font-medium text-zinc-900 placeholder:text-zinc-600 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

const emptyForm = (): RoleForm => ({
  name: "",
  dashboardRoute: "",
  description: "",
  permissionKeys: [],
  routeAuto: true,
});

function isCompanyRole(payload: CompanyRole | { error?: string }): payload is CompanyRole {
  return "id" in payload && typeof payload.id === "string";
}

function featureKey(featureId: string) {
  return `feature:${featureId}`;
}

function moduleKey(moduleId: string) {
  return `module:${moduleId}`;
}

function moduleNodeKey(featureId: string, module: FeatureModule, path: string) {
  return module.id ? moduleKey(module.id) : `module-path:${featureId}:${path}`;
}

function collectModuleKeys(featureId: string, modules: FeatureModule[], pathPrefix = ""): string[] {
  return modules.flatMap((module, index) => {
    const path = pathPrefix ? `${pathPrefix}.${index}` : `${index}`;
    const key = moduleNodeKey(featureId, module, path);
    return [key, ...collectModuleKeys(featureId, module.children, path)];
  });
}

function collectFeatureKeys(feature: AppFeatureOption): string[] {
  return [featureKey(feature.id), ...collectModuleKeys(feature.id, feature.modules)];
}

function collectAllKeys(features: AppFeatureOption[]): string[] {
  return features.flatMap(collectFeatureKeys);
}

function moduleLabelsByKey(
  featureId: string,
  modules: FeatureModule[],
  pathPrefix = "",
  labelPrefix = "",
): Array<{ key: string; label: string }> {
  return modules.flatMap((module, index) => {
    const path = pathPrefix ? `${pathPrefix}.${index}` : `${index}`;
    const label = labelPrefix ? `${labelPrefix} › ${module.label}` : module.label;
    const key = moduleNodeKey(featureId, module, path);
    return [
      { key, label },
      ...moduleLabelsByKey(featureId, module.children, path, label),
    ];
  });
}

function ModuleCheckboxTree({
  featureId,
  modules,
  selectedKeys,
  onToggle,
  depth = 0,
  pathPrefix = "",
}: {
  featureId: string;
  modules: FeatureModule[];
  selectedKeys: Set<string>;
  onToggle: (keys: string[], checked: boolean) => void;
  depth?: number;
  pathPrefix?: string;
}) {
  if (modules.length === 0) return null;

  return (
    <div className={depth === 0 ? "mt-2 space-y-1.5 border-l border-emerald-100 pl-3" : "mt-1.5 space-y-1.5 border-l border-emerald-100 pl-3"}>
      {modules.map((module, index) => {
        const path = pathPrefix ? `${pathPrefix}.${index}` : `${index}`;
        const key = moduleNodeKey(featureId, module, path);
        const descendantKeys = collectModuleKeys(featureId, module.children, path);
        const allKeys = [key, ...descendantKeys];
        const checked = selectedKeys.has(key);
        const childCheckedCount = descendantKeys.filter((item) => selectedKeys.has(item)).length;
        const indeterminate =
          !checked && childCheckedCount > 0 && childCheckedCount < descendantKeys.length;

        return (
          <div key={key}>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-white/80">
              <input
                type="checkbox"
                checked={checked && (descendantKeys.length === 0 || childCheckedCount === descendantKeys.length)}
                ref={(el) => {
                  if (el) el.indeterminate = indeterminate || (checked && childCheckedCount > 0 && childCheckedCount < descendantKeys.length);
                }}
                onChange={(e) => onToggle(allKeys, e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-200"
              />
              <span className="min-w-0 flex-1">
                <span className="text-sm font-medium text-zinc-800">{module.label}</span>
                {module.children.length > 0 ? (
                  <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                    {module.children.length} nested
                  </span>
                ) : null}
              </span>
            </label>
            <ModuleCheckboxTree
              featureId={featureId}
              modules={module.children}
              selectedKeys={selectedKeys}
              onToggle={onToggle}
              depth={depth + 1}
              pathPrefix={path}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function CompanyRolesPanel() {
  const [roles, setRoles] = useState<CompanyRole[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);
  const [form, setForm] = useState<RoleForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [features, setFeatures] = useState<AppFeatureOption[]>([]);
  const [isLoadingFeatures, setIsLoadingFeatures] = useState(false);
  const [featuresError, setFeaturesError] = useState("");

  const filteredRoles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter((role) =>
      [role.name, role.description, role.dashboardRoute, role.permissions]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [roles, search]);

  useEffect(() => {
    let cancelled = false;

    async function loadRoles() {
      setIsLoading(true);
      setListError("");
      try {
        const response = await fetch("/api/company/roles", { cache: "no-store" });
        const data = (await response.json()) as CompanyRole[] | { error?: string };
        if (cancelled) return;
        if (!response.ok || !Array.isArray(data)) {
          setRoles([]);
          setListError(
            !Array.isArray(data) && data.error ? data.error : "Could not load roles.",
          );
          return;
        }
        setRoles(
          data.map((role) => ({
            id: role.id,
            name: role.name,
            description: role.description ?? "",
            dashboardRoute: role.dashboardRoute,
            permissions: role.permissions ?? "—",
            permissionKeys: Array.isArray(role.permissionKeys) ? role.permissionKeys : [],
          })),
        );
      } catch {
        if (!cancelled) {
          setRoles([]);
          setListError("Could not load roles. Please try again.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadRoles();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedKeys = useMemo(() => new Set(form.permissionKeys), [form.permissionKeys]);

  const selectedPermissionLabels = useMemo(() => {
    const labels: string[] = [];
    for (const feature of features) {
      if (selectedKeys.has(featureKey(feature.id))) {
        labels.push(feature.name);
      }
      for (const item of moduleLabelsByKey(feature.id, feature.modules)) {
        if (selectedKeys.has(item.key)) {
          labels.push(`${feature.name} › ${item.label}`);
        }
      }
    }
    return labels;
  }, [features, selectedKeys]);

  const allKeys = useMemo(() => collectAllKeys(features), [features]);

  useEffect(() => {
    if (!isModalOpen) return;

    let cancelled = false;

    async function loadFeatures() {
      setIsLoadingFeatures(true);
      setFeaturesError("");
      try {
        const response = await fetch("/api/company/app-features?catalog=1");
        const data = (await response.json()) as AppFeatureOption[] | { error?: string };
        if (cancelled) return;
        if (!response.ok || !Array.isArray(data)) {
          setFeatures([]);
          setFeaturesError(
            !Array.isArray(data) && data.error ? data.error : "Could not load features.",
          );
          return;
        }
        setFeatures(
          data.map((feature) => ({
            id: feature.id,
            name: feature.name,
            route: feature.route,
            type: feature.type,
            modules: feature.modules ?? [],
          })),
        );
      } catch {
        if (!cancelled) {
          setFeatures([]);
          setFeaturesError("Could not load features. Please try again.");
        }
      } finally {
        if (!cancelled) setIsLoadingFeatures(false);
      }
    }

    void loadFeatures();
    return () => {
      cancelled = true;
    };
  }, [isModalOpen]);

  const openAddRoleModal = () => {
    setFormError("");
    setIsSaving(false);
    setEditingRoleId(null);
    setForm(emptyForm());
    setIsModalOpen(true);
  };

  const openEditRoleModal = (role: CompanyRole) => {
    setFormError("");
    setIsSaving(false);
    setEditingRoleId(role.id);
    setForm({
      name: role.name,
      dashboardRoute: role.dashboardRoute,
      description: role.description,
      permissionKeys: role.permissionKeys ?? [],
      routeAuto: false,
    });
    setIsModalOpen(true);
  };

  const closeRoleModal = () => {
    setIsModalOpen(false);
    setEditingRoleId(null);
    setForm(emptyForm());
    setFormError("");
  };

  const deleteRole = async (role: CompanyRole) => {
    if (!window.confirm(`Delete "${role.name}"? Users assigned to this role will lose it.`)) {
      return;
    }

    setDeletingRoleId(role.id);
    setListError("");
    try {
      const response = await fetch(`/api/company/roles/${role.id}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setListError(payload.error ?? "Could not delete role.");
        return;
      }
      setRoles((prev) => prev.filter((item) => item.id !== role.id));
      if (editingRoleId === role.id) {
        closeRoleModal();
      }
    } catch {
      setListError("Could not delete role. Please try again.");
    } finally {
      setDeletingRoleId(null);
    }
  };

  const toggleKeys = (keys: string[], checked: boolean) => {
    setForm((prev) => {
      const next = new Set(prev.permissionKeys);
      for (const key of keys) {
        if (checked) next.add(key);
        else next.delete(key);
      }
      return { ...prev, permissionKeys: Array.from(next) };
    });
  };

  const toggleFeature = (feature: AppFeatureOption, checked: boolean) => {
    toggleKeys(collectFeatureKeys(feature), checked);
  };

  const toggleAllFeatures = () => {
    const allSelected = allKeys.length > 0 && allKeys.every((key) => selectedKeys.has(key));
    setForm((prev) => ({
      ...prev,
      permissionKeys: allSelected ? [] : allKeys,
    }));
  };

  const persistFeatureOrder = async (ordered: AppFeatureOption[]) => {
    try {
      const response = await fetch("/api/company/app-features", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: ordered.map((feature) => feature.id) }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setFormError(payload.error ?? "Could not save feature order.");
      }
    } catch {
      setFormError("Could not save feature order. Please try again.");
    }
  };

  const moveFeature = (index: number, direction: "up" | "down") => {
    setFeatures((prev) => {
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      void persistFeatureOrder(next);
      return next;
    });
  };

  const onRoleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      dashboardRoute: prev.routeAuto ? buildRoleDashboardRoute(name) : prev.dashboardRoute,
    }));
  };

  const submitRole = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");

    const name = form.name.trim();
    const dashboardRoute =
      form.dashboardRoute.trim() || buildRoleDashboardRoute(name);
    if (!name) {
      setFormError("Role name is required.");
      return;
    }
    if (!dashboardRoute.startsWith("/company/dashboards/")) {
      setFormError("Dashboard route must be under /company/dashboards/.");
      return;
    }
    if (form.permissionKeys.length === 0) {
      setFormError("Select at least one feature or sub-menu item.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        editingRoleId ? `/api/company/roles/${editingRoleId}` : "/api/company/roles",
        {
          method: editingRoleId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          dashboardRoute,
          permissionKeys: form.permissionKeys,
        }),
        },
      );
      const payload = (await response.json()) as CompanyRole | { error?: string };
      if (!response.ok || !isCompanyRole(payload)) {
        setFormError(
          "error" in payload && payload.error ? payload.error : "Could not save role.",
        );
        return;
      }

      const nextRole: CompanyRole = {
        ...payload,
        permissions:
          selectedPermissionLabels.join(", ") || payload.permissions || "—",
      };
      setRoles((prev) =>
        editingRoleId
          ? prev.map((role) => (role.id === editingRoleId ? nextRole : role))
          : [nextRole, ...prev],
      );
      closeRoleModal();
    } catch {
      setFormError("Could not save role. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[#dfe4ef] bg-[#f3f5fa] px-4 py-4 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.65)] sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-base font-bold text-zinc-900">Roles</h1>
            <p className="text-xs text-zinc-700">Define roles and permissions for your lab</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
              >
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search roles..."
                className="h-9 w-full rounded-lg border border-[#d7ddea] bg-white/80 pl-9 pr-3 text-sm text-zinc-800 placeholder:text-zinc-500 outline-none focus:border-[#bcc6da] focus:bg-white"
              />
            </div>
            <button
              type="button"
              onClick={openAddRoleModal}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path strokeLinecap="round" d="M12 5v14M5 12h14" />
              </svg>
              Add role
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="overflow-hidden rounded-2xl border border-[#dfe4ef] bg-white shadow-[0_16px_32px_-24px_rgba(15,23,42,0.6)]">
          <div className="border-b border-[#e8ecf5] px-5 py-4">
            <h2 className="text-sm font-bold text-zinc-900">Lab roles</h2>
            <p className="text-xs text-zinc-600">
              {isLoading
                ? "Loading roles…"
                : `${filteredRoles.length} of ${roles.length} roles`}
            </p>
            {listError ? (
              <p className="mt-1 text-xs font-medium text-rose-700">{listError}</p>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8ecf5] bg-[#f3f5fa]/80">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Dashboard route
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Features
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8ecf5]/80">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-sm text-zinc-600">
                      Loading roles…
                    </td>
                  </tr>
                ) : filteredRoles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <p className="text-sm font-medium text-zinc-700">No roles found</p>
                      <p className="mt-1 text-xs text-zinc-600">
                        {roles.length === 0
                          ? "Add a role to get started."
                          : "Try a different search term."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRoles.map((role) => (
                    <tr key={role.id} className="transition-colors hover:bg-[#f3f5fa]/60">
                      <td className="px-5 py-3 text-[13px] font-semibold text-zinc-800">
                        {role.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-zinc-600">
                        {role.dashboardRoute}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{role.description}</td>
                      <td className="px-4 py-3 text-zinc-600">
                        <span className="line-clamp-2">{role.permissions}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditRoleModal(role)}
                            aria-label={`Edit ${role.name}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              className="h-4 w-4"
                              aria-hidden
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteRole(role)}
                            disabled={deletingRoleId === role.id}
                            aria-label={`Delete ${role.name}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingRoleId === role.id ? (
                              <svg
                                className="h-4 w-4 animate-spin"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                            ) : (
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                className="h-4 w-4"
                                aria-hidden
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-emerald-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-50 px-6 py-3.5">
              <div>
                <h2 className="text-lg font-bold text-zinc-950">
                  {editingRoleId ? "Edit Role" : "Add New Role"}
                </h2>
                <p className="mt-1 text-sm font-medium text-zinc-800">
                  {editingRoleId
                    ? "Update this role’s dashboard route and feature access"
                    : "Create a role and assign sidebar features and sub-menus"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeRoleModal}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                Close
              </button>
            </div>

            <form onSubmit={submitRole} className="space-y-3 px-6 py-4">
              <div>
                <label className="text-sm font-bold text-zinc-950">Role name</label>
                <input
                  value={form.name}
                  onChange={(e) => onRoleNameChange(e.target.value)}
                  placeholder="e.g. Lab Manager"
                  className={inputClass}
                />
              </div>
              <div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-bold text-zinc-950">Role dashboard route</label>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                    Auto Create
                  </span>
                </div>
                <input
                  value={form.dashboardRoute}
                  readOnly
                  tabIndex={-1}
                  placeholder="/company/dashboards/lab-manager"
                  className={`${inputClass} cursor-default bg-emerald-50/60 font-mono text-sm text-zinc-700`}
                />
                <p className="mt-1.5 text-xs text-zinc-600">
                  Auto-generated from the role name. Users with this role land here on login.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-bold text-zinc-950">Features</label>
                  {features.length > 0 ? (
                    <button
                      type="button"
                      onClick={toggleAllFeatures}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      {allKeys.length > 0 && allKeys.every((key) => selectedKeys.has(key))
                        ? "Clear all"
                        : "Select all"}
                    </button>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-zinc-600">
                  Check features and every nested sub-menu this role can access.
                </p>

                <div className="mt-2 max-h-80 space-y-2 overflow-y-auto rounded-xl border border-emerald-100 bg-emerald-50/30 p-3">
                  {isLoadingFeatures ? (
                    <p className="px-1 py-3 text-sm font-medium text-zinc-600">Loading features…</p>
                  ) : featuresError ? (
                    <p className="px-1 py-3 text-sm font-medium text-rose-700">{featuresError}</p>
                  ) : features.length === 0 ? (
                    <p className="px-1 py-3 text-sm font-medium text-zinc-600">
                      No active features available.
                    </p>
                  ) : (
                    features.map((feature, index) => {
                      const keys = collectFeatureKeys(feature);
                      const featureChecked = selectedKeys.has(featureKey(feature.id));
                      const selectedCount = keys.filter((key) => selectedKeys.has(key)).length;
                      const allChecked = selectedCount === keys.length;
                      const indeterminate = selectedCount > 0 && !allChecked;
                      const canMoveUp = index > 0;
                      const canMoveDown = index < features.length - 1;

                      return (
                        <div
                          key={feature.id}
                          className={`rounded-xl border px-3 py-2.5 transition-colors ${
                            selectedCount > 0
                              ? "border-emerald-200 bg-white shadow-sm"
                              : "border-transparent bg-white/70"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                              <input
                                type="checkbox"
                                checked={allChecked}
                                ref={(el) => {
                                  if (el) el.indeterminate = indeterminate;
                                }}
                                onChange={(e) => toggleFeature(feature, e.target.checked)}
                                className="mt-1 h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-200"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-semibold text-zinc-900">
                                    {feature.name}
                                  </span>
                                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600">
                                    {feature.type}
                                  </span>
                                  {featureChecked && !allChecked ? (
                                    <span className="text-[10px] font-semibold text-emerald-700">
                                      Feature selected
                                    </span>
                                  ) : null}
                                </span>
                                <span className="mt-0.5 block truncate font-mono text-[11px] text-zinc-500">
                                  {feature.route}
                                </span>
                              </span>
                            </label>
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                onClick={() => moveFeature(index, "up")}
                                disabled={!canMoveUp}
                                aria-label={`Move ${feature.name} up`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  className="h-4 w-4"
                                  aria-hidden
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 15l6-6 6 6"
                                  />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => moveFeature(index, "down")}
                                disabled={!canMoveDown}
                                aria-label={`Move ${feature.name} down`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  className="h-4 w-4"
                                  aria-hidden
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 9l6 6 6-6"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>

                          <ModuleCheckboxTree
                            featureId={feature.id}
                            modules={feature.modules}
                            selectedKeys={selectedKeys}
                            onToggle={toggleKeys}
                          />
                        </div>
                      );
                    })
                  )}
                </div>

                {selectedPermissionLabels.length > 0 ? (
                  <p className="mt-2 text-xs font-medium text-emerald-800">
                    Selected ({selectedPermissionLabels.length}):{" "}
                    {selectedPermissionLabels.slice(0, 8).join(", ")}
                    {selectedPermissionLabels.length > 8
                      ? ` +${selectedPermissionLabels.length - 8} more`
                      : ""}
                  </p>
                ) : null}
              </div>

              {formError ? <p className="text-sm font-semibold text-red-700">{formError}</p> : null}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeRoleModal}
                  disabled={isSaving}
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-base font-bold text-zinc-900 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex min-w-36 items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-100 px-4 py-2.5 text-base font-bold text-emerald-900 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSaving ? "Saving…" : editingRoleId ? "Save changes" : "Add role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
