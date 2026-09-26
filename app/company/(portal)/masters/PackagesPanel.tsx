"use client";

import { FormEvent, useEffect, useState } from "react";

type Package = {
  id: string;
  name: string;
  amount: number;
  createdAt: string;
};

const EMPTY_FORM = {
  name: "",
  amount: "",
};

const inputCls =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60";

const labelCls = "block mb-1 text-xs font-medium text-zinc-600";

export default function PackagesPanel() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetch("/api/company/masters/packages")
      .then(async (r) => {
        if (!r.ok) return [];
        const data = (await r.json()) as unknown;
        return Array.isArray(data) ? (data as Package[]) : [];
      })
      .then((data) => { if (!cancelled) setPackages(data); })
      .catch(() => { if (!cancelled) setPackages([]); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function openCreateModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(pkg: Package) {
    setEditingId(pkg.id);
    setForm({
      name: pkg.name,
      amount: String(pkg.amount),
    });
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setFormError("");
  }

  function setField(key: keyof typeof EMPTY_FORM, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    const name = form.name.trim();
    const amount = Number(form.amount);

    if (!name) {
      setFormError("Package name is required.");
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      setFormError("Amount must be a non-negative number.");
      return;
    }

    const payload = { name, amount };
    const isEdit = Boolean(editingId);

    setSaving(true);
    try {
      const res = await fetch(
        isEdit
          ? `/api/company/masters/packages/${editingId}`
          : "/api/company/masters/packages",
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

      const saved = (await res.json()) as Package;
      if (isEdit) {
        setPackages((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
      } else {
        setPackages((prev) => [...prev, saved]);
      }
      closeModal();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this package?")) return;
    try {
      const res = await fetch(`/api/company/masters/packages/${id}`, { method: "DELETE" });
      if (res.ok) setPackages((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // silent
    }
  }

  const isEditing = Boolean(editingId);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-800">Packages</h2>
          <p className="text-sm text-zinc-500">Manage test packages and panels.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800"
        >
          + Create Package
        </button>
      </div>

      <div className="h-[80vh] overflow-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Package Name</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-400">
                  Loading…
                </td>
              </tr>
            ) : packages.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-400">
                  No packages yet. Click &ldquo;+ Create Package&rdquo; to add one.
                </td>
              </tr>
            ) : (
              packages.map((pkg, i) => (
                <tr key={pkg.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 text-zinc-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-zinc-800">{pkg.name}</td>
                  <td className="px-4 py-3 text-zinc-600">{pkg.amount}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEditModal(pkg)}
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(pkg.id)}
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
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-zinc-100 px-6 pt-6 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-800">
                  {isEditing ? "Edit Package" : "Create Package"}
                </h3>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {isEditing
                    ? "Update this test package."
                    : "Add a new test package."}
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
                <label className={labelCls}>Package Name</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Full Body Checkup"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  disabled={saving}
                />
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
