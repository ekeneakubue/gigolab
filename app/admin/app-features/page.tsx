"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type FeatureStatus = "Active" | "Inactive";
type FeatureType = "Page" | "Menu";

type FeatureModule = {
  label: string;
  children: FeatureModule[];
};

type AppFeature = {
  id: string;
  name: string;
  route: string;
  type: FeatureType;
  modules: FeatureModule[];
  status: FeatureStatus;
  description: string;
};

type FeatureForm = {
  name: string;
  route: string;
  type: FeatureType;
  modules: FeatureModule[];
  status: FeatureStatus;
  description: string;
};

const statusMeta: Record<FeatureStatus, { badge: string; dot: string }> = {
  Active: { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  Inactive: { badge: "bg-zinc-100 text-zinc-500", dot: "bg-zinc-400" },
};

const typePills: Record<FeatureType, string> = {
  Page: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
  Menu: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
};

const inputClass =
  "mt-1.5 h-10 w-full rounded-xl border border-emerald-200 px-3 text-base font-medium text-zinc-900 placeholder:text-zinc-600 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

function emptyModule(): FeatureModule {
  return { label: "", children: [] };
}

function emptyForm(): FeatureForm {
  return {
    name: "",
    route: "",
    type: "Page",
    modules: [],
    status: "Active",
    description: "",
  };
}

function slugifyRoute(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug ? `/company/${slug}` : "";
}

function cloneModules(modules: FeatureModule[]): FeatureModule[] {
  return modules.map((module) => ({
    label: module.label,
    children: cloneModules(module.children),
  }));
}

function normalizeModules(modules: FeatureModule[]): FeatureModule[] {
  return modules
    .map((module) => ({
      label: module.label.trim(),
      children: normalizeModules(module.children),
    }))
    .filter((module) => module.label || module.children.length > 0)
    .map((module) => ({
      label: module.label || "Untitled",
      children: module.children,
    }));
}

function moduleSearchText(modules: FeatureModule[]): string[] {
  return modules.flatMap((module) => [module.label, ...moduleSearchText(module.children)]);
}

function countNestedModules(modules: FeatureModule[]): number {
  return modules.reduce(
    (total, module) => total + module.children.length + countNestedModules(module.children),
    0,
  );
}

function updateModulesAtPath(
  modules: FeatureModule[],
  path: number[],
  updater: (node: FeatureModule) => FeatureModule | null,
): FeatureModule[] {
  if (path.length === 0) return modules;
  const [index, ...rest] = path;
  return modules
    .map((module, i) => {
      if (i !== index) return module;
      if (rest.length === 0) return updater(module);
      return {
        ...module,
        children: updateModulesAtPath(module.children, rest, updater),
      };
    })
    .filter((module): module is FeatureModule => module !== null);
}

function removeModuleAtPath(modules: FeatureModule[], path: number[]): FeatureModule[] {
  if (path.length === 0) return modules;
  if (path.length === 1) {
    return modules.filter((_, i) => i !== path[0]);
  }
  const [index, ...rest] = path;
  return modules.map((module, i) =>
    i === index ? { ...module, children: removeModuleAtPath(module.children, rest) } : module,
  );
}

function moveModuleAtPath(
  modules: FeatureModule[],
  path: number[],
  direction: "up" | "down",
): FeatureModule[] {
  if (path.length === 0) return modules;

  if (path.length === 1) {
    const index = path[0];
    const target = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || index >= modules.length || target < 0 || target >= modules.length) {
      return modules;
    }
    const next = [...modules];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    return next;
  }

  const [index, ...rest] = path;
  return modules.map((module, i) =>
    i === index
      ? { ...module, children: moveModuleAtPath(module.children, rest, direction) }
      : module,
  );
}

type ModuleEditorProps = {
  modules: FeatureModule[];
  pathPrefix?: number[];
  depth?: number;
  onChangeLabel: (path: number[], value: string) => void;
  onAddNested: (path: number[]) => void;
  onMove: (path: number[], direction: "up" | "down") => void;
  onRemove: (path: number[]) => void;
};

function ModuleEditor({
  modules,
  pathPrefix = [],
  depth = 0,
  onChangeLabel,
  onAddNested,
  onMove,
  onRemove,
}: ModuleEditorProps) {
  const borderClass =
    depth === 0
      ? "border-emerald-100 bg-emerald-50/30"
      : depth === 1
        ? "border-sky-100 bg-sky-50/40"
        : "border-violet-100 bg-violet-50/40";
  const nestedButtonClass =
    depth === 0
      ? "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
      : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100";

  return (
    <div className={depth === 0 ? "space-y-3" : "mt-2 space-y-2 border-l-2 border-sky-200 pl-3"}>
      {modules.map((module, index) => {
        const path = [...pathPrefix, index];
        const canMoveUp = index > 0;
        const canMoveDown = index < modules.length - 1;
        return (
          <div key={path.join("-")} className={`rounded-xl border p-3 ${borderClass}`}>
            <div className="flex items-center gap-2">
              <input
                value={module.label}
                onChange={(e) => onChangeLabel(path, e.target.value)}
                placeholder={depth === 0 ? `Sub-menu ${index + 1}` : `Nested item ${index + 1}`}
                className={`${inputClass} mt-0`}
              />
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => onMove(path, "up")}
                  disabled={!canMoveUp}
                  aria-label={`Move item ${index + 1} up`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="h-4 w-4"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 15l6-6 6 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => onMove(path, "down")}
                  disabled={!canMoveDown}
                  aria-label={`Move item ${index + 1} down`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="h-4 w-4"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>
              <button
                type="button"
                onClick={() => onAddNested(path)}
                className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold ${nestedButtonClass}`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  className="h-3.5 w-3.5"
                  aria-hidden
                >
                  <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                </svg>
                Nested
              </button>
              <button
                type="button"
                onClick={() => onRemove(path)}
                aria-label={`Remove item ${index + 1}`}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-4 w-4"
                  aria-hidden
                >
                  <path strokeLinecap="round" d="M6 12h12" />
                </svg>
              </button>
            </div>

            {module.children.length > 0 ? (
              <ModuleEditor
                modules={module.children}
                pathPrefix={path}
                depth={depth + 1}
                onChangeLabel={onChangeLabel}
                onAddNested={onAddNested}
                onMove={onMove}
                onRemove={onRemove}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default function AdminAppFeaturesPage() {
  const [features, setFeatures] = useState<AppFeature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<FeatureForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [deletingFeatureId, setDeletingFeatureId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFeatures() {
      setIsLoading(true);
      setLoadError("");
      try {
        const response = await fetch("/api/admin/app-features");
        const data = (await response.json()) as AppFeature[] | { error?: string };
        if (cancelled) return;
        if (!response.ok || !Array.isArray(data)) {
          setFeatures([]);
          setLoadError(
            !Array.isArray(data) && data.error ? data.error : "Could not load app features.",
          );
          return;
        }
        setFeatures(data);
      } catch {
        if (!cancelled) {
          setFeatures([]);
          setLoadError("Could not load app features. Please try again.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadFeatures();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredFeatures = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return features;
    return features.filter((feature) =>
      [
        feature.name,
        feature.route,
        feature.type,
        feature.status,
        feature.description,
        ...moduleSearchText(feature.modules),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [features, search]);

  const overviewStats = useMemo(
    () => [
      { label: "Total features", value: features.length },
      { label: "Active", value: features.filter((f) => f.status === "Active").length },
      { label: "Menus", value: features.filter((f) => f.type === "Menu").length },
      { label: "Pages", value: features.filter((f) => f.type === "Page").length },
    ],
    [features],
  );

  const openAddFeatureModal = () => {
    setFormError("");
    setIsSaving(false);
    setEditingFeatureId(null);
    setForm(emptyForm());
    setIsModalOpen(true);
  };

  const openEditFeatureModal = (feature: AppFeature) => {
    setFormError("");
    setIsSaving(false);
    setEditingFeatureId(feature.id);
    setForm({
      name: feature.name,
      route: feature.route,
      type: feature.type,
      modules:
        feature.type === "Menu"
          ? feature.modules.length > 0
            ? cloneModules(feature.modules)
            : [emptyModule()]
          : cloneModules(feature.modules),
      status: feature.status,
      description: feature.description,
    });
    setIsModalOpen(true);
  };

  const addModuleRow = () => {
    setForm((prev) => ({
      ...prev,
      type: "Menu",
      modules: [...prev.modules, emptyModule()],
    }));
  };

  const updateModuleLabel = (path: number[], value: string) => {
    setForm((prev) => ({
      ...prev,
      modules: updateModulesAtPath(prev.modules, path, (node) => ({
        ...node,
        label: value,
      })),
    }));
  };

  const addNestedSubmenu = (path: number[]) => {
    setForm((prev) => ({
      ...prev,
      type: "Menu",
      modules: updateModulesAtPath(prev.modules, path, (node) => ({
        ...node,
        children: [...node.children, emptyModule()],
      })),
    }));
  };

  const removeModuleRow = (path: number[]) => {
    setForm((prev) => {
      const nextModules = removeModuleAtPath(prev.modules, path);
      return {
        ...prev,
        modules: nextModules.length > 0 || path.length > 1 ? nextModules : [emptyModule()],
      };
    });
  };

  const moveModuleRow = (path: number[], direction: "up" | "down") => {
    setForm((prev) => ({
      ...prev,
      modules: moveModuleAtPath(prev.modules, path, direction),
    }));
  };

  const deleteFeature = async (feature: AppFeature) => {
    if (!window.confirm(`Delete "${feature.name}"? This cannot be undone.`)) return;

    setDeletingFeatureId(feature.id);
    try {
      const response = await fetch(`/api/admin/app-features/${feature.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        window.alert(payload.error ?? "Could not delete feature.");
        return;
      }
      setFeatures((prev) => prev.filter((row) => row.id !== feature.id));
      if (editingFeatureId === feature.id) {
        setIsModalOpen(false);
        setEditingFeatureId(null);
      }
    } catch {
      window.alert("Could not delete feature. Please try again.");
    } finally {
      setDeletingFeatureId(null);
    }
  };

  const submitFeature = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");

    const name = form.name.trim();
    const route = form.route.trim() || slugifyRoute(name);
    if (!name) {
      setFormError("Feature name is required.");
      return;
    }
    if (!route) {
      setFormError("Route is required.");
      return;
    }
    if (
      features.some(
        (feature) =>
          feature.id !== editingFeatureId &&
          (feature.route === route || feature.name.toLowerCase() === name.toLowerCase()),
      )
    ) {
      setFormError("A feature with this name or route already exists.");
      return;
    }

    setIsSaving(true);
    const modules = form.type === "Menu" ? normalizeModules(form.modules) : [];
    const description = form.description.trim() || "Custom company portal feature.";
    const body = {
      name,
      route,
      type: form.type,
      status: form.status,
      description,
      modules,
    };

    try {
      const response = await fetch(
        editingFeatureId
          ? `/api/admin/app-features/${editingFeatureId}`
          : "/api/admin/app-features",
        {
          method: editingFeatureId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const payload = (await response.json()) as AppFeature | { error?: string };
      if (!response.ok || !("id" in payload)) {
        setFormError(
          "error" in payload && payload.error ? payload.error : "Could not save feature.",
        );
        return;
      }

      setFeatures((prev) =>
        editingFeatureId
          ? prev.map((feature) => (feature.id === editingFeatureId ? payload : feature))
          : [...prev, payload],
      );
      setForm(emptyForm());
      setEditingFeatureId(null);
      setIsModalOpen(false);
    } catch {
      setFormError("Could not save feature. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-emerald-100 bg-white px-4 py-3 shadow-sm sm:px-6 sm:py-3.5">
        <div className="min-w-0">
          <h1 className="text-base font-bold text-zinc-900">App Features</h1>
          <p className="hidden text-xs text-zinc-400 sm:block">
            Company dashboard sidebar modules available to labs
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="relative hidden md:block">
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
              placeholder="Search features…"
              className="h-8 w-56 rounded-lg border border-emerald-100 bg-emerald-50/50 pl-9 pr-3 text-sm text-zinc-700 placeholder:text-zinc-400 outline-none transition-colors focus:border-emerald-300 focus:bg-white"
            />
          </div>

          <button
            type="button"
            onClick={openAddFeatureModal}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-3.5 w-3.5">
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
            Add Feature
          </button>
        </div>
      </header>

      <main className="flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="relative md:hidden">
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
            placeholder="Search features…"
            className="h-10 w-full rounded-xl border border-emerald-100 bg-white pl-9 pr-3 text-sm text-zinc-700 placeholder:text-zinc-400 outline-none focus:border-emerald-300"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          {overviewStats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-white px-4 py-2.5 shadow-sm"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-sm font-bold text-emerald-700">
                {stat.value}
              </span>
              <span className="text-xs font-medium text-zinc-500">{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-md">
          <div className="border-b border-emerald-50 px-4 py-4 sm:px-5">
            <h2 className="text-sm font-bold text-zinc-900">Dashboard sidebar features</h2>
            <p className="text-xs text-zinc-400">
              {isLoading
                ? "Loading features…"
                : `${filteredFeatures.length} of ${features.length} company portal modules`}
            </p>
            {loadError ? (
              <p className="mt-2 text-xs font-medium text-rose-700">{loadError}</p>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-emerald-50 bg-emerald-50/40">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Feature
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Route
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Modules
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50/80">
                {filteredFeatures.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <p className="text-sm font-medium text-zinc-600">No features found</p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {features.length === 0
                          ? "Add a feature to get started."
                          : "Try a different search term."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredFeatures.map((feature) => {
                    const status = statusMeta[feature.status];
                    return (
                      <tr key={feature.id} className="transition-colors hover:bg-emerald-50/40">
                        <td className="px-5 py-3">
                          <div className="min-w-[180px]">
                            <p className="text-[13px] font-semibold text-zinc-800">{feature.name}</p>
                            <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-500">
                              {feature.description}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <code className="rounded-md bg-zinc-100 px-2 py-1 font-mono text-[11px] font-medium text-zinc-700">
                            {feature.route}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${typePills[feature.type]}`}
                          >
                            {feature.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-600">
                          {feature.modules.length === 0 ? (
                            <span className="text-zinc-400">—</span>
                          ) : (
                            <div className="max-w-[280px]">
                              <p className="text-[12px] font-semibold text-zinc-700">
                                {feature.modules.length} module
                                {feature.modules.length === 1 ? "" : "s"}
                                {countNestedModules(feature.modules) > 0
                                  ? ` · ${countNestedModules(feature.modules)} nested`
                                  : ""}
                              </p>
                              <p className="mt-0.5 line-clamp-2 text-[11px] text-zinc-500">
                                {feature.modules.map((module) => module.label).join(", ")}
                              </p>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${status.badge}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                            {feature.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditFeatureModal(feature)}
                              aria-label={`Edit ${feature.name}`}
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
                              onClick={() => deleteFeature(feature)}
                              disabled={deletingFeatureId === feature.id}
                              aria-label={`Delete ${feature.name}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingFeatureId === feature.id ? (
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
                    );
                  })
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
                  {editingFeatureId ? "Edit Feature" : "Add New Feature"}
                </h2>
                <p className="mt-1 text-sm font-medium text-zinc-800">
                  {editingFeatureId
                    ? "Update this company dashboard sidebar module"
                    : "Register a company dashboard sidebar module"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingFeatureId(null);
                }}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                Close
              </button>
            </div>

            <form onSubmit={submitFeature} className="space-y-3 px-6 py-4">
              <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-sm font-bold text-zinc-950">Feature name</label>
                  <input
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        name,
                        route: prev.route || slugifyRoute(name),
                      }));
                    }}
                    placeholder="e.g. Inventory"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-zinc-950">Route</label>
                  <input
                    value={form.route}
                    onChange={(e) => setForm((prev) => ({ ...prev, route: e.target.value }))}
                    placeholder="/company/inventory"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-zinc-950">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => {
                      const nextType = e.target.value as FeatureType;
                      setForm((prev) => ({
                        ...prev,
                        type: nextType,
                        modules:
                          nextType === "Menu"
                            ? prev.modules.length > 0
                              ? prev.modules
                              : [emptyModule()]
                            : prev.modules,
                      }));
                    }}
                    className={inputClass}
                  >
                    <option value="Page">Page</option>
                    <option value="Menu">Menu</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-zinc-950">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, status: e.target.value as FeatureStatus }))
                    }
                    className={inputClass}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="text-sm font-bold text-zinc-950">
                      Modules
                      <span className="font-medium text-zinc-600"> (sidebar sub-menus)</span>
                    </label>
                    <button
                      type="button"
                      onClick={addModuleRow}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-3.5 w-3.5">
                        <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                      </svg>
                      Add sub-menu
                    </button>
                  </div>

                  {form.type === "Page" && form.modules.length === 0 ? (
                    <p className="mt-2 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-3 py-3 text-sm text-zinc-600">
                      Page features have no sub-menus. Switch type to Menu or add a sub-menu to edit modules.
                    </p>
                  ) : (
                    <div className="mt-2">
                      <ModuleEditor
                        modules={form.modules}
                        onChangeLabel={updateModuleLabel}
                        onAddNested={addNestedSubmenu}
                        onMove={moveModuleRow}
                        onRemove={removeModuleRow}
                      />
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-bold text-zinc-950">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    placeholder="What this sidebar feature unlocks for a lab"
                    className="mt-1.5 w-full rounded-xl border border-emerald-200 px-3 py-2.5 text-base font-medium text-zinc-900 placeholder:text-zinc-600 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              {formError ? <p className="text-sm font-semibold text-red-700">{formError}</p> : null}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingFeatureId(null);
                  }}
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
                  {isSaving ? "Saving…" : editingFeatureId ? "Save changes" : "Add feature"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
