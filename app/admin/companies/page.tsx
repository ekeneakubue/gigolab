"use client";

import { FormEvent, useMemo, useState } from "react";

// ─── Data ─────────────────────────────────────────────────────────────────────

type CompanyRow = {
  id: number;
  name: string;
  initials: string;
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

const initialCompanies: CompanyRow[] = [
  {
    id: 1,
    name: "Cairo Diagnostics Lab",
    initials: "CD",
    location: "Cairo, Egypt",
    plan: "Pinnacle",
    users: 42,
    samples: 12_480,
    status: "Active",
    joined: "Jan 12, 2026",
    contact: "dr.hassan@cairodx.com",
    phone: "+20 10 1234 5678",
    lastActive: "2h ago",
  },
  {
    id: 2,
    name: "NileHealth Analytics",
    initials: "NH",
    location: "Giza, Egypt",
    plan: "Summit",
    users: 28,
    samples: 8_920,
    status: "Active",
    joined: "Feb 3, 2026",
    contact: "info@nileh.com",
    phone: "+20 11 9876 5432",
    lastActive: "18m ago",
  },
  {
    id: 3,
    name: "AlexMed Center",
    initials: "AM",
    location: "Alexandria, Egypt",
    plan: "Ascent",
    users: 15,
    samples: 4_200,
    status: "Active",
    joined: "Feb 18, 2026",
    contact: "s.khalil@alexmed.eg",
    phone: "+20 3 456 7890",
    lastActive: "1h ago",
  },
  {
    id: 4,
    name: "Giza BioLab",
    initials: "GB",
    location: "Giza, Egypt",
    plan: "Base",
    users: 8,
    samples: 640,
    status: "Trial",
    joined: "Mar 2, 2026",
    contact: "y.abdelaziz@gizabio.com",
    phone: "+20 10 5555 1234",
    lastActive: "3h ago",
  },
  {
    id: 5,
    name: "Delta Clinical Services",
    initials: "DC",
    location: "Mansoura, Egypt",
    plan: "Summit",
    users: 33,
    samples: 9_870,
    status: "Active",
    joined: "Dec 5, 2025",
    contact: "n.mahmoud@delta-cs.com",
    phone: "+20 50 123 4567",
    lastActive: "5h ago",
  },
  {
    id: 6,
    name: "Suez Medical Labs",
    initials: "SM",
    location: "Suez, Egypt",
    plan: "Ascent",
    users: 19,
    samples: 3_100,
    status: "Inactive",
    joined: "Nov 14, 2025",
    contact: "admin@suezmed.com",
    phone: "+20 62 345 6789",
    lastActive: "14d ago",
  },
  {
    id: 7,
    name: "Luxor Lab & Diagnostics",
    initials: "LL",
    location: "Luxor, Egypt",
    plan: "Base",
    users: 6,
    samples: 1_230,
    status: "Trial",
    joined: "Mar 10, 2026",
    contact: "luxorlab@mail.com",
    phone: "+20 95 678 9012",
    lastActive: "6h ago",
  },
  {
    id: 8,
    name: "Aswan Pathology Center",
    initials: "AP",
    location: "Aswan, Egypt",
    plan: "Ascent",
    users: 22,
    samples: 5_540,
    status: "Active",
    joined: "Oct 20, 2025",
    contact: "contact@aswanpath.com",
    phone: "+20 97 234 5678",
    lastActive: "30m ago",
  },
];

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
  logo: string;
  name: string;
  location: string;
  status: "Active" | "Trial" | "Inactive";
  contact: string;
  phone: string;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyRow[]>(initialCompanies);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [editError, setEditError] = useState("");
  const [form, setForm] = useState<NewCompanyForm>({
    logo: "",
    name: "",
    location: "",
    status: "Active",
    contact: "",
    phone: "",
  });
  const [editForm, setEditForm] = useState<NewCompanyForm>({
    logo: "",
    name: "",
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

  const submitNewCompany = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.location.trim() || !form.contact.trim()) {
      setError("Name, location, and contact email are required.");
      return;
    }

    const joined = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const initials = form.name
      .trim()
      .split(/\s+/)
      .map((n) => n[0]?.toUpperCase() ?? "")
      .slice(0, 2)
      .join("");

    const newCompany: CompanyRow = {
      id: Date.now(),
      name: form.name.trim(),
      initials: initials || "NC",
      location: form.location.trim(),
      plan: "Base",
      users: 1,
      samples: 0,
      status: form.status,
      joined,
      contact: form.contact.trim(),
      phone: form.phone.trim() || "N/A",
      lastActive: "just now",
    };

    setCompanies((prev) => [newCompany, ...prev]);
    setForm({
      logo: "",
      name: "",
      location: "",
      status: "Active",
      contact: "",
      phone: "",
    });
    setIsModalOpen(false);
  };

  const openEditModal = (company: CompanyRow) => {
    setEditingCompanyId(company.id);
    setEditError("");
    setEditForm({
      logo: "",
      name: company.name,
      location: company.location,
      status: company.status,
      contact: company.contact,
      phone: company.phone === "N/A" ? "" : company.phone,
    });
    setIsEditModalOpen(true);
  };

  const submitEditCompany = (e: FormEvent) => {
    e.preventDefault();
    setEditError("");
    if (!editingCompanyId) return;
    if (!editForm.name.trim() || !editForm.location.trim() || !editForm.contact.trim()) {
      setEditError("Lab Name, location, and contact email are required.");
      return;
    }

    const initials = editForm.name
      .trim()
      .split(/\s+/)
      .map((n) => n[0]?.toUpperCase() ?? "")
      .slice(0, 2)
      .join("");

    setCompanies((prev) =>
      prev.map((c) =>
        c.id === editingCompanyId
          ? {
              ...c,
              name: editForm.name.trim(),
              initials: initials || c.initials,
              location: editForm.location.trim(),
              status: editForm.status,
              contact: editForm.contact.trim(),
              phone: editForm.phone.trim() || "N/A",
              lastActive: "just now",
            }
          : c
      )
    );
    setIsEditModalOpen(false);
    setEditingCompanyId(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Top bar ── */}
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
              placeholder="Search companies…"
              className="h-8 w-56 rounded-lg border border-emerald-100 bg-emerald-50/50 pl-9 pr-3 text-sm text-zinc-700 placeholder:text-zinc-400 outline-none focus:border-emerald-300 focus:bg-white transition-colors"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
            Add company
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

        {/* ── Overview chips ── */}
        <div className="flex flex-wrap gap-3">
          {overviewStats.map((s) => (
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

        {/* ── Grid of company cards ── */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {companies.map((c, i) => {
            const status = statusMeta[c.status];
            const avatar = avatarColors[i % avatarColors.length];
            return (
              <article
                key={c.id}
                className="group relative flex flex-col rounded-2xl border border-emerald-100 bg-white p-5 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
              >
                {/* Top accent bar */}
                <div className="absolute top-0 inset-x-0 h-0.5 bg-linear-to-r from-emerald-400 via-teal-400 to-emerald-300" />

                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-sm font-bold shadow-md ${avatar}`}>
                      {c.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-zinc-900 leading-tight truncate">{c.name}</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                          <circle cx="12" cy="9" r="2.5" />
                        </svg>
                        {c.location}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold shrink-0 ${status.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                    {c.status}
                  </span>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="rounded-xl bg-emerald-50/70 px-3 py-2">
                    <p className="text-base font-bold text-zinc-900 tabular-nums">{c.users}</p>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Users</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50/70 px-3 py-2">
                    <p className="text-base font-bold text-zinc-900 tabular-nums">{c.samples.toLocaleString()}</p>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Samples</p>
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex items-center justify-end mb-4">
                  <span className="text-[11px] text-zinc-400">Joined {c.joined}</span>
                </div>

                {/* Contact */}
                <div className="space-y-1.5 mb-4 border-t border-emerald-50 pt-3">
                  <p className="flex items-center gap-2 text-[12px] text-zinc-500 truncate">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 shrink-0 text-emerald-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="m22 6-10 7L2 6" />
                    </svg>
                    {c.contact}
                  </p>
                  <p className="flex items-center gap-2 text-[12px] text-zinc-500">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 shrink-0 text-emerald-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.16 6.16l.96-.96a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    {c.phone}
                  </p>
                </div>

                {/* Footer */}
                <div className="mt-auto flex items-center justify-between pt-1">
                  <span className="text-[11px] text-zinc-400">
                    Active {c.lastActive}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(c)}
                      className="rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      Manage
                    </button>
                    <button className="rounded-lg border border-zinc-100 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-500 hover:bg-zinc-100 transition-colors">
                      ···
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          {/* Add company card */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-emerald-200 bg-white/60 p-8 text-center hover:border-emerald-400 hover:bg-emerald-50/50 transition-all duration-200 min-h-[280px]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
                <path strokeLinecap="round" d="M12 5v14M5 12h14" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-emerald-700">Add company</p>
              <p className="text-xs text-zinc-400 mt-0.5">Register a new lab</p>
            </div>
          </button>
        </div>

      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-emerald-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-50">
              <h2 className="text-sm font-bold text-zinc-900">Add New Company</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-zinc-200 px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50"
              >
                Close
              </button>
            </div>

            <form onSubmit={submitNewCompany} className="p-5 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-zinc-700">Upload logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, logo: e.target.files?.[0]?.name ?? "" }))
                    }
                    className="mt-1 block w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Lab Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-xl border border-emerald-100 px-3 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Location</label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-xl border border-emerald-100 px-3 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as NewCompanyForm["status"] }))}
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
                    value={form.contact}
                    onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-xl border border-emerald-100 px-3 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-xl border border-emerald-100 px-3 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              {error ? <p className="text-xs text-red-600">{error}</p> : null}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                  Add company
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
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, logo: e.target.files?.[0]?.name ?? "" }))
                    }
                    className="mt-1 block w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
                  />
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
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
