"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { CompanyFormFields } from "@/app/components/CompanyFormFields";
import { generateCompanyCode } from "@/lib/company-code";

// â”€â”€â”€ Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type CompanyRow = {
  id: string | number;
  code: string;
  name: string;
  initials: string;
  logoUrl: string | null;
  location: string;
  plan: string;
  users: number;
  samples: number;
  status: "Active" | "Trial" | "Inactive";
  joined: string;
  contact: string;
  phone: string;
  lastActive: string;
};

const statusMeta: Record<string, { badge: string; dot: string }> = {
  Active:   { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  Trial:    { badge: "bg-amber-100 text-amber-700",     dot: "bg-amber-500"   },
  Inactive: { badge: "bg-zinc-100 text-zinc-500",       dot: "bg-zinc-400"    },
};

const avatarColors = [
  "bg-emerald-600", "bg-teal-600", "bg-blue-600",
  "bg-violet-600",  "bg-sky-600",  "bg-cyan-600",
  "bg-indigo-600",  "bg-green-700",
];

type NewCompanyForm = {
  logo: string | null;
  name: string;
  labCode: string;
  password: string;
  location: string;
  status: "Active" | "Trial" | "Inactive";
  contact: string;
  phone: string;
};

function emptyNewCompanyForm(): NewCompanyForm {
  return {
    logo: null,
    name: "",
    labCode: generateCompanyCode(),
    password: "",
    location: "",
    status: "Active",
    contact: "",
    phone: "",
  };
}

type ApiCompany = {
  id: string;
  code: string;
  name: string;
  initials: string;
  location: string;
  plan: string;
  status: "Active" | "Trial" | "Inactive";
  contactEmail: string;
  phone: string | null;
  joinedAt: string;
  lastActiveAt: string | null;
  userCount: number;
  sampleCount: number;
  logoUrl: string | null;
};

function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read selected image."));
    };
    reader.onerror = () => reject(new Error("Could not read selected image."));
    reader.readAsDataURL(file);
  });
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function isApiCompany(payload: ApiCompany | { error?: string }): payload is ApiCompany {
  return "id" in payload && typeof payload.id === "string";
}

function mapApiCompanyToRow(company: ApiCompany): CompanyRow {
  return {
    id: company.id,
    code: company.code,
    name: company.name,
    initials: company.initials,
    logoUrl: company.logoUrl,
    location: company.location,
    plan: company.plan,
    users: company.userCount,
    samples: company.sampleCount,
    status: company.status,
    joined: dateFormatter.format(new Date(company.joinedAt)),
    contact: company.contactEmail,
    phone: company.phone ?? "N/A",
    lastActive: company.lastActiveAt
      ? dateFormatter.format(new Date(company.lastActiveAt))
      : "just now",
  };
}

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const SKELETON_ROW_COUNT = 6;

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | number | null>(null);
  const [error, setError] = useState("");
  const [isAddingCompany, setIsAddingCompany] = useState(false);
  const [editError, setEditError] = useState("");
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [deletingCompanyId, setDeletingCompanyId] = useState<string | number | null>(null);
  const [form, setForm] = useState<NewCompanyForm>(emptyNewCompanyForm);
  const [editForm, setEditForm] = useState<NewCompanyForm>({
    logo: null,
    name: "",
    labCode: "",
    password: "",
    location: "",
    status: "Active",
    contact: "",
    phone: "",
  });

  const overviewStats = useMemo(
    () => [
      { label: "Total", value: companies.length, color: "text-zinc-900", bg: "bg-zinc-100" },
      {
        label: "Active",
        value: companies.filter((c) => c.status === "Active").length,
        color: "text-emerald-700",
        bg: "bg-emerald-100",
      },
      {
        label: "Trial",
        value: companies.filter((c) => c.status === "Trial").length,
        color: "text-amber-700",
        bg: "bg-amber-100",
      },
      {
        label: "Inactive",
        value: companies.filter((c) => c.status === "Inactive").length,
        color: "text-zinc-500",
        bg: "bg-zinc-100",
      },
    ],
    [companies]
  );

  const filteredCompanies = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) =>
      [c.name, c.code, c.location, c.contact, c.phone, c.status, c.plan]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [companies, search]);

  useEffect(() => {
    async function loadCompanies() {
      setIsLoadingCompanies(true);
      try {
        const response = await fetch("/api/companies");
        if (!response.ok) {
          setCompanies([]);
          return;
        }
        const data = (await response.json()) as ApiCompany[];
        setCompanies(data.map(mapApiCompanyToRow));
      } catch {
        setCompanies([]);
      } finally {
        setIsLoadingCompanies(false);
      }
    }

    loadCompanies();
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;
    setForm((f) => ({ ...f, labCode: generateCompanyCode() }));
  }, [isModalOpen]);

  const openAddCompanyModal = () => {
    setError("");
    setIsAddingCompany(false);
    setForm(emptyNewCompanyForm());
    setIsModalOpen(true);
  };

  const submitNewCompany = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.location.trim() || !form.contact.trim()) {
      setError("Lab name, location, and contact email are required.");
      return;
    }

    if (!form.password.trim()) {
      setError("Password is required.");
      return;
    }

    setIsAddingCompany(true);
    try {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          code: form.labCode,
          password: form.password,
          location: form.location,
          status: form.status,
          contact: form.contact,
          phone: form.phone,
          logoUrl: form.logo,
        }),
      });

      const payload = (await response.json()) as ApiCompany | { error?: string };
      if (!response.ok || !isApiCompany(payload)) {
        setError("error" in payload && payload.error ? payload.error : "Could not save company.");
        return;
      }

      setCompanies((prev) => [mapApiCompanyToRow(payload), ...prev]);
      setForm(emptyNewCompanyForm());
      setIsModalOpen(false);
    } catch {
      setError("Could not save company. Please try again.");
    } finally {
      setIsAddingCompany(false);
    }
  };

  const openEditModal = (company: CompanyRow) => {
    setEditingCompanyId(company.id);
    setEditError("");
    setIsSavingCompany(false);
    setEditForm({
      logo: company.logoUrl,
      name: company.name,
      labCode: company.code,
      password: "",
      location: company.location,
      status: company.status,
      contact: company.contact,
      phone: company.phone === "N/A" ? "" : company.phone,
    });
    setIsEditModalOpen(true);
  };

  const submitEditCompany = async (e: FormEvent) => {
    e.preventDefault();
    setEditError("");
    if (!editingCompanyId) return;
    if (!editForm.name.trim() || !editForm.location.trim() || !editForm.contact.trim()) {
      setEditError("Lab name, location, and contact email are required.");
      return;
    }

    setIsSavingCompany(true);
    try {
      const response = await fetch(`/api/companies/${editingCompanyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          password: editForm.password,
          location: editForm.location,
          status: editForm.status,
          contact: editForm.contact,
          phone: editForm.phone,
          logoUrl: editForm.logo,
        }),
      });

      const payload = (await response.json()) as ApiCompany | { error?: string };
      if (!response.ok || !isApiCompany(payload)) {
        setEditError("error" in payload && payload.error ? payload.error : "Could not save company.");
        return;
      }

      setCompanies((prev) =>
        prev.map((c) => (c.id === editingCompanyId ? mapApiCompanyToRow(payload) : c))
      );
      setIsEditModalOpen(false);
      setEditingCompanyId(null);
    } catch {
      setEditError("Could not save company. Please try again.");
    } finally {
      setIsSavingCompany(false);
    }
  };

  const deleteCompany = async (company: CompanyRow) => {
    const confirmed = window.confirm(
      `Delete "${company.name}"? Linked users will be unassigned from this lab. This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingCompanyId(company.id);
    try {
      const response = await fetch(`/api/companies/${company.id}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        window.alert(payload.error ?? "Could not delete company.");
        return;
      }

      setCompanies((prev) => prev.filter((c) => c.id !== company.id));
      if (editingCompanyId === company.id) {
        setIsEditModalOpen(false);
        setEditingCompanyId(null);
      }
    } catch {
      window.alert("Could not delete company. Please try again.");
    } finally {
      setDeletingCompanyId(null);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* â”€â”€ Top bar â”€â”€ */}
      <header className="shrink-0 flex items-center justify-between gap-4 bg-white border-b border-emerald-100 px-6 py-3.5 shadow-sm">
        <div>
          <h1 className="text-base font-bold text-zinc-900">Companies</h1>
          <p className="text-xs text-zinc-400">Manage all registered labs and organisations</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companiesâ€¦"
              className="h-8 w-56 rounded-lg border border-emerald-100 bg-emerald-50/50 pl-9 pr-3 text-sm text-zinc-700 placeholder:text-zinc-400 outline-none focus:border-emerald-300 focus:bg-white transition-colors"
            />
          </div>
          <button
            onClick={openAddCompanyModal}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
            Add company
          </button>
        </div>
      </header>

      {/* â”€â”€ Body â”€â”€ */}
      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

        {/* â”€â”€ Overview chips â”€â”€ */}
        <div className="flex flex-wrap gap-3">
          {isLoadingCompanies
            ? overviewStats.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-white px-4 py-2.5 shadow-sm"
                >
                  <span className="h-8 w-8 rounded-lg bg-emerald-100 animate-pulse" />
                  <span className="h-3 w-20 rounded bg-zinc-100 animate-pulse" />
                </div>
              ))
            : overviewStats.map((s) => (
                <div
                  key={s.label}
                  className={`flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-white px-4 py-2.5 shadow-sm`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${s.bg} ${s.color}`}>
                    {s.value}
                  </span>
                  <span className="text-xs font-medium text-zinc-500">{s.label} companies</span>
                </div>
              ))}
        </div>

        {/* â”€â”€ Companies table â”€â”€ */}
        <div className="rounded-2xl border border-emerald-100 bg-white shadow-md overflow-hidden">
          <div className="px-5 py-4 border-b border-emerald-50">
            <h2 className="text-sm font-bold text-zinc-900">All companies</h2>
            <p className="text-xs text-zinc-400">
              {isLoadingCompanies
                ? "Loading companiesâ€¦"
                : `${filteredCompanies.length} of ${companies.length} registered labs`}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-emerald-50 bg-emerald-50/30">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Company</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Lab code</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Users</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Samples</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Joined</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Last active</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50/80">
                {isLoadingCompanies ? (
                  Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => (
                    <tr key={`skeleton-${i}`} className="animate-pulse">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <span className="h-8 w-8 shrink-0 rounded-xl bg-emerald-100" />
                          <div className="min-w-0 space-y-1.5 flex-1">
                            <span className="block h-3.5 w-32 rounded bg-zinc-100" />
                            <span className="block h-2.5 w-16 rounded bg-zinc-100" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="block h-5 w-24 rounded bg-emerald-50" /></td>
                      <td className="px-4 py-3"><span className="block h-3 w-20 rounded bg-zinc-100" /></td>
                      <td className="px-4 py-3"><span className="block h-5 w-14 rounded-full bg-zinc-100" /></td>
                      <td className="px-4 py-3"><span className="block h-3 w-6 rounded bg-zinc-100" /></td>
                      <td className="px-4 py-3"><span className="block h-3 w-10 rounded bg-zinc-100" /></td>
                      <td className="px-4 py-3 min-w-[160px]">
                        <span className="block h-3 w-28 rounded bg-zinc-100" />
                        <span className="block h-2.5 w-20 rounded bg-zinc-100 mt-1.5" />
                      </td>
                      <td className="px-4 py-3"><span className="block h-3 w-16 rounded bg-zinc-100" /></td>
                      <td className="px-4 py-3"><span className="block h-3 w-16 rounded bg-zinc-100" /></td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-block h-6 w-16 rounded-lg bg-emerald-50" />
                      </td>
                    </tr>
                  ))
                ) : filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center">
                      <p className="text-sm font-medium text-zinc-600">No companies found</p>
                      <p className="text-xs text-zinc-400 mt-1">
                        {companies.length === 0 ? "Add your first lab to get started." : "Try a different search term."}
                      </p>
                      {companies.length === 0 ? (
                        <button type="button" onClick={openAddCompanyModal} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors">
                          Add company
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((c, i) => {
                    const status = statusMeta[c.status];
                    const avatar = avatarColors[i % avatarColors.length];
                    return (
                      <tr key={c.id} className="hover:bg-emerald-50/40 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3 min-w-[200px]">
                    {c.logoUrl ? (
                      <img
                        src={c.logoUrl}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-xl object-cover ring-1 ring-emerald-100"
                      />
                    ) : (
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white text-[11px] font-bold ${avatar}`}>
                        {c.initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-zinc-800 truncate">{c.name}</p>
                      <p className="text-[11px] text-zinc-400 truncate">{c.plan}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <code className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">{c.code}</code>
                </td>
                <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">{c.location}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${status.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-700 tabular-nums">{c.users}</td>
                <td className="px-4 py-3 text-zinc-700 tabular-nums">{c.samples.toLocaleString()}</td>
                <td className="px-4 py-3 min-w-[160px]">
                  <p className="text-zinc-600 truncate">{c.contact}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{c.phone}</p>
                </td>
                <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">{c.joined}</td>
                <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">{c.lastActive}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(c)}
                      aria-label={`Edit ${c.name}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCompany(c)}
                      disabled={deletingCompanyId === c.id}
                      aria-label={`Delete ${c.name}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingCompanyId === c.id ? (
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden>
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-5xl rounded-2xl border border-emerald-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-emerald-50">
              <div>
                <h2 className="text-lg font-bold text-zinc-950">Add New Company</h2>
                <p className="text-sm font-medium text-zinc-800 mt-1">Register a new lab on Gigolab</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                Close
              </button>
            </div>

            <form onSubmit={submitNewCompany} className="px-6 py-4 space-y-3">
              <CompanyFormFields
                form={form}
                onChange={(updater) => setForm(updater)}
                onImageError={setError}
                infoLine="Lab code is auto-generated (Gigolab + 6 characters). Set an initial password for company portal sign-in."
                showPasswordToggle
              />

              {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isAddingCompany}
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-base font-bold text-zinc-900 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingCompany}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-100 px-4 py-2.5 text-base font-bold text-emerald-900 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-70 min-w-36"
                >
                  {isAddingCompany ? (
                    <>
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
                      Adding...
                    </>
                  ) : (
                    "Add company"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-emerald-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-50">
              <h2 className="text-sm font-bold text-zinc-900">Edit Company</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-lg border border-zinc-200 px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50"
              >
                Close
              </button>
            </div>

            <form onSubmit={submitEditCompany} className="p-5 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-zinc-700">Upload logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) {
                        setEditForm((f) => ({ ...f, logo: null }));
                        return;
                      }
                      try {
                        const dataUrl = await readImageFile(file);
                        setEditForm((f) => ({ ...f, logo: dataUrl }));
                      } catch {
                        setEditError("Could not read selected image.");
                      }
                    }}
                    className="mt-1 block w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                  {editForm.logo ? (
                    <img
                      src={editForm.logo}
                      alt=""
                      className="mt-2 h-12 w-12 rounded-xl object-cover ring-1 ring-emerald-100"
                    />
                  ) : null}
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Lab Name</label>
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-xl border border-emerald-100 px-3 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Lab Code</label>
                  <input
                    readOnly
                    value={editForm.labCode}
                    className="mt-1 h-10 w-full rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 text-sm font-mono text-zinc-700 outline-none"
                    aria-describedby="edit-lab-code-hint"
                  />
                  <p id="edit-lab-code-hint" className="mt-1 text-[11px] text-zinc-400">
                    Lab code cannot be changed
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Password</label>
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                    autoComplete="new-password"
                    placeholder="Leave blank to keep current password"
                    className="mt-1 h-10 w-full rounded-xl border border-emerald-100 px-3 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 placeholder:text-zinc-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Location</label>
                  <input
                    value={editForm.location}
                    onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-xl border border-emerald-100 px-3 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as NewCompanyForm["status"] }))}
                    className="mt-1 h-10 w-full rounded-xl border border-emerald-100 px-3 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="Active">Active</option>
                    <option value="Trial">Trial</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Contact email</label>
                  <input
                    type="email"
                    value={editForm.contact}
                    onChange={(e) => setEditForm((f) => ({ ...f, contact: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-xl border border-emerald-100 px-3 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Phone</label>
                  <input
                    value={editForm.phone}
                    onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-xl border border-emerald-100 px-3 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              {editError ? <p className="text-xs text-red-600">{editError}</p> : null}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSavingCompany}
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCompany}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70 min-w-[8.5rem]"
                >
                  {isSavingCompany ? (
                    <>
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
                      Savingâ€¦
                    </>
                  ) : (
                    "Save changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
