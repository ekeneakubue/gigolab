"use client";

import { useEffect, useMemo, useState } from "react";

type DemoStatus = "Pending" | "Contacted" | "Approved" | "Rejected";

type DemoApplication = {
  id: string;
  labName: string;
  location: string;
  contactEmail: string;
  phone: string;
  logoUrl: string | null;
  status: DemoStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

const statusMeta: Record<DemoStatus, string> = {
  Pending: "bg-amber-100 text-amber-800",
  Contacted: "bg-sky-100 text-sky-800",
  Approved: "bg-emerald-100 text-emerald-800",
  Rejected: "bg-rose-100 text-rose-800",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default function DemoApplicantsPage() {
  const [applications, setApplications] = useState<DemoApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | DemoStatus>("All");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadApplications() {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/demo-applications", {
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        applications?: DemoApplication[];
        error?: string;
      };
      if (!response.ok || !Array.isArray(payload.applications)) {
        setApplications([]);
        setError(payload.error ?? "Could not load demo applicants.");
        return;
      }
      setApplications(payload.applications);
    } catch {
      setApplications([]);
      setError("Could not load demo applicants. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadApplications();
  }, []);

  const overviewStats = useMemo(
    () => [
      { label: "Total", value: applications.length, color: "text-zinc-900", bg: "bg-zinc-100" },
      {
        label: "Pending",
        value: applications.filter((item) => item.status === "Pending").length,
        color: "text-amber-700",
        bg: "bg-amber-100",
      },
      {
        label: "Contacted",
        value: applications.filter((item) => item.status === "Contacted").length,
        color: "text-sky-700",
        bg: "bg-sky-100",
      },
      {
        label: "Approved",
        value: applications.filter((item) => item.status === "Approved").length,
        color: "text-emerald-700",
        bg: "bg-emerald-100",
      },
    ],
    [applications],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applications.filter((item) => {
      if (statusFilter !== "All" && item.status !== statusFilter) return false;
      if (!q) return true;
      return [item.labName, item.location, item.contactEmail, item.phone]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [applications, search, statusFilter]);

  async function updateStatus(id: string, status: DemoStatus) {
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/admin/demo-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json()) as {
        application?: DemoApplication;
        error?: string;
      };
      if (!response.ok || !payload.application) {
        window.alert(payload.error ?? "Could not update status.");
        return;
      }
      setApplications((prev) =>
        prev.map((item) => (item.id === id ? payload.application! : item)),
      );
    } catch {
      window.alert("Could not update status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteApplication(item: DemoApplication) {
    const confirmed = window.confirm(
      `Delete demo application for "${item.labName}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(item.id);
    try {
      const response = await fetch(`/api/admin/demo-applications/${item.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        window.alert(payload.error ?? "Could not delete application.");
        return;
      }
      setApplications((prev) => prev.filter((row) => row.id !== item.id));
    } catch {
      window.alert("Could not delete application. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-emerald-100 bg-white px-4 py-3 shadow-sm sm:px-6 sm:py-3.5">
        <div className="min-w-0">
          <h1 className="text-base font-bold text-zinc-900">Demo Applicants</h1>
          <p className="hidden text-xs text-zinc-400 sm:block">
            Review Apply for Demo submissions from the marketing site
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="relative hidden md:block">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400"
            >
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search applicants…"
              className="h-8 w-56 rounded-lg border border-emerald-100 bg-emerald-50/50 pr-3 pl-9 text-sm text-zinc-700 outline-none placeholder:text-zinc-400 transition-colors focus:border-emerald-300 focus:bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "All" | DemoStatus)}
            className="h-8 rounded-lg border border-emerald-100 bg-white px-2 text-xs font-semibold text-zinc-700 outline-none focus:border-emerald-300"
          >
            <option value="All">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Contacted">Contacted</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </header>

      <main className="flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="relative md:hidden">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400"
          >
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search applicants…"
            className="h-10 w-full rounded-xl border border-emerald-100 bg-white pr-3 pl-9 text-sm text-zinc-700 outline-none placeholder:text-zinc-400 focus:border-emerald-300"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          {overviewStats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-white px-4 py-2.5 shadow-sm"
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${stat.bg} ${stat.color}`}
              >
                {isLoading ? "…" : stat.value}
              </span>
              <span className="text-xs font-medium text-zinc-500">{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-md">
          <div className="border-b border-emerald-50 px-4 py-4 sm:px-5">
            <h2 className="text-sm font-bold text-zinc-900">All applicants</h2>
            <p className="text-xs text-zinc-400">
              {isLoading
                ? "Loading…"
                : `${filtered.length} of ${applications.length} applications`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-emerald-50 bg-emerald-50/40">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold tracking-wider text-zinc-600 uppercase">
                    Lab
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-zinc-600 uppercase">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-zinc-600 uppercase">
                    Submitted
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-zinc-600 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold tracking-wider text-zinc-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50/80">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-sm text-zinc-600">
                      Loading demo applicants…
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <p className="text-sm font-medium text-rose-700">{error}</p>
                      <button
                        type="button"
                        onClick={() => void loadApplications()}
                        className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <p className="text-sm font-medium text-zinc-700">No applicants found</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {applications.length === 0
                          ? "New Apply for Demo submissions will appear here."
                          : "Try a different search or status filter."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-emerald-50/30">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {item.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.logoUrl}
                              alt=""
                              className="h-9 w-9 rounded-xl object-contain border border-emerald-100 bg-white"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-xs font-bold text-emerald-800">
                              {item.labName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-zinc-900">{item.labName}</p>
                            <p className="truncate text-xs text-zinc-500">{item.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-800">{item.contactEmail}</p>
                        <p className="text-xs text-zinc-500">{item.phone || "No phone"}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-zinc-600">
                        {dateFormatter.format(new Date(item.createdAt))}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusMeta[item.status]}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={item.status}
                            disabled={updatingId === item.id}
                            onChange={(e) =>
                              void updateStatus(item.id, e.target.value as DemoStatus)
                            }
                            className="h-8 rounded-lg border border-emerald-100 bg-white px-2 text-xs font-semibold text-zinc-700 outline-none disabled:opacity-60"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => void deleteApplication(item)}
                            disabled={deletingId === item.id}
                            className="rounded-lg border border-rose-100 bg-rose-50 px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                          >
                            {deletingId === item.id ? "…" : "Delete"}
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
    </div>
  );
}
