"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  COMPANY_TRANSACTION_MENU,
  type CompanyTransactionTab,
} from "@/lib/company-transaction-menu";

import RegistrationModal, { type RegistrationRecord } from "./registration-modal";

type RegistrationModalState =
  | { mode: "create" }
  | { mode: "view" | "edit"; registration: RegistrationRecord };

const registrationDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const validTabSet = new Set<string>(COMPANY_TRANSACTION_MENU.map((m) => m.tab));

function normalizeTabParam(raw: string | null): CompanyTransactionTab {
  if (raw && validTabSet.has(raw)) {
    return raw as CompanyTransactionTab;
  }
  return "registration";
}

function panelForTab(tab: CompanyTransactionTab) {
  const entry = COMPANY_TRANSACTION_MENU.find((m) => m.tab === tab);
  const label = entry?.label ?? "Transaction";
  return {
    kicker: label,
    title: `${label} workspace`,
    body: `Run ${label.toLowerCase()} from this screen. Forms, lists, and validation rules for this module will connect here as they are implemented.`,
    placeholders: ["Workflow setup", "Data capture", "Review & submit"],
  };
}

function CompanyTransactionsContent() {
  const searchParams = useSearchParams();
  const active = useMemo(
    () => normalizeTabParam(searchParams.get("tab")),
    [searchParams]
  );

  const panel = useMemo(() => panelForTab(active), [active]);
  const [registrationModal, setRegistrationModal] = useState<RegistrationModalState | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const [deletingRegistrationId, setDeletingRegistrationId] = useState<string | null>(null);

  const loadRegistrations = useCallback(async () => {
    setIsLoadingRegistrations(true);
    try {
      const response = await fetch("/api/company/transactions/registrations");
      if (!response.ok) {
        setRegistrations([]);
        return;
      }
      const data = (await response.json()) as RegistrationRecord[];
      setRegistrations(data);
    } catch {
      setRegistrations([]);
    } finally {
      setIsLoadingRegistrations(false);
    }
  }, []);

  useEffect(() => {
    if (active !== "registration") return;
    void loadRegistrations();
  }, [active, loadRegistrations]);

  const deleteRegistration = async (registration: RegistrationRecord) => {
    if (!window.confirm(`Delete registration "${registration.sampleCode}"? This cannot be undone.`)) return;
    setRegistrationError("");
    setDeletingRegistrationId(registration.id);
    try {
      const response = await fetch(`/api/company/transactions/registrations/${registration.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setRegistrationError(payload.error ?? "Could not delete registration.");
        return;
      }
      setRegistrations((current) => current.filter((item) => item.id !== registration.id));
      setRegistrationModal((current) =>
        current && current.mode !== "create" && current.registration.id === registration.id ? null : current,
      );
    } catch {
      setRegistrationError("Could not delete registration. Please try again.");
    } finally {
      setDeletingRegistrationId(null);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[#dfe4ef] bg-[#f3f5fa] px-4 py-4 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.65)] sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-base font-bold text-zinc-900">Transactions</h1>
            <p className="mt-1 text-xs text-zinc-700">
              <span className="font-semibold text-zinc-900">{panel.kicker}</span>
              <span className="text-zinc-600"> · Switch module from the Transactions menu in the sidebar.</span>
            </p>
          </div>
          {active === "registration" ? (
            <button
              type="button"
              onClick={() => setRegistrationModal({ mode: "create" })}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden>
                <path strokeLinecap="round" d="M12 5v14M5 12h14" />
              </svg>
              New Registration
            </button>
          ) : null}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        {active === "registration" ? (
          <section className="overflow-hidden rounded-2xl border border-[#dfe4ef] bg-white shadow-[0_16px_32px_-24px_rgba(15,23,42,0.6)]">
            <div className="border-b border-[#e8ecf5] px-5 py-4">
              <h2 className="text-sm font-bold text-zinc-900">Registrations</h2>
              <p className="text-xs text-zinc-600">
                {isLoadingRegistrations
                  ? "Loading registrations…"
                  : `${registrations.length} sample${registrations.length === 1 ? "" : "s"} registered for this lab`}
              </p>
            </div>
            {registrationError ? (
              <p className="px-5 py-3 text-sm font-medium text-rose-700">{registrationError}</p>
            ) : null}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-sm">
                <thead>
                  <tr className="border-b border-[#e8ecf5] bg-[#f3f5fa]/80">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Sample ID</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Sample</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Patient</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Category</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Ref. Doctor</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Tests</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Reg. Date</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8ecf5]/80">
                  {isLoadingRegistrations ? (
                    Array.from({ length: 4 }, (_, index) => (
                      <tr key={`registration-skeleton-${index}`} className="animate-pulse">
                        <td className="px-5 py-3"><span className="block h-3.5 w-16 rounded bg-zinc-100" /></td>
                        <td className="px-4 py-3"><span className="block h-3.5 w-28 rounded bg-zinc-100" /></td>
                        <td className="px-4 py-3"><span className="block h-3.5 w-16 rounded bg-zinc-100" /></td>
                        <td className="px-4 py-3"><span className="block h-3.5 w-16 rounded bg-zinc-100" /></td>
                        <td className="px-4 py-3"><span className="block h-3.5 w-24 rounded bg-zinc-100" /></td>
                        <td className="px-4 py-3"><span className="block h-3.5 w-32 rounded bg-zinc-100" /></td>
                        <td className="px-4 py-3"><span className="block h-3.5 w-20 rounded bg-zinc-100" /></td>
                        <td className="px-4 py-3"><span className="ml-auto block h-8 w-[6.5rem] rounded-lg bg-zinc-100" /></td>
                      </tr>
                    ))
                  ) : registrations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center">
                        <p className="text-sm font-medium text-zinc-700">No registrations yet</p>
                        <p className="mt-1 text-xs text-zinc-600">Use New Registration to add one.</p>
                      </td>
                    </tr>
                  ) : (
                    registrations.map((registration) => {
                      const testNames = (registration.tests ?? []).map((item) => item.test.name).join(", ");
                      return (
                        <tr key={registration.id} className="transition-colors hover:bg-[#f3f5fa]/60">
                          <td className="px-5 py-3 font-semibold text-zinc-900 whitespace-nowrap">{registration.sampleCode}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-zinc-800">{registration.sampleName}</p>
                            <p className="text-[11px] text-zinc-600">{registration.sampleType} · {registration.age}</p>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-zinc-700">{registration.patientId}</td>
                          <td className="px-4 py-3 text-zinc-700">{registration.category}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-zinc-700">{registration.doctor.name}</td>
                          <td className="px-4 py-3 text-zinc-700">{testNames || "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-zinc-600">
                            {registrationDateFormatter.format(new Date(registration.registeredAt))}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setRegistrationModal({ mode: "view", registration })}
                                aria-label={`View ${registration.sampleCode}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-100 bg-sky-50 text-sky-700 transition-colors hover:bg-sky-100"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => setRegistrationModal({ mode: "edit", registration })}
                                aria-label={`Edit ${registration.sampleCode}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100"
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
                                onClick={() => void deleteRegistration(registration)}
                                disabled={deletingRegistrationId === registration.id}
                                aria-label={`Delete ${registration.sampleCode}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {deletingRegistrationId === registration.id ? (
                                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
          </section>
        ) : null}
        {active !== "registration" ? (
        <section className="overflow-hidden rounded-2xl border border-[#dfe4ef] bg-[#f8f9fc] p-4 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.6)] sm:p-8">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">{panel.kicker}</p>
            <h2 className="text-lg font-bold text-zinc-900">{panel.title}</h2>
            <p className="max-w-xl text-sm text-zinc-700">{panel.body}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {panel.placeholders.map((card) => (
                <div
                  key={card}
                  className="rounded-xl border border-[#e8ecf5] bg-white/80 px-4 py-3 text-sm font-medium text-zinc-700 shadow-[0_8px_20px_-16px_rgba(15,23,42,0.45)]"
                >
                  {card}
                </div>
              ))}
            </div>
          </div>
        </section>
        ) : null}
      </main>
      {registrationModal ? (
        <RegistrationModal
          key={registrationModal.mode === "create" ? "create" : `${registrationModal.mode}-${registrationModal.registration.id}`}
          mode={registrationModal.mode}
          registration={registrationModal.mode === "create" ? null : registrationModal.registration}
          onClose={() => setRegistrationModal(null)}
          onSaved={() => {
            void loadRegistrations();
          }}
        />
      ) : null}
    </div>
  );
}

export default function CompanyTransactionsPage() {
  return (
    <Suspense>
      <CompanyTransactionsContent />
    </Suspense>
  );
}
