"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import PatientShell from "./components/PatientShell";

type DashboardPayload = {
  summary: {
    releasedResults: number;
    upcomingAppointments: number;
    pendingAppointments: number;
  };
  latestResults: {
    id: string;
    requestCode: string;
    requestedAt: string;
    sampleType: string;
    tests: string;
  }[];
  nextAppointments: {
    id: string;
    scheduledAt: string;
    reason: string;
    status: string;
  }[];
  error?: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default function PatientDashboardPage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [patientName, setPatientName] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const [dashRes, sessionRes] = await Promise.all([
          fetch("/api/patients/dashboard", { cache: "no-store" }),
          fetch("/api/patients/auth/session", { cache: "no-store" }),
        ]);
        const dash = (await dashRes.json()) as DashboardPayload;
        const session = (await sessionRes.json()) as {
          patient?: { name?: string } | null;
        };
        if (cancelled) return;
        if (!dashRes.ok) {
          setError(dash.error ?? "Could not load dashboard.");
          setData(null);
        } else {
          setData(dash);
        }
        setPatientName(session.patient?.name ?? "");
      } catch {
        if (!cancelled) {
          setError("Could not load dashboard. Please try again.");
          setData(null);
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

  return (
    <PatientShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            {patientName ? `Welcome, ${patientName}` : "Patient dashboard"}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            View released lab results and book appointments with your lab.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-zinc-600">Loading dashboard…</p>
        ) : error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
            {error}
          </p>
        ) : data ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SummaryCard
                label="Released results"
                value={String(data.summary.releasedResults)}
                tone="emerald"
              />
              <SummaryCard
                label="Upcoming appointments"
                value={String(data.summary.upcomingAppointments)}
                tone="sky"
              />
              <SummaryCard
                label="Pending requests"
                value={String(data.summary.pendingAppointments)}
                tone="amber"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <section className="rounded-2xl border border-[#dfe4ef] bg-white p-5 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.45)]">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-bold text-zinc-900">Latest results</h2>
                  <Link
                    href="/patients/results"
                    className="text-xs font-semibold text-emerald-800 hover:underline"
                  >
                    View all
                  </Link>
                </div>
                {data.latestResults.length === 0 ? (
                  <p className="text-sm text-zinc-600">No released results yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {data.latestResults.map((result) => (
                      <li
                        key={result.id}
                        className="rounded-xl border border-[#e8ecf5] bg-[#f8fafc] px-4 py-3"
                      >
                        <p className="font-mono text-xs font-semibold text-emerald-800">
                          {result.requestCode}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-zinc-900">
                          {result.tests || result.sampleType || "Lab results"}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {dateFormatter.format(new Date(result.requestedAt))}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-2xl border border-[#dfe4ef] bg-white p-5 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.45)]">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-bold text-zinc-900">Next appointments</h2>
                  <Link
                    href="/patients/appointments"
                    className="text-xs font-semibold text-emerald-800 hover:underline"
                  >
                    Manage
                  </Link>
                </div>
                {data.nextAppointments.length === 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-zinc-600">No upcoming appointments.</p>
                    <Link
                      href="/patients/appointments"
                      className="inline-flex rounded-lg border border-emerald-300 bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-200"
                    >
                      Book appointment
                    </Link>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {data.nextAppointments.map((appointment) => (
                      <li
                        key={appointment.id}
                        className="rounded-xl border border-[#e8ecf5] bg-[#f8fafc] px-4 py-3"
                      >
                        <p className="text-sm font-semibold text-zinc-900">
                          {appointment.reason}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {dateTimeFormatter.format(new Date(appointment.scheduledAt))} ·{" "}
                          {appointment.status}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/patients/results"
                className="inline-flex rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-bold text-sky-900 hover:bg-sky-100"
              >
                Check test results
              </Link>
              <Link
                href="/patients/appointments"
                className="inline-flex rounded-xl border border-emerald-300 bg-emerald-100 px-4 py-2.5 text-sm font-bold text-emerald-900 hover:bg-emerald-200"
              >
                Book appointment
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </PatientShell>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "sky" | "amber";
}) {
  const tones = {
    emerald: "text-emerald-700",
    sky: "text-sky-700",
    amber: "text-amber-700",
  };
  return (
    <div className="rounded-2xl border border-[#dfe4ef] bg-white px-4 py-4 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.45)]">
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tones[tone]}`}>{value}</p>
    </div>
  );
}
