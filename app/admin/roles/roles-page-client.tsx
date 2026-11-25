"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  ADMIN_NAV_FEATURES,
  adminFeaturePermissionKey,
  buildSystemRoleDashboardRoute,
  type AdminNavFeature,
} from "@/lib/system-role";

type SystemRole = {
  id: string;
  name: string;
  description: string;
  dashboardRoute: string;
  kind: string;
  permissions: string;
  permissionKeys: string[];
};

type RoleForm = {
  name: string;
  dashboardRoute: string;
  description: string;
  kind: "Admin" | "Lab";
  permissionKeys: string[];
  routeAuto: boolean;
};

const inputClass =
  "mt-1.5 h-10 w-full rounded-xl border border-emerald-200 px-3 text-base font-medium text-zinc-900 placeholder:text-zinc-600 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

const emptyForm = (): RoleForm => ({
  name: "",
  dashboardRoute: "",
  description: "",
  kind: "Admin",
  permissionKeys: [],
  routeAuto: true,
});

function isSystemRole(payload: SystemRole | { error?: string }): payload is SystemRole {
  return "id" in payload && typeof payload.id === "string";
}

function featureKey(featureId: string) {
  return adminFeaturePermissionKey(featureId);
}

function collectFeatureKeys(feature: AdminNavFeature): string[] {
  return [featureKey(feature.id)];
}

export default function AdminRolesPageClient() {
  const [roles, setRoles] = useState<SystemRole[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);
  const [form, setForm] = useState<RoleForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const features = ADMIN_NAV_FEATURES;
  const allKeys = useMemo(() => features.flatMap(collectFeatureKeys), [features]);
  const selectedKeys = useMemo(() => new Set(form.permissionKeys), [form.permissionKeys]);

  const selectedPermissionLabels = useMemo(() => {
    return features
      .filter((feature) => selectedKeys.has(featureKey(feature.id)))
      .map((feature) => feature.name);
  }, [features, selectedKeys]);

  const filteredRoles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter((role) =>
      [role.name, role.description, role.dashboardRoute, role.kind, role.permissions]
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
        const response = await fetch("/api/admin/roles", { cache: "no-store" });
        const data = (await response.json()) as SystemRole[] | { error?: string };
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
            kind: role.kind ?? "Lab",
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

  const openAddRoleModal = () => {
    setFormError("");
    setIsSaving(false);
    setEditingRoleId(null);
    setForm(emptyForm());
    setIsModalOpen(true);
  };

  const openEditRoleModal = (role: SystemRole) => {
    setFormError("");
    setIsSaving(false);
    setEditingRoleId(role.id);
    setForm({
      name: role.name,
      dashboardRoute: role.dashboardRoute,
      description: role.description,
      kind: role.kind === "Admin" ? "Admin" : "Lab",
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

  const deleteRole = async (role: SystemRole) => {
    if (!window.confirm(`Delete "${role.name}"? This cannot be undone.`)) return;

    setDeletingRoleId(role.id);
    setListError("");
    try {
      const response = await fetch(`/api/admin/roles/${role.id}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setListError(payload.error ?? "Could not delete role.");
        return;
      }
      setRoles((prev) => prev.filter((item) => item.id !== role.id));
      if (editingRoleId === role.id) closeRoleModal();
    } catch {
      setListError("Could not delete role. Please try again.");
    } finally {
      setDeletingRoleId(null);
    }
  };

  const onRoleNameChange = (name: string) => {
    setForm((prev) => {
      const nextKind =
        prev.routeAuto &&
        ["Admin", "Manager", "Staff", "Supervisor"].includes(name.trim())
          ? "Admin"
          : prev.kind;
      return {
        ...prev,
        name,
        kind: nextKind,
        dashboardRoute: prev.routeAuto ? buildSystemRoleDashboardRoute(name) : prev.dashboardRoute,
      };
    });
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

  const toggleFeature = (feature: AdminNavFeature, checked: boolean) => {
    toggleKeys(collectFeatureKeys(feature), checked);
  };

  const toggleAllFeatures = () => {
    const allSelected = allKeys.length > 0 && allKeys.every((key) => selectedKeys.has(key));
    setForm((prev) => ({
      ...prev,
      permissionKeys: allSelected ? [] : allKeys,
    }));
  };

  const submitRole = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");

    const name = form.name.trim();
    const dashboardRoute =
      form.dashboardRoute.trim() || buildSystemRoleDashboardRoute(name);
    if (!name) {
      setFormError("Role name is required.");
      return;
    }
    if (
      !dashboardRoute.startsWith("/admin") &&
      !dashboardRoute.startsWith("/company/dashboards/")
    ) {
      setFormError("Dashboard route must be under /admin or /company/dashboards/.");
      return;
    }
    if (form.permissionKeys.length === 0) {
      setFormError("Select at least one feature or permission.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        editingRoleId ? `/api/admin/roles/${editingRoleId}` : "/api/admin/roles",
        {
          method: editingRoleId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            dashboardRoute,
            kind: form.kind,
            permissionKeys: form.permissionKeys,
          }),
        },
      );
      const payload = (await response.json()) as SystemRole | { error?: string };
      if (!response.ok || !isSystemRole(payload)) {
        setFormError(
          "error" in payload && payload.error ? payload.error : "Could not save role.",
        );
        return;
      }

      const nextRole: SystemRole = {
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
      <header className="shrink-0 border-b border-emerald-100 bg-white px-4 py-4 shadow-sm sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-base font-bold text-zinc-900">Roles</h1>
            <p className="text-xs text-zinc-600">
              Platform roles including admin and lab system roles
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              >
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search roles..."
                className="h-9 w-full rounded-lg border border-emerald-100 bg-white pl-9 pr-3 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
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
        <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
          <div className="border-b border-emerald-50 px-5 py-4">
            <h2 className="text-sm font-bold text-zinc-900">System roles</h2>
            <p className="text-xs text-zinc-500">
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
                <tr className="border-b border-emerald-50 bg-emerald-50/40">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Kind
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Dashboard route
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Features
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-zinc-500">
                      Loading roles…
                    </td>
                  </tr>
                ) : filteredRoles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <p className="text-sm font-medium text-zinc-700">No roles found</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {roles.length === 0
                          ? "Add a role to get started."
                          : "Try a different search term."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRoles.map((role) => (
                    <tr key={role.id} className="transition-colors hover:bg-emerald-50/40">
                      <td className="px-5 py-3 text-[13px] font-semibold text-zinc-800">
                        {role.name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            role.kind === "Admin"
                              ? "bg-violet-50 text-violet-700 ring-1 ring-violet-100"
                              : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                          }`}
                        >
                          {role.kind}
                        </span>
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
                    : "Create a role and assign admin features"}
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
                  placeholder="e.g. Admin"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-sm font-bold text-zinc-950">Kind</label>
                <select
                  value={form.kind}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      kind: e.target.value as "Admin" | "Lab",
                    }))
                  }
                  className={inputClass}
                >
                  <option value="Admin">Admin</option>
                  <option value="Lab">Lab</option>
                </select>
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
                  placeholder="/admin"
                  className={`${inputClass} cursor-default bg-emerald-50/60 font-mono text-sm text-zinc-700`}
                />
                <p className="mt-1.5 text-xs text-zinc-600">
                  Auto-generated from the role name. Users with this role land here on login.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-bold text-zinc-950">Features</label>
                  <button
                    type="button"
                    onClick={toggleAllFeatures}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    {allKeys.length > 0 && allKeys.every((key) => selectedKeys.has(key))
                      ? "Clear all"
                      : "Select all"}
                  </button>
                </div>
                <p className="mt-1 text-xs text-zinc-600">
                  Check admin sidebar features this role can access.
                </p>

                <div className="mt-2 max-h-80 space-y-2 overflow-y-auto rounded-xl border border-emerald-100 bg-emerald-50/30 p-3">
                  {features.map((feature) => {
                    const checked = selectedKeys.has(featureKey(feature.id));
                    return (
                      <label
                        key={feature.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                          checked
                            ? "border-emerald-200 bg-white shadow-sm"
                            : "border-transparent bg-white/70"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
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
                          </span>
                          <span className="mt-0.5 block truncate font-mono text-[11px] text-zinc-500">
                            {feature.route}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>

                {selectedPermissionLabels.length > 0 ? (
                  <p className="mt-2 text-xs font-medium text-emerald-800">
                    Selected ({selectedPermissionLabels.length}):{" "}
                    {selectedPermissionLabels.join(", ")}
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
