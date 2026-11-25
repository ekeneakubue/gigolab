"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { generateBranchCode } from "@/lib/branch-code";

const inputClass =
  "mt-1.5 h-10 w-full rounded-xl border border-emerald-200 px-3 text-base font-medium text-zinc-900 placeholder:text-zinc-600 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

type Branch = {
  id: string;
  code: string;
  name: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  isMain: boolean;
  status: "Active" | "Trial" | "Inactive";
  createdAt: string;
};

type BranchForm = {
  code: string;
  name: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  isMain: boolean;
  status: "Active" | "Trial" | "Inactive";
};

type BranchesResponse = {
  companyName: string;
  branches: Branch[];
};

const statusMeta: Record<string, { badge: string; dot: string }> = {
  Active: { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  Trial: { badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  Inactive: { badge: "bg-zinc-200 text-zinc-600", dot: "bg-zinc-400" },
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const emptyForm = (code = generateBranchCode()): BranchForm => ({
  code,
  name: "",
  location: "",
  address: "",
  phone: "",
  email: "",
  isMain: false,
  status: "Active",
});

function isBranch(payload: Branch | { error?: string }): payload is Branch {
  return "id" in payload && typeof payload.id === "string";
}

export default function CompanyBranchesPanel() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<BranchForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [deletingBranchId, setDeletingBranchId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBranches() {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch("/api/company/branches", { cache: "no-store" });
        const data = (await response.json()) as BranchesResponse | { error?: string };
        if (cancelled) return;
        if (!response.ok || !("branches" in data) || !Array.isArray(data.branches)) {
          setBranches([]);
          setError("error" in data && data.error ? data.error : "Could not load branches.");
          return;
        }
        setBranches(data.branches);
      } catch {
        if (!cancelled) {
          setBranches([]);
          setError("Could not load branches. Please try again.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadBranches();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredBranches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter((branch) =>
      [
        branch.code,
        branch.name,
        branch.location,
        branch.address,
        branch.phone,
        branch.email,
        branch.status,
        branch.isMain ? "main" : "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [branches, search]);

  const openAddModal = () => {
    setFormError("");
    setIsSaving(false);
    setEditingBranchId(null);
    setForm(emptyForm());
    setIsModalOpen(true);
  };

  const openEditModal = (branch: Branch) => {
    setFormError("");
    setIsSaving(false);
    setEditingBranchId(branch.id);
    setForm({
      code: branch.code,
      name: branch.name,
      location: branch.location,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
      isMain: branch.isMain,
      status: branch.status,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setFormError("");
    setEditingBranchId(null);
  };

  const deleteBranch = async (branch: Branch) => {
    const confirmed = window.confirm(
      `Delete branch "${branch.name}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingBranchId(branch.id);
    try {
      const response = await fetch(`/api/company/branches/${branch.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        window.alert(payload.error ?? "Could not delete branch.");
        return;
      }
      setBranches((prev) => prev.filter((item) => item.id !== branch.id));
      if (editingBranchId === branch.id) closeModal();
    } catch {
      window.alert("Could not delete branch. Please try again.");
    } finally {
      setDeletingBranchId(null);
    }
  };

  const submitBranch = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Branch name is required.");
      return;
    }
    if (!form.location.trim()) {
      setFormError("Location is required.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        editingBranchId
          ? `/api/company/branches/${editingBranchId}`
          : "/api/company/branches",
        {
          method: editingBranchId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(editingBranchId ? {} : { code: form.code.trim().toUpperCase() }),
            name: form.name.trim(),
            location: form.location.trim(),
            address: form.address.trim(),
            phone: form.phone.trim(),
            email: form.email.trim(),
            isMain: form.isMain,
            status: form.status,
          }),
        },
      );
      const payload = (await response.json()) as Branch | { error?: string };
      if (!response.ok || !isBranch(payload)) {
        setFormError(
          "error" in payload && payload.error ? payload.error : "Could not save branch.",
        );
        return;
      }

      setBranches((prev) => {
        const next = editingBranchId
          ? prev.map((item) => (item.id === editingBranchId ? payload : item))
          : [payload, ...prev];
        if (payload.isMain) {
          return next.map((item) =>
            item.id === payload.id ? item : { ...item, isMain: false },
          );
        }
        return next;
      });
      closeModal();
    } catch {
      setFormError("Could not save branch. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[#dfe4ef] bg-[#f3f5fa] px-4 py-4 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.65)] sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-base font-bold text-zinc-900">Branches</h1>
            <p className="text-xs text-zinc-700">
              Lab branches and collection centres for your organisation
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500"
              >
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search branches..."
                className="h-9 w-full rounded-lg border border-[#d7ddea] bg-white/80 pr-3 pl-9 text-sm text-zinc-800 outline-none placeholder:text-zinc-500 focus:border-[#bcc6da] focus:bg-white"
              />
            </div>
            <button
              type="button"
              onClick={openAddModal}
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
              Add branch
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
            <h2 className="text-sm font-bold text-zinc-900">All branches</h2>
            <p className="text-xs text-zinc-600">
              {isLoading
                ? "Loading branches…"
                : `${filteredBranches.length} of ${branches.length} branches`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8ecf5] bg-[#f3f5fa]/80">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold tracking-wider text-zinc-600 uppercase">
                    Branch
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-zinc-600 uppercase">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-zinc-600 uppercase">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-zinc-600 uppercase">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-zinc-600 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-zinc-600 uppercase">
                    Added
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold tracking-wider text-zinc-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8ecf5]/80">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm text-zinc-600">
                      Loading branches…
                    </td>
                  </tr>
                ) : filteredBranches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <p className="text-sm font-medium text-zinc-700">No branches found</p>
                      <p className="mt-1 text-xs text-zinc-600">
                        {branches.length === 0
                          ? "Click “Add branch” to create one."
                          : "Try a different search term."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredBranches.map((branch) => {
                    const status = statusMeta[branch.status] ?? statusMeta.Active;
                    return (
                      <tr key={branch.id} className="transition-colors hover:bg-[#f3f5fa]/60">
                        <td className="px-5 py-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-[13px] font-semibold text-zinc-800">
                                {branch.name}
                              </p>
                              {branch.isMain ? (
                                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-sky-800 uppercase">
                                  Main
                                </span>
                              ) : null}
                            </div>
                            <p className="truncate text-xs text-zinc-500">
                              {branch.address || "No street address"}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[12px] text-emerald-700">
                          {branch.code}
                        </td>
                        <td className="px-4 py-3 text-zinc-600">{branch.location || "—"}</td>
                        <td className="px-4 py-3">
                          <p className="text-zinc-600">{branch.phone || "—"}</p>
                          <p className="truncate text-xs text-zinc-500">
                            {branch.email || "No email"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.badge}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                            {branch.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-zinc-600">
                          {dateFormatter.format(new Date(branch.createdAt))}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(branch)}
                              aria-label={`Edit ${branch.name}`}
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
                              onClick={() => void deleteBranch(branch)}
                              disabled={deletingBranchId === branch.id}
                              aria-label={`Delete ${branch.name}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingBranchId === branch.id ? (
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close branch form"
            className="absolute inset-0 cursor-default"
            onClick={closeModal}
          />
          <div className="relative flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-emerald-100 bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-2xl">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-emerald-50 px-4 py-3.5 sm:px-6">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-zinc-950">
                  {editingBranchId ? "Edit branch" : "Add branch"}
                </h2>
                <p className="mt-1 text-sm font-medium text-zinc-800">
                  {editingBranchId
                    ? "Update this lab branch or collection centre"
                    : "Register a new branch for your lab"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
              >
                Close
              </button>
            </div>

            <form onSubmit={submitBranch} className="space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-zinc-950">Branch name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    disabled={isSaving}
                    placeholder="e.g. Ikeja Collection Centre"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-950">Branch code</label>
                  <input
                    value={form.code}
                    readOnly
                    className={`${inputClass} cursor-default bg-emerald-50/60 font-mono`}
                  />
                  <p className="mt-1.5 text-xs text-zinc-600">
                    Auto-generated. Cannot be changed after create.
                  </p>
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-950">Location</label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    disabled={isSaving}
                    placeholder="City / area"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-950">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        status: e.target.value as BranchForm["status"],
                      }))
                    }
                    disabled={isSaving}
                    className={inputClass}
                  >
                    <option value="Active">Active</option>
                    <option value="Trial">Trial</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-bold text-zinc-950">Street address</label>
                  <input
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    disabled={isSaving}
                    placeholder="Optional full address"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-950">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    disabled={isSaving}
                    placeholder="Optional"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-950">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    disabled={isSaving}
                    placeholder="Optional"
                    className={inputClass}
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.isMain}
                  onChange={(e) => setForm((f) => ({ ...f, isMain: e.target.checked }))}
                  disabled={isSaving}
                  className="mt-0.5 h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-200"
                />
                <span>
                  <span className="block text-sm font-semibold text-zinc-900">
                    Main branch
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-600">
                    Only one main branch is kept. Setting this clears the previous main.
                  </span>
                </span>
              </label>

              {formError ? (
                <p className="text-sm font-semibold text-red-700">{formError}</p>
              ) : null}

              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end sm:gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-base font-bold text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex w-full min-w-36 items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-100 px-4 py-2.5 text-base font-bold text-emerald-900 hover:bg-emerald-200 disabled:opacity-70 sm:w-auto"
                >
                  {isSaving ? "Saving…" : editingBranchId ? "Save changes" : "Add branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
