"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { generatePatientCode, patientCodeFormatHint } from "@/lib/patient-code";

const inputClass =
  "mt-1.5 h-10 w-full rounded-xl border border-emerald-200 px-3 text-base font-medium text-zinc-900 placeholder:text-zinc-600 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

type Patient = {
  id: string;
  patientCode: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string | null;
  address: string;
  hasInsurance: boolean;
  insuranceProvider: string;
  insuranceNumber: string;
  insurancePlan: string;
  status: "Active" | "Trial" | "Inactive";
  createdAt: string;
};

type PatientForm = {
  patientCode: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  hasInsurance: boolean;
  insuranceProvider: string;
  insuranceNumber: string;
  insurancePlan: string;
  status: "Active" | "Trial" | "Inactive";
};

type PatientsResponse = {
  companyName: string;
  patients: Patient[];
};

type InsuranceTypeOption = {
  id: string;
  name: string;
  code: string;
  status: "Active" | "Trial" | "Inactive";
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

const emptyForm = (patientCode = ""): PatientForm => ({
  patientCode,
  name: "",
  email: "",
  phone: "",
  gender: "",
  dateOfBirth: "",
  address: "",
  hasInsurance: false,
  insuranceProvider: "",
  insuranceNumber: "",
  insurancePlan: "",
  status: "Active",
});

function isPatient(payload: Patient | { error?: string }): payload is Patient {
  return "id" in payload && typeof payload.id === "string";
}

function toDateInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export default function CompanyPatientsPanel() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [insuranceTypes, setInsuranceTypes] = useState<InsuranceTypeOption[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<PatientForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [deletingPatientId, setDeletingPatientId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPatients() {
      setIsLoading(true);
      setError("");
      try {
        const [patientsRes, insuranceRes] = await Promise.all([
          fetch("/api/company/patients", { cache: "no-store" }),
          fetch("/api/company/insurance/types", { cache: "no-store" }),
        ]);
        const data = (await patientsRes.json()) as PatientsResponse | { error?: string };
        const insuranceData = (await insuranceRes.json()) as
          | InsuranceTypeOption[]
          | { error?: string };
        if (cancelled) return;
        if (!patientsRes.ok || !("patients" in data) || !Array.isArray(data.patients)) {
          setPatients([]);
          setError(
            "error" in data && data.error ? data.error : "Could not load patients.",
          );
        } else {
          setCompanyName(data.companyName ?? "");
          setPatients(data.patients);
        }
        setInsuranceTypes(Array.isArray(insuranceData) ? insuranceData : []);
      } catch {
        if (!cancelled) {
          setPatients([]);
          setInsuranceTypes([]);
          setError("Could not load patients. Please try again.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadPatients();
    return () => {
      cancelled = true;
    };
  }, []);

  const providerOptions = useMemo(() => {
    const active = insuranceTypes.filter((item) => item.status === "Active");
    const selected = form.insuranceProvider.trim();
    if (
      selected &&
      !active.some((item) => item.name === selected) &&
      insuranceTypes.some((item) => item.name === selected)
    ) {
      const extra = insuranceTypes.find((item) => item.name === selected);
      return extra ? [...active, extra] : active;
    }
    if (selected && !insuranceTypes.some((item) => item.name === selected)) {
      return [
        ...active,
        {
          id: `legacy-${selected}`,
          name: selected,
          code: "",
          status: "Inactive" as const,
        },
      ];
    }
    return active;
  }, [insuranceTypes, form.insuranceProvider]);

  const codeHint = useMemo(
    () => (companyName ? patientCodeFormatHint(companyName) : "XXX-XXXXXX"),
    [companyName],
  );

  const filteredPatients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((patient) =>
      [
        patient.patientCode,
        patient.name,
        patient.email,
        patient.phone,
        patient.gender,
        patient.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [patients, search]);

  const openAddPatientModal = () => {
    setFormError("");
    setIsSaving(false);
    setEditingPatientId(null);
    setForm(emptyForm(companyName ? generatePatientCode(companyName) : ""));
    setIsModalOpen(true);
  };

  const openEditPatientModal = (patient: Patient) => {
    setFormError("");
    setIsSaving(false);
    setEditingPatientId(patient.id);
    setForm({
      patientCode: patient.patientCode,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      gender: patient.gender,
      dateOfBirth: toDateInputValue(patient.dateOfBirth),
      address: patient.address,
      hasInsurance: Boolean(patient.hasInsurance),
      insuranceProvider: patient.insuranceProvider ?? "",
      insuranceNumber: patient.insuranceNumber ?? "",
      insurancePlan: patient.insurancePlan ?? "",
      status: patient.status,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPatientId(null);
    setForm(emptyForm());
    setFormError("");
  };

  const deletePatient = async (patient: Patient) => {
    if (!window.confirm(`Delete "${patient.name}"? This cannot be undone.`)) return;

    setDeletingPatientId(patient.id);
    setError("");
    try {
      const response = await fetch(`/api/company/patients/${patient.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setError(payload.error ?? "Could not delete patient.");
        return;
      }
      setPatients((prev) => prev.filter((item) => item.id !== patient.id));
      if (editingPatientId === patient.id) closeModal();
    } catch {
      setError("Could not delete patient. Please try again.");
    } finally {
      setDeletingPatientId(null);
    }
  };

  const submitPatient = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Patient name is required.");
      return;
    }
    if (form.hasInsurance && !form.insuranceProvider.trim()) {
      setFormError("Insurance provider is required.");
      return;
    }
    if (form.hasInsurance && !form.insuranceNumber.trim()) {
      setFormError("Insurance / membership number is required.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        editingPatientId
          ? `/api/company/patients/${editingPatientId}`
          : "/api/company/patients",
        {
          method: editingPatientId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(editingPatientId
              ? {}
              : { patientCode: form.patientCode.trim().toUpperCase() }),
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            gender: form.gender.trim(),
            dateOfBirth: form.dateOfBirth || null,
            address: form.address.trim(),
            hasInsurance: form.hasInsurance,
            insuranceProvider: form.hasInsurance ? form.insuranceProvider.trim() : "",
            insuranceNumber: form.hasInsurance ? form.insuranceNumber.trim() : "",
            insurancePlan: form.hasInsurance ? form.insurancePlan.trim() : "",
            status: form.status,
          }),
        },
      );
      const payload = (await response.json()) as Patient | { error?: string };
      if (!response.ok || !isPatient(payload)) {
        setFormError(
          "error" in payload && payload.error ? payload.error : "Could not save patient.",
        );
        return;
      }

      setPatients((prev) =>
        editingPatientId
          ? prev.map((patient) => (patient.id === editingPatientId ? payload : patient))
          : [payload, ...prev],
      );
      closeModal();
    } catch {
      setFormError("Could not save patient. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[#dfe4ef] bg-[#f3f5fa] px-4 py-4 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.65)] sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-base font-bold text-zinc-900">Patients</h1>
            <p className="text-xs text-zinc-700">Patient records for your lab</p>
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
                placeholder="Search patients..."
                className="h-9 w-full rounded-lg border border-[#d7ddea] bg-white/80 pl-9 pr-3 text-sm text-zinc-800 placeholder:text-zinc-500 outline-none focus:border-[#bcc6da] focus:bg-white"
              />
            </div>
            <button
              type="button"
              onClick={openAddPatientModal}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path strokeLinecap="round" d="M12 5v14M5 12h14" />
              </svg>
              Add patient
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
            <h2 className="text-sm font-bold text-zinc-900">All patients</h2>
            <p className="text-xs text-zinc-600">
              {isLoading
                ? "Loading patients…"
                : `${filteredPatients.length} of ${patients.length} patients`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8ecf5] bg-[#f3f5fa]/80">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Patient
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Gender
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Added
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8ecf5]/80">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm text-zinc-600">
                      Loading patients…
                    </td>
                  </tr>
                ) : filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <p className="text-sm font-medium text-zinc-700">No patients found</p>
                      <p className="mt-1 text-xs text-zinc-600">
                        {patients.length === 0
                          ? "Click “Add patient” to create one."
                          : "Try a different search term."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient) => {
                    const status = statusMeta[patient.status] ?? statusMeta.Active;
                    return (
                      <tr key={patient.id} className="transition-colors hover:bg-[#f3f5fa]/60">
                        <td className="px-5 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-zinc-800">
                              {patient.name}
                            </p>
                            <p className="truncate text-xs text-zinc-500">
                              {patient.email || "No email"}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[12px] text-zinc-600">
                          {patient.patientCode}
                        </td>
                        <td className="px-4 py-3 text-zinc-600">{patient.phone || "—"}</td>
                        <td className="px-4 py-3 text-zinc-600">{patient.gender || "—"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.badge}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                            {patient.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-zinc-600">
                          {dateFormatter.format(new Date(patient.createdAt))}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditPatientModal(patient)}
                              aria-label={`Edit ${patient.name}`}
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
                              onClick={() => deletePatient(patient)}
                              disabled={deletingPatientId === patient.id}
                              aria-label={`Delete ${patient.name}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingPatientId === patient.id ? (
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
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-emerald-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-50 px-6 py-3.5">
              <div>
                <h2 className="text-lg font-bold text-zinc-950">
                  {editingPatientId ? "Edit Patient" : "Add New Patient"}
                </h2>
                <p className="mt-1 text-sm font-medium text-zinc-800">
                  {editingPatientId
                    ? "Update this patient’s details"
                    : "Register a patient for your lab"}
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

            <form onSubmit={submitPatient} className="space-y-3 px-6 py-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-sm font-bold text-zinc-950">Full name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Patient full name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-950">Patient code</label>
                  <input
                    readOnly
                    value={form.patientCode}
                    tabIndex={-1}
                    className={`${inputClass} cursor-default bg-emerald-50/60 font-mono text-sm uppercase text-zinc-700`}
                  />
                  <p className="mt-1 text-xs font-medium text-zinc-600">
                    Auto-generated · {codeHint}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-950">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="Mobile number"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-950">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="patient@email.com"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-950">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-950">Date of birth</label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-950">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        status: e.target.value as PatientForm["status"],
                      }))
                    }
                    className={inputClass}
                  >
                    <option>Active</option>
                    <option>Trial</option>
                    <option>Inactive</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-bold text-zinc-950">Address</label>
                  <textarea
                    value={form.address}
                    onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                    rows={3}
                    placeholder="Home or contact address"
                    className="mt-1.5 w-full rounded-xl border border-emerald-200 px-3 py-2.5 text-base font-medium text-zinc-900 placeholder:text-zinc-600 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-zinc-950">Insurance</p>
                    <p className="mt-0.5 text-xs text-zinc-600">
                      Optional coverage details for billing and claims
                    </p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-zinc-800">
                    <input
                      type="checkbox"
                      checked={form.hasInsurance}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          hasInsurance: e.target.checked,
                          ...(e.target.checked
                            ? {}
                            : {
                                insuranceProvider: "",
                                insuranceNumber: "",
                                insurancePlan: "",
                              }),
                        }))
                      }
                      className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-200"
                    />
                    Has insurance
                  </label>
                </div>

                {form.hasInsurance ? (
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="text-sm font-bold text-zinc-950">
                        Provider <span className="text-rose-600">*</span>
                      </label>
                      <select
                        value={form.insuranceProvider}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            insuranceProvider: e.target.value,
                          }))
                        }
                        className={inputClass}
                      >
                        <option value="">
                          {providerOptions.length === 0
                            ? "No insurance types configured"
                            : "Select insurance type"}
                        </option>
                        {providerOptions.map((item) => (
                          <option key={item.id} value={item.name}>
                            {item.code ? `${item.name} (${item.code})` : item.name}
                          </option>
                        ))}
                      </select>
                      {insuranceTypes.filter((item) => item.status === "Active").length ===
                      0 ? (
                        <p className="mt-1 text-xs font-medium text-amber-700">
                          Add types under Insurance → Insurance Type first.
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <label className="text-sm font-bold text-zinc-950">
                        Membership / policy no. <span className="text-rose-600">*</span>
                      </label>
                      <input
                        value={form.insuranceNumber}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            insuranceNumber: e.target.value,
                          }))
                        }
                        placeholder="Policy or enrollee number"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-zinc-950">Plan</label>
                      <input
                        value={form.insurancePlan}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, insurancePlan: e.target.value }))
                        }
                        placeholder="e.g. Gold, Standard"
                        className={inputClass}
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              {formError ? <p className="text-sm font-semibold text-red-700">{formError}</p> : null}

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
                  {isSaving ? "Saving…" : editingPatientId ? "Save changes" : "Add patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
