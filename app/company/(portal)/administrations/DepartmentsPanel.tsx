"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

const inputClass =
  "mt-1.5 h-10 w-full rounded-xl border border-emerald-200 px-3 text-base font-medium text-zinc-900 placeholder:text-zinc-600 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

type SubDepartment = {
  id: string;
  name: string;
};

type Department = {
  id: string;
  name: string;
  accountName: string;
  firmName: string;
  createdAt: string;
  subDepartments: SubDepartment[];
};

type DepartmentForm = {
  name: string;
  accountName: string;
  firmName: string;
  subDepartments: string[];
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const emptyForm = (): DepartmentForm => ({
  name: "",
  accountName: "",
  firmName: "",
  subDepartments: [""],
});

function isDepartment(payload: Department | { error?: string }): payload is Department {
  return "id" in payload && typeof payload.id === "string";
}

export default function CompanyDepartmentsPanel() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<DepartmentForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDepartments() {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch("/api/company/masters/departments", {
          cache: "no-store",
        });
        const data = (await response.json()) as Department[] | { error?: string };
        if (cancelled) return;
        if (!response.ok || !Array.isArray(data)) {
          setDepartments([]);
          setError(
            !Array.isArray(data) && data.error
              ? data.error
              : "Could not load departments.",
          );
          return;
        }
        setDepartments(data);
      } catch {
        if (!cancelled) {
          setDepartments([]);
          setError("Could not load departments. Please try again.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadDepartments();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredDepartments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter((department) =>
      [
        department.name,
        department.accountName,
        department.firmName,
        ...department.subDepartments.map((sub) => sub.name),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [departments, search]);

  const openAddModal = () => {
    setFormError("");
    setIsSaving(false);
    setEditingId(null);
    setForm(emptyForm());
    setIsModalOpen(true);
  };

  const openEditModal = (department: Department) => {
    setFormError("");
    setIsSaving(false);
    setEditingId(department.id);
    setForm({
      name: department.name,
      accountName: department.accountName,
      firmName: department.firmName,
      subDepartments:
        department.subDepartments.length > 0
          ? department.subDepartments.map((sub) => sub.name)
          : [""],
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setFormError("");
    setEditingId(null);
  };

  const setSubDepartment = (index: number, value: string) => {
    setForm((prev) => {
      const next = [...prev.subDepartments];
      next[index] = value;
      return { ...prev, subDepartments: next };
    });
  };

  const addSubDepartment = () => {
    setForm((prev) => ({
      ...prev,
      subDepartments: [...prev.subDepartments, ""],
    }));
  };

  const removeSubDepartment = (index: number) => {
    setForm((prev) => {
      const next = prev.subDepartments.filter((_, i) => i !== index);
      return { ...prev, subDepartments: next.length > 0 ? next : [""] };
    });
  };

  const deleteDepartment = async (department: Department) => {
    const confirmed = window.confirm(
      `Delete department "${department.name}"? Linked sub-departments will also be removed.`,
    );
    if (!confirmed) return;

    setDeletingId(department.id);
    try {
      const response = await fetch(
        `/api/company/masters/departments/${department.id}`,
        { method: "DELETE" },
      );
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        window.alert(payload.error ?? "Could not delete department.");
        return;
      }
      setDepartments((prev) => prev.filter((item) => item.id !== department.id));
      if (editingId === department.id) closeModal();
    } catch {
      window.alert("Could not delete department. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const submitDepartment = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");

    const name = form.name.trim();
    const accountName = form.accountName.trim();
    const firmName = form.firmName.trim();
    const subDepartments = form.subDepartments.map((item) => item.trim()).filter(Boolean);

    if (!name) {
      setFormError("Department name is required.");
      return;
    }
    if (!accountName) {
      setFormError("A/c name is required.");
      return;
    }
    if (!firmName) {
      setFormError("Firm name is required.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        editingId
          ? `/api/company/masters/departments/${editingId}`
          : "/api/company/masters/departments",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, accountName, firmName, subDepartments }),
        },
      );
      const payload = (await response.json()) as Department | { error?: string };
      if (!response.ok || !isDepartment(payload)) {
        setFormError(
          "error" in payload && payload.error
            ? payload.error
            : "Could not save department.",
        );
        return;
      }

      setDepartments((prev) =>
        editingId
          ? prev.map((item) => (item.id === editingId ? payload : item))
          : [...prev, payload],
      );
      closeModal();
    } catch {
      setFormError("Could not save department. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[#dfe4ef] bg-[#f3f5fa] px-4 py-4 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.65)] sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-base font-bold text-zinc-900">Departments</h1>
            <p className="text-xs text-zinc-700">
              Laboratory departments and sub-departments for diagnostics and masters
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
                placeholder="Search departments..."
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
              Add department
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
            <h2 className="text-sm font-bold text-zinc-900">All departments</h2>
            <p className="text-xs text-zinc-600">
              {isLoading
                ? "Loading departments…"
                : `${filteredDepartments.length} of ${departments.length} departments`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8ecf5] bg-[#f3f5fa]/80">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold tracking-wider text-zinc-600 uppercase">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-zinc-600 uppercase">
                    Sub-departments
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-zinc-600 uppercase">
                    A/c name
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-zinc-600 uppercase">
                    Firm
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
                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-zinc-600">
                      Loading departments…
                    </td>
                  </tr>
                ) : filteredDepartments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <p className="text-sm font-medium text-zinc-700">No departments found</p>
                      <p className="mt-1 text-xs text-zinc-600">
                        {departments.length === 0
                          ? "Click “Add department” to create one."
                          : "Try a different search term."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredDepartments.map((department) => (
                    <tr
                      key={department.id}
                      className="transition-colors hover:bg-[#f3f5fa]/60"
                    >
                      <td className="px-5 py-3">
                        <p className="text-[13px] font-semibold text-zinc-800">
                          {department.name}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {department.subDepartments.length > 0 ? (
                          <div className="flex max-w-xs flex-wrap gap-1.5">
                            {department.subDepartments.map((sub) => (
                              <span
                                key={sub.id}
                                className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800"
                              >
                                {sub.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{department.accountName}</td>
                      <td className="px-4 py-3 text-zinc-600">{department.firmName}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-zinc-600">
                        {dateFormatter.format(new Date(department.createdAt))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(department)}
                            aria-label={`Edit ${department.name}`}
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
                            onClick={() => void deleteDepartment(department)}
                            disabled={deletingId === department.id}
                            aria-label={`Delete ${department.name}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingId === department.id ? (
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close department form"
            className="absolute inset-0 cursor-default"
            onClick={closeModal}
          />
          <div className="relative flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-emerald-100 bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-2xl">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-emerald-50 px-4 py-3.5 sm:px-6">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-zinc-950">
                  {editingId ? "Edit department" : "Add department"}
                </h2>
                <p className="mt-1 text-sm font-medium text-zinc-800">
                  {editingId
                    ? "Update this laboratory department"
                    : "Create a department used across diagnostics and masters"}
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

            <form
              onSubmit={submitDepartment}
              className="space-y-4 overflow-y-auto px-4 py-4 sm:px-6"
            >
              <div>
                <label className="text-sm font-bold text-zinc-950">Department name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  disabled={isSaving}
                  placeholder="e.g. Biochemistry, Haematology"
                  className={inputClass}
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-bold text-zinc-950">Sub-departments</label>
                  <button
                    type="button"
                    onClick={addSubDepartment}
                    disabled={isSaving}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 disabled:opacity-50"
                  >
                    + Add another
                  </button>
                </div>
                <div className="mt-1.5 space-y-2">
                  {form.subDepartments.map((sub, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        value={sub}
                        onChange={(e) => setSubDepartment(index, e.target.value)}
                        disabled={isSaving}
                        placeholder={`Sub-department ${index + 1}`}
                        className={inputClass.replace("mt-1.5 ", "")}
                      />
                      {form.subDepartments.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeSubDepartment(index)}
                          disabled={isSaving}
                          aria-label="Remove sub-department"
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                          </svg>
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-zinc-950">A/c name</label>
                  <input
                    value={form.accountName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, accountName: e.target.value }))
                    }
                    disabled={isSaving}
                    placeholder="Account name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-950">Firm name</label>
                  <input
                    value={form.firmName}
                    onChange={(e) => setForm((f) => ({ ...f, firmName: e.target.value }))}
                    disabled={isSaving}
                    placeholder="Firm name"
                    className={inputClass}
                  />
                </div>
              </div>

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
                  {isSaving
                    ? "Saving…"
                    : editingId
                      ? "Save changes"
                      : "Add department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
