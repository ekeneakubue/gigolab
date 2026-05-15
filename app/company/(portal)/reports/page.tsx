"use client";

import { useState } from "react";

type ReportTab = "day-to-day" | "referral-dr" | "mis" | "prep-chrg" | "performance" | "multi-dept";

const tabs: { id: ReportTab; label: string; description: string }[] = [
  {
    id: "day-to-day",
    label: "Day to day reports",
    description: "Operational summaries for daily lab activity.",
  },
  {
    id: "referral-dr",
    label: "Referral Dr. report",
    description: "Volumes and outcomes attributed to referring physicians.",
  },
  {
    id: "mis",
    label: "MIS report",
    description: "Management information summaries and KPI roll-ups.",
  },
  {
    id: "prep-chrg",
    label: "Prep. chrg reports",
    description: "Preparation and charge breakdowns by service or department.",
  },
  {
    id: "performance",
    label: "Performance report",
    description: "Turnaround, productivity, and quality indicators.",
  },
  {
    id: "multi-dept",
    label: "Multi Dept Reports",
    description: "Cross-department consolidated reporting.",
  },
];

const panelCopy: Record<
  ReportTab,
  { kicker: string; title: string; body: string; placeholders: string[] }
> = {
  "day-to-day": {
    kicker: "Day to day reports",
    title: "Daily operational reporting",
    body: "Snapshot registrations, collections, completions, and backlog by shift or location.",
    placeholders: ["Today vs yesterday", "By section", "Export CSV"],
  },
  "referral-dr": {
    kicker: "Referral Dr. report",
    title: "Referring physician analytics",
    body: "Trace workload and revenue linked to referral sources with drill-down by doctor.",
    placeholders: ["Referrer ranking", "Test mix", "Period compare"],
  },
  mis: {
    kicker: "MIS report",
    title: "Management information system",
    body: "Executive-friendly aggregates: revenue, costs estimates, and utilization trends.",
    placeholders: ["Monthly dashboard", "Variance", "Forecast hooks"],
  },
  "prep-chrg": {
    kicker: "Prep. chrg reports",
    title: "Preparation & charges",
    body: "Align preparation steps with billed amounts for reconciliation and auditing.",
    placeholders: ["Charge codes", "Prep vs billed", "Exceptions"],
  },
  performance: {
    kicker: "Performance report",
    title: "Lab performance metrics",
    body: "TAT distributions, QC hits, repeat rates, and bench throughput benchmarks.",
    placeholders: ["SLA attainment", "By discipline", "Trend"],
  },
  "multi-dept": {
    kicker: "Multi Dept Reports",
    title: "Cross-department views",
    body: "Unified schedules blending hematology, chemistry, microbiology, and logistics metrics.",
    placeholders: ["Dept matrix", "Shared filters", "Scheduled PDF"],
  },
};

export default function CompanyReportsPage() {
  const [active, setActive] = useState<ReportTab>("day-to-day");
  const panel = panelCopy[active];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[#dfe4ef] bg-[#f3f5fa] px-6 py-4 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.65)]">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-base font-bold text-zinc-900">Reports</h1>
            <p className="text-xs text-zinc-700">Pick a report category to configure filters and run outputs.</p>
          </div>

          <div
            className="flex flex-col gap-2 rounded-xl border border-[#dfe4ef] bg-[#eef1f6] p-1.5 shadow-[inset_0_2px_8px_rgba(15,23,42,0.06)] sm:flex-row sm:flex-wrap"
            role="tablist"
            aria-label="Report category"
          >
            {tabs.map((tab) => {
              const isSelected = active === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActive(tab.id)}
                  className={`min-h-[44px] flex-1 rounded-lg px-3 py-2.5 text-left transition-all duration-150 sm:min-w-[min(100%,200px)] sm:flex-[1_1_calc(33.333%-0.5rem)] xl:flex-[1_1_calc(16.666%-0.45rem)] ${
                    isSelected
                      ? "bg-white text-zinc-900 shadow-[0_12px_26px_-18px_rgba(15,23,42,0.65)] ring-1 ring-[#dfe4ef]"
                      : "text-zinc-600 hover:bg-white/70 hover:text-zinc-900"
                  }`}
                >
                  <span className="block text-sm font-semibold leading-snug">{tab.label}</span>
                  <span className={`mt-0.5 block text-[11px] leading-snug ${isSelected ? "text-zinc-700" : "text-zinc-600"}`}>
                    {tab.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <section className="overflow-hidden rounded-2xl border border-[#dfe4ef] bg-[#f8f9fc] p-8 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.6)]">
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
      </main>
    </div>
  );
}
