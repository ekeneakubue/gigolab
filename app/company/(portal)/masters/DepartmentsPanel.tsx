"use client";

import { FormEvent, useEffect, useState } from "react";

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

const EMPTY_FORM = {
  name: "",
  accountName: "",
  firmName: "",
  subDepartments: [""] as string[],
};

const inputCls =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60";

const labelCls = "block mb-1 text-xs font-medium text-zinc-600";

export default function DepartmentsPanel() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetch("/api/company/masters/departments")
      .then(async (r) => {
        if (!r.ok) return [];
        const data = (await r.json()) as unknown;
        return Array.isArray(data) ? (data as Department[]) : [];
      })
      .then((data) => { if (!cancelled) setDepartments(data); })
      .catch(() => { if (!cancelled) setDepartments([]); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function openCreateModal() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, subDepartments: [""] });
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(d: Department) {
    setEditingId(d.id);
    setForm({
      name: d.name,
      accountName: d.accountName,
      firmName: d.firmName,
      subDepartments:
        d.subDepartments.length > 0
          ? d.subDepartments.map((s) => s.name)
          : [""],
    });
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setFormError("");
  }

  function setField(key: "name" | "accountName" | "firmName", value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setSubDepartment(index: number, value: string) {
    setForm((prev) => {
      const next = [...prev.subDepartments];
      next[index] = value;
      return { ...prev, subDepartments: next };
    });
  }

  function addSubDepartment() {
    setForm((prev) => ({
      ...prev,
      subDepartments: [...prev.subDepartments, ""],
    }));
  }

  function removeSubDepartment(index: number) {
    setForm((prev) => {
      const next = prev.subDepartments.filter((_, i) => i !== index);
      return { ...prev, subDepartments: next.length > 0 ? next : [""] };
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    const name = form.name.trim();
    const accountName = form.accountName.trim();
    const firmName = form.firmName.trim();
    const subDepartments = form.subDepartments
      .map((s) => s.trim())
      .filter(Boolean);

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

    const payload = { name, accountName, firmName, subDepartments };
    const isEdit = Boolean(editingId);

    setSaving(true);
    try {
      const res = await fetch(
        isEdit
          ? `/api/company/masters/departments/${editingId}`
          : "/api/company/masters/departments",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setFormError(json.error ?? "Failed to save.");
        return;
      }

      const saved = (await res.json()) as Department;
      if (isEdit) {
        setDepartments((prev) => prev.map((d) => (d.id === saved.id ? saved : d)));
      } else {
        setDepartments((prev) => [...prev, saved]);
      }
      closeModal();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this department?")) return;
    try {
      const res = await fetch(`/api/company/masters/departments/${id}`, { method: "DELETE" });
      if (res.ok) setDepartments((prev) => prev.filter((d) => d.id !== id));
    } catch {
      // silent
    }
  }

  const isEditing = Boolean(editingId);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-800">Departments</h2>
          <p className="text-sm text-zinc-500">Manage laboratory department definitions.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800"
        >
          + Create Department
        </button>
      </div>

      <div className="h-[80vh] overflow-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Department Name</th>
              <th className="px-4 py-3 text-left">Sub Departments</th>
              <th className="px-4 py-3 text-left">A/c Name</th>
              <th className="px-4 py-3 text-left">Firm Name</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                  Loading…
                </td>
              </tr>
            ) : departments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                  No departments yet. Click &ldquo;+ Create Department&rdquo; to add one.
                </td>
              </tr>
            ) : (
              departments.map((d, i) => (
                <tr key={d.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 text-zinc-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-zinc-800">{d.name}</td>
                  <td className="px-4 py-3 text-zinc-600">
                    {d.subDepartments?.length
                      ? d.subDepartments.map((s) => s.name).join(", ")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{d.accountName}</td>
                  <td className="px-4 py-3 text-zinc-600">{d.firmName}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEditModal(d)}
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="text-xs font-medium text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-zinc-100 px-6 pt-6 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-800">
                  {isEditing ? "Edit Department" : "Create Department"}
                </h3>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {isEditing
                    ? "Update this laboratory department."
                    : "Add a new laboratory department."}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="ml-4 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
              <div>
                <label className={labelCls}>Department Name</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Biochemistry, Haematology"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  disabled={saving}
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-600">Sub Department</label>
                  <button
                    type="button"
                    onClick={addSubDepartment}
                    disabled={saving}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-800 disabled:opacity-60"
                  >
                    + Add another
                  </button>
                </div>
                <div className="space-y-2">
                  {form.subDepartments.map((sub, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        className={inputCls}
                        placeholder={`Sub department ${index + 1}`}
                        value={sub}
                        onChange={(e) => setSubDepartment(index, e.target.value)}
                        disabled={saving}
                      />
                      {form.subDepartments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSubDepartment(index)}
                          disabled={saving}
                          className="shrink-0 rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-red-500 disabled:opacity-60"
                          aria-label="Remove sub department"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>A/c Name</label>
                <input
                  className={inputCls}
                  placeholder="Account name"
                  value={form.accountName}
                  onChange={(e) => setField("accountName", e.target.value)}
                  disabled={saving}
                />
              </div>

              <div>
                <label className={labelCls}>Firm Name</label>
                <input
                  className={inputCls}
                  placeholder="Firm name"
                  value={form.firmName}
                  onChange={(e) => setField("firmName", e.target.value)}
                  disabled={saving}
                />
              </div>

              {formError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
              )}

              <div className="flex justify-end gap-3 border-t border-zinc-100 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? "Saving…" : isEditing ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
