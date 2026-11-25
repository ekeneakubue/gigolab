"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type InsuranceType = {
  id: string;
  name: string;
  code: string;
  description: string;
  status: "Active" | "Trial" | "Inactive";
  createdAt: string;
};

type InsuranceTypeForm = {
  name: string;
  code: string;
  description: string;
  status: "Active" | "Trial" | "Inactive";
};

const inputClass =
  "mt-1.5 h-10 w-full rounded-xl border border-emerald-200 px-3 text-base font-medium text-zinc-900 placeholder:text-zinc-600 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60";

const emptyForm = (): InsuranceTypeForm => ({
  name: "",
  code: "",
  description: "",
  status: "Active",
});

const statusMeta: Record<string, { badge: string; dot: string }> = {
  Active: { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  Trial: { badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  Inactive: { badge: "bg-zinc-200 text-zinc-600", dot: "bg-zinc-400" },
};

function isInsuranceType(
  payload: InsuranceType | { error?: string },
): payload is InsuranceType {
  return "id" in payload && typeof payload.id === "string";
}

export default function InsuranceTypePanel() {
  const [types, setTypes] = useState<InsuranceType[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<InsuranceTypeForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch("/api/company/insurance/types", {
          cache: "no-store",
        });
        const data = (await response.json()) as InsuranceType[] | { error?: string };
        if (cancelled) return;
        if (!response.ok || !Array.isArray(data)) {
          setTypes([]);
          setError(
            !Array.isArray(data) && data.error
              ? data.error
              : "Could not load insurance types.",
          );
          return;
        }
        setTypes(data);
      } catch {
        if (!cancelled) {
          setTypes([]);
          setError("Could not load insurance types. Please try again.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return types;
    return types.filter((item) =>
      [item.name, item.code, item.description, item.status]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [types, search]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormError("");
    setIsSaving(false);
    setIsModalOpen(true);
  };

  const openEditModal = (item: InsuranceType) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      code: item.code,
      description: item.description,
      status: item.status,
    });
    setFormError("");
    setIsSaving(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    setFormError("");
  };

  const submitType = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Insurance type name is required.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        editingId
          ? `/api/company/insurance/types/${editingId}`
          : "/api/company/insurance/types",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            code: form.code.trim().toUpperCase(),
            description: form.description.trim(),
            status: form.status,
          }),
        },
      );
      const payload = (await response.json()) as InsuranceType | { error?: string };
      if (!response.ok || !isInsuranceType(payload)) {
        setFormError(
          "error" in payload && payload.error
            ? payload.error
            : "Could not save insurance type.",
        );
        return;
      }

      setTypes((prev) =>
        editingId
          ? prev.map((item) => (item.id === editingId ? payload : item))
          : [payload, ...prev],
      );
      closeModal();
    } catch {
      setFormError("Could not save insurance type. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteType = async (item: InsuranceType) => {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;

    setDeletingId(item.id);
    setError("");
    try {
      const response = await fetch(`/api/company/insurance/types/${item.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setError(payload.error ?? "Could not delete insurance type.");
        return;
      }
      setTypes((prev) => prev.filter((row) => row.id !== item.id));
      if (editingId === item.id) closeModal();
    } catch {
      setError("Could not delete insurance type. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[#dfe4ef] bg-[#f3f5fa] px-4 py-4 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.65)] sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-base font-bold text-zinc-900">Insurance Type</h1>
            <p className="text-xs text-zinc-700">
              Define insurance categories used when registering patients
            </p>
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
                placeholder="Search types..."
                className="h-9 w-full rounded-lg border border-[#d7ddea] bg-white/80 pl-9 pr-3 text-sm text-zinc-800 placeholder:text-zinc-500 outline-none focus:border-[#bcc6da] focus:bg-white"
              />
            </div>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-4 w-4"
              >
                <path strokeLinecap="round" d="M12 5v14M5 12h14" />
              </svg>
              Add insurance type
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        {error ? (
          <p className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </p>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-[#dfe4ef] bg-white shadow-[0_16px_32px_-24px_rgba(15,23,42,0.6)]">
          <div className="border-b border-[#e8ecf5] px-5 py-4">
            <h2 className="text-sm font-bold text-zinc-900">Insurance types</h2>
            <p className="text-xs text-zinc-600">
              {isLoading
                ? "Loading insurance types…"
                : `${filtered.length} of ${types.length} types`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8ecf5] bg-[#f3f5fa]/80">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Status
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
                      Loading insurance types…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <p className="text-sm font-medium text-zinc-700">
                        {types.length === 0
                          ? "No insurance types yet"
                          : "No matching insurance types"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-600">
                        {types.length === 0
                          ? "Click “Add insurance type” to create HMO, NHIS, corporate, and other categories."
                          : "Try a different search."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const status = statusMeta[item.status] ?? statusMeta.Inactive;
                    return (
                      <tr
                        key={item.id}
                        className="transition-colors hover:bg-[#f3f5fa]/60"
                      >
                        <td className="px-5 py-3 font-semibold text-zinc-900">{item.name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-zinc-600">
                          {item.code || "—"}
                        </td>
                        <td className="max-w-[280px] px-4 py-3 text-zinc-600">
                          <p className="line-clamp-2">{item.description || "—"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.badge}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100"
                              aria-label={`Edit ${item.name}`}
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                className="h-3.5 w-3.5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15.232 5.232l3.536 3.536M4 20h4.586a1 1 0 00.707-.293l9.414-9.414a2 2 0 000-2.828l-2.172-2.172a2 2 0 00-2.828 0L4.293 14.707A1 1 0 004 15.414V20z"
                                />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteType(item)}
                              disabled={deletingId === item.id}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                              aria-label={`Delete ${item.name}`}
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                className="h-3.5 w-3.5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 7h12M9 7V5h6v2m-7 0l1 12h6l1-12"
                                />
                              </svg>
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
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-emerald-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-50 px-6 py-3.5">
              <div>
                <h2 className="text-lg font-bold text-zinc-950">
                  {editingId ? "Edit Insurance Type" : "Add Insurance Type"}
                </h2>
                <p className="mt-1 text-sm font-medium text-zinc-800">
                  {editingId
                    ? "Update this insurance category"
                    : "Create a category such as HMO, NHIS, or Corporate"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                Close
              </button>
            </div>

            <form onSubmit={submitType} className="space-y-3 px-6 py-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-sm font-bold text-zinc-950">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. HMO, NHIS, Corporate"
                    className={inputClass}
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-950">Code</label>
                  <input
                    value={form.code}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        code: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="e.g. HMO"
                    className={`${inputClass} font-mono uppercase`}
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-950">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        status: e.target.value as InsuranceTypeForm["status"],
                      }))
                    }
                    className={inputClass}
                    disabled={isSaving}
                  >
                    <option>Active</option>
                    <option>Trial</option>
                    <option>Inactive</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-bold text-zinc-950">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={3}
                    placeholder="Short note about this insurance type"
                    className="mt-1.5 w-full rounded-xl border border-emerald-200 px-3 py-2.5 text-base font-medium text-zinc-900 placeholder:text-zinc-600 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
                    disabled={isSaving}
                  />
                </div>
              </div>

              {formError ? (
                <p className="text-sm font-semibold text-red-700">{formError}</p>
              ) : null}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
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
                  {isSaving ? "Saving…" : editingId ? "Save changes" : "Add type"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
