"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type ReferralDoctor = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  clinicAddress: string;
  qualification: string;
  specialization: string;
  createdAt: string;
};

type ReferralForm = {
  name: string;
  email: string;
  mobile: string;
  clinicAddress: string;
  qualification: string;
  specialization: string;
};

const inputClass =
  "mt-1.5 h-10 w-full rounded-xl border border-emerald-200 px-3 text-base font-medium text-zinc-900 placeholder:text-zinc-600 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60";

const emptyForm = (): ReferralForm => ({
  name: "",
  email: "",
  mobile: "",
  clinicAddress: "",
  qualification: "",
  specialization: "",
});

function isReferralDoctor(
  payload: ReferralDoctor | { error?: string },
): payload is ReferralDoctor {
  return "id" in payload && typeof payload.id === "string";
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "DR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export default function ReferralsPanel() {
  const [doctors, setDoctors] = useState<ReferralDoctor[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ReferralForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch("/api/company/masters/doctors", {
          cache: "no-store",
        });
        const data = (await response.json()) as ReferralDoctor[] | { error?: string };
        if (cancelled) return;
        if (!response.ok || !Array.isArray(data)) {
          setDoctors([]);
          setError(
            !Array.isArray(data) && data.error
              ? data.error
              : "Could not load referral doctors.",
          );
          return;
        }
        setDoctors(data);
      } catch {
        if (!cancelled) {
          setDoctors([]);
          setError("Could not load referral doctors. Please try again.");
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
    if (!q) return doctors;
    return doctors.filter((doctor) =>
      [
        doctor.name,
        doctor.email,
        doctor.mobile,
        doctor.clinicAddress,
        doctor.qualification,
        doctor.specialization,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [doctors, search]);

  const specialtyCount = useMemo(() => {
    return new Set(
      doctors.map((doctor) => doctor.specialization.trim().toLowerCase()).filter(Boolean),
    ).size;
  }, [doctors]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormError("");
    setIsSaving(false);
    setIsModalOpen(true);
  };

  const openEditModal = (doctor: ReferralDoctor) => {
    setEditingId(doctor.id);
    setForm({
      name: doctor.name,
      email: doctor.email,
      mobile: doctor.mobile,
      clinicAddress: doctor.clinicAddress,
      qualification: doctor.qualification,
      specialization: doctor.specialization,
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

  const submitReferral = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      mobile: form.mobile.trim(),
      clinicAddress: form.clinicAddress.trim(),
      qualification: form.qualification.trim(),
      specialization: form.specialization.trim(),
    };

    if (!payload.name) {
      setFormError("Doctor name is required.");
      return;
    }
    if (!payload.email) {
      setFormError("Email is required.");
      return;
    }
    if (!payload.mobile) {
      setFormError("Mobile number is required.");
      return;
    }
    if (!payload.clinicAddress) {
      setFormError("Clinic address is required.");
      return;
    }
    if (!payload.qualification) {
      setFormError("Qualification is required.");
      return;
    }
    if (!payload.specialization) {
      setFormError("Specialization is required.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        editingId
          ? `/api/company/masters/doctors/${editingId}`
          : "/api/company/masters/doctors",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await response.json()) as ReferralDoctor | { error?: string };
      if (!response.ok || !isReferralDoctor(data)) {
        setFormError(
          "error" in data && data.error ? data.error : "Could not save referral doctor.",
        );
        return;
      }

      setDoctors((prev) =>
        editingId
          ? prev.map((doctor) => (doctor.id === editingId ? data : doctor))
          : [data, ...prev],
      );
      closeModal();
    } catch {
      setFormError("Could not save referral doctor. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteReferral = async (doctor: ReferralDoctor) => {
    if (!window.confirm(`Remove "${doctor.name}" from referrals?`)) return;

    setDeletingId(doctor.id);
    setError("");
    try {
      const response = await fetch(`/api/company/masters/doctors/${doctor.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setError(payload.error ?? "Could not delete referral doctor.");
        return;
      }
      setDoctors((prev) => prev.filter((item) => item.id !== doctor.id));
      if (editingId === doctor.id) closeModal();
    } catch {
      setError("Could not delete referral doctor. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[#dfe4ef] bg-[#f3f5fa] px-4 py-4 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.65)] sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-base font-bold text-zinc-900">Referrals</h1>
            <p className="text-xs text-zinc-700">
              Referring doctors and clinics that send patients to your lab
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
                placeholder="Search referrals..."
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
              Add referral
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

        <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#dfe4ef] bg-white px-4 py-3 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.45)]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Referral doctors
            </p>
            <p className="mt-1 text-2xl font-bold text-zinc-900">
              {isLoading ? "—" : doctors.length}
            </p>
          </div>
          <div className="rounded-2xl border border-[#dfe4ef] bg-white px-4 py-3 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.45)]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Specialties
            </p>
            <p className="mt-1 text-2xl font-bold text-zinc-900">
              {isLoading ? "—" : specialtyCount}
            </p>
          </div>
          <div className="rounded-2xl border border-[#dfe4ef] bg-white px-4 py-3 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.45)]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Showing
            </p>
            <p className="mt-1 text-2xl font-bold text-zinc-900">
              {isLoading ? "—" : filtered.length}
            </p>
          </div>
        </section>

        <div className="overflow-hidden rounded-2xl border border-[#dfe4ef] bg-white shadow-[0_16px_32px_-24px_rgba(15,23,42,0.6)]">
          <div className="border-b border-[#e8ecf5] px-5 py-4">
            <h2 className="text-sm font-bold text-zinc-900">Referral directory</h2>
            <p className="text-xs text-zinc-600">
              {isLoading
                ? "Loading referral doctors…"
                : `${filtered.length} of ${doctors.length} doctors`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8ecf5] bg-[#f3f5fa]/80">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Doctor
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Specialty
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Clinic
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
                      Loading referral doctors…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <p className="text-sm font-medium text-zinc-700">
                        {doctors.length === 0
                          ? "No referral doctors yet"
                          : "No matching referrals"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-600">
                        {doctors.length === 0
                          ? "Click “Add referral” to register a referring doctor."
                          : "Try a different search."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((doctor) => (
                    <tr
                      key={doctor.id}
                      className="transition-colors hover:bg-[#f3f5fa]/60"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-bold text-teal-800">
                            {initialsFromName(doctor.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-zinc-900">{doctor.name}</p>
                            <p className="truncate text-xs text-zinc-500">
                              {doctor.qualification || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-800">
                          {doctor.specialization || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        <p>{doctor.mobile || "—"}</p>
                        <p className="truncate text-xs text-zinc-500">
                          {doctor.email || "—"}
                        </p>
                      </td>
                      <td className="max-w-[220px] px-4 py-3 text-zinc-600">
                        <p className="line-clamp-2">{doctor.clinicAddress || "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(doctor)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100"
                            aria-label={`Edit ${doctor.name}`}
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
                            onClick={() => void deleteReferral(doctor)}
                            disabled={deletingId === doctor.id}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label={`Delete ${doctor.name}`}
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
                  {editingId ? "Edit Referral" : "Add Referral"}
                </h2>
                <p className="mt-1 text-sm font-medium text-zinc-800">
                  {editingId
                    ? "Update this referring doctor’s details"
                    : "Register a doctor or clinic that refers patients"}
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

            <form onSubmit={submitReferral} className="space-y-3 px-6 py-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-sm font-bold text-zinc-950">Doctor name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Dr. Ada Okafor"
                    className={inputClass}
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-950">Specialization</label>
                  <input
                    value={form.specialization}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, specialization: e.target.value }))
                    }
                    placeholder="e.g. Cardiology"
                    className={inputClass}
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-950">Qualification</label>
                  <input
                    value={form.qualification}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, qualification: e.target.value }))
                    }
                    placeholder="e.g. MBBS, FWACS"
                    className={inputClass}
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-950">Mobile</label>
                  <input
                    value={form.mobile}
                    onChange={(e) => setForm((prev) => ({ ...prev, mobile: e.target.value }))}
                    placeholder="0803 000 0000"
                    className={inputClass}
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-950">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="doctor@clinic.com"
                    className={inputClass}
                    disabled={isSaving}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-bold text-zinc-950">Clinic address</label>
                  <input
                    value={form.clinicAddress}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, clinicAddress: e.target.value }))
                    }
                    placeholder="Clinic or hospital address"
                    className={inputClass}
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
                  {isSaving ? "Saving…" : editingId ? "Save changes" : "Add referral"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
