"use client";

import { FormEvent, useEffect, useState } from "react";

type Doctor = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  clinicAddress: string;
  qualification: string;
  specialization: string;
  createdAt: string;
};

const EMPTY_FORM = {
  name: "",
  email: "",
  mobile: "",
  clinicAddress: "",
  qualification: "",
  specialization: "",
};

const inputCls =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60";

const labelCls = "block mb-1 text-xs font-medium text-zinc-600";

export default function DoctorsPanel() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetch("/api/company/masters/doctors")
      .then(async (r) => {
        if (!r.ok) return [];
        const data = (await r.json()) as unknown;
        return Array.isArray(data) ? (data as Doctor[]) : [];
      })
      .then((data) => { if (!cancelled) setDoctors(data); })
      .catch(() => { if (!cancelled) setDoctors([]); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function openCreateModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(d: Doctor) {
    setEditingId(d.id);
    setForm({
      name: d.name,
      email: d.email,
      mobile: d.mobile,
      clinicAddress: d.clinicAddress,
      qualification: d.qualification,
      specialization: d.specialization,
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
    const email = form.email.trim();
    const mobile = form.mobile.trim();
    const clinicAddress = form.clinicAddress.trim();
    const qualification = form.qualification.trim();
    const specialization = form.specialization.trim();

    if (!name) {
      setFormError("Doctor's name is required.");
      return;
    }
    if (!email) {
      setFormError("Email is required.");
      return;
    }
    if (!mobile) {
      setFormError("Mobile number is required.");
      return;
    }
    if (!clinicAddress) {
      setFormError("Clinic address is required.");
      return;
    }
    if (!qualification) {
      setFormError("Qualification is required.");
      return;
    }
    if (!specialization) {
      setFormError("Specialization is required.");
      return;
    }

    const payload = {
      name,
      email,
      mobile,
      clinicAddress,
      qualification,
      specialization,
    };
    const isEdit = Boolean(editingId);

    setSaving(true);
    try {
      const res = await fetch(
        isEdit
          ? `/api/company/masters/doctors/${editingId}`
          : "/api/company/masters/doctors",
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

      const saved = (await res.json()) as Doctor;
      if (isEdit) {
        setDoctors((prev) => prev.map((d) => (d.id === saved.id ? saved : d)));
      } else {
        setDoctors((prev) => [...prev, saved]);
      }
      closeModal();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this doctor?")) return;
    try {
      const res = await fetch(`/api/company/masters/doctors/${id}`, { method: "DELETE" });
      if (res.ok) setDoctors((prev) => prev.filter((d) => d.id !== id));
    } catch {
      // silent
    }
  }

  const isEditing = Boolean(editingId);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-800">Doctors</h2>
          <p className="text-sm text-zinc-500">Manage referring doctor directory.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800"
        >
          + Add Doctor
        </button>
      </div>

      <div className="h-[80vh] overflow-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Doctor&apos;s Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Mobile No</th>
              <th className="px-4 py-3 text-left">Specialization</th>
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
            ) : doctors.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                  No doctors yet. Click &ldquo;+ Add Doctor&rdquo; to add one.
                </td>
              </tr>
            ) : (
              doctors.map((d, i) => (
                <tr key={d.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 text-zinc-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-zinc-800">{d.name}</td>
                  <td className="px-4 py-3 text-zinc-600">{d.email}</td>
                  <td className="px-4 py-3 text-zinc-600">{d.mobile}</td>
                  <td className="px-4 py-3 text-zinc-600">{d.specialization}</td>
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
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-zinc-100 px-6 pt-6 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-800">
                  {isEditing ? "Edit Doctor" : "Add New Doctor"}
                </h3>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {isEditing
                    ? "Update this referring doctor record."
                    : "Register a new referring doctor."}
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
                <div className="sm:col-span-2">
                  <label className={labelCls}>Doctor&apos;s Name</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. Dr. John Smith"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className={labelCls}>Email</label>
                  <input
                    type="email"
                    className={inputCls}
                    placeholder="doctor@example.com"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className={labelCls}>Mobile No</label>
                  <input
                    type="tel"
                    className={inputCls}
                    placeholder="e.g. +91 98765 43210"
                    value={form.mobile}
                    onChange={(e) => setField("mobile", e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelCls}>Address (Clinic)</label>
                  <textarea
                    rows={2}
                    className={inputCls}
                    placeholder="Clinic address"
                    value={form.clinicAddress}
                    onChange={(e) => setField("clinicAddress", e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className={labelCls}>Qualification</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. MBBS, MD"
                    value={form.qualification}
                    onChange={(e) => setField("qualification", e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className={labelCls}>Specialization</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. Cardiology"
                    value={form.specialization}
                    onChange={(e) => setField("specialization", e.target.value)}
                    disabled={saving}
                  />
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
