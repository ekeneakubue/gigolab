"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type DoneFor = "Male" | "Female" | "Both";

type SubDepartmentOption = {
  id: string;
  name: string;
};

type DepartmentOption = {
  id: string;
  name: string;
  subDepartments: SubDepartmentOption[];
};

type LabTest = {
  id: string;
  name: string;
  printAs: string;
  departmentId: string;
  subDepartmentId: string | null;
  amount: number;
  testMrp: number;
  doneFor: DoneFor;
  createdAt: string;
  department: { id: string; name: string };
  subDepartment: { id: string; name: string } | null;
};

const EMPTY_FORM = {
  name: "",
  printAs: "",
  departmentId: "",
  subDepartmentId: "",
  amount: "",
  testMrp: "",
  doneFor: "Both" as DoneFor,
};

const inputCls =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60";

const labelCls = "block mb-1 text-xs font-medium text-zinc-600";

export default function TestsPanel() {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    Promise.all([
      fetch("/api/company/masters/tests").then(async (r) => {
        if (!r.ok) return [];
        const data = (await r.json()) as unknown;
        return Array.isArray(data) ? (data as LabTest[]) : [];
      }),
      fetch("/api/company/masters/departments").then(async (r) => {
        if (!r.ok) return [];
        const data = (await r.json()) as unknown;
        return Array.isArray(data) ? (data as DepartmentOption[]) : [];
      }),
    ])
      .then(([testData, deptData]) => {
        if (cancelled) return;
        setTests(testData);
        setDepartments(deptData);
      })
      .catch(() => {
        if (cancelled) return;
        setTests([]);
        setDepartments([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const subDepartmentOptions = useMemo(() => {
    const dept = departments.find((d) => d.id === form.departmentId);
    return dept?.subDepartments ?? [];
  }, [departments, form.departmentId]);

  function openCreateModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(t: LabTest) {
    setEditingId(t.id);
    setForm({
      name: t.name,
      printAs: t.printAs,
      departmentId: t.departmentId,
      subDepartmentId: t.subDepartmentId ?? "",
      amount: String(t.amount),
      testMrp: String(t.testMrp),
      doneFor: t.doneFor,
    });
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setFormError("");
  }

  function setField<K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleDepartmentChange(departmentId: string) {
    setForm((prev) => ({
      ...prev,
      departmentId,
      subDepartmentId: "",
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    const name = form.name.trim();
    const printAs = form.printAs.trim();
    const departmentId = form.departmentId;
    const subDepartmentId = form.subDepartmentId || null;
    const amount = Number(form.amount);
    const testMrp = Number(form.testMrp);
    const doneFor = form.doneFor;

    if (!name) {
      setFormError("Test name is required.");
      return;
    }
    if (!printAs) {
      setFormError("Print As is required.");
      return;
    }
    if (!departmentId) {
      setFormError("Department is required.");
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      setFormError("Amount must be a non-negative number.");
      return;
    }
    if (!Number.isFinite(testMrp) || testMrp < 0) {
      setFormError("Test MRP must be a non-negative number.");
      return;
    }

    const payload = {
      name,
      printAs,
      departmentId,
      subDepartmentId,
      amount,
      testMrp,
      doneFor,
    };
    const isEdit = Boolean(editingId);

    setSaving(true);
    try {
      const res = await fetch(
        isEdit
          ? `/api/company/masters/tests/${editingId}`
          : "/api/company/masters/tests",
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

      const saved = (await res.json()) as LabTest;
      if (isEdit) {
        setTests((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
      } else {
        setTests((prev) => [...prev, saved]);
      }
      closeModal();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this test?")) return;
    try {
      const res = await fetch(`/api/company/masters/tests/${id}`, { method: "DELETE" });
      if (res.ok) setTests((prev) => prev.filter((t) => t.id !== id));
    } catch {
      // silent
    }
  }

  const isEditing = Boolean(editingId);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-800">Tests</h2>
          <p className="text-sm text-zinc-500">Manage the laboratory test catalogue.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800"
        >
          + Add New Test
        </button>
      </div>

      <div className="h-[80vh] overflow-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Test Name</th>
              <th className="px-4 py-3 text-left">Department</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Done For</th>
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
            ) : tests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                  No tests yet. Click &ldquo;+ Add New Test&rdquo; to add one.
                </td>
              </tr>
            ) : (
              tests.map((t, i) => (
                <tr key={t.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 text-zinc-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-zinc-800">{t.name}</td>
                  <td className="px-4 py-3 text-zinc-600">
                    {t.department?.name ?? "—"}
                    {t.subDepartment ? ` / ${t.subDepartment.name}` : ""}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{t.amount}</td>
                  <td className="px-4 py-3 text-zinc-600">{t.doneFor}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEditModal(t)}
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
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
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-zinc-100 px-6 pt-6 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-800">
                  {isEditing ? "Edit Test" : "Add New Test"}
                </h3>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {isEditing
                    ? "Update this laboratory test."
                    : "Register a new laboratory test."}
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Test Name</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. Complete Blood Count"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className={labelCls}>Print As</label>
                  <input
                    className={inputCls}
                    placeholder="Name as printed on report"
                    value={form.printAs}
                    onChange={(e) => setField("printAs", e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className={labelCls}>Department</label>
                  <select
                    className={inputCls}
                    value={form.departmentId}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    disabled={saving}
                  >
                    <option value="">Select department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Sub Department</label>
                  <select
                    className={inputCls}
                    value={form.subDepartmentId}
                    onChange={(e) => setField("subDepartmentId", e.target.value)}
                    disabled={saving || !form.departmentId || subDepartmentOptions.length === 0}
                  >
                    <option value="">
                      {!form.departmentId
                        ? "Select department first"
                        : subDepartmentOptions.length === 0
                          ? "No sub departments"
                          : "Select sub department"}
                    </option>
                    {subDepartmentOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Amount</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className={inputCls}
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setField("amount", e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className={labelCls}>Test MRP</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className={inputCls}
                    placeholder="0.00"
                    value={form.testMrp}
                    onChange={(e) => setField("testMrp", e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelCls}>Done For?</label>
                  <div className="mt-1 flex flex-wrap gap-4">
                    {(["Male", "Female", "Both"] as const).map((option) => (
                      <label
                        key={option}
                        className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-700"
                      >
                        <input
                          type="radio"
                          name="doneFor"
                          value={option}
                          checked={form.doneFor === option}
                          onChange={() => setField("doneFor", option)}
                          disabled={saving}
                          className="h-4 w-4 border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
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
