"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import {
  COMPANY_TRANSACTION_MENU,
  type CompanyTransactionTab,
} from "@/lib/company-transaction-menu";

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

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[#dfe4ef] bg-[#f3f5fa] px-6 py-4 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.65)]">
        <div>
          <h1 className="text-base font-bold text-zinc-900">Transactions</h1>
          <p className="mt-1 text-xs text-zinc-700">
            <span className="font-semibold text-zinc-900">{panel.kicker}</span>
            <span className="text-zinc-600"> · Switch module from the Transactions menu in the sidebar.</span>
          </p>
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

export default function CompanyTransactionsPage() {
  return (
    <Suspense>
      <CompanyTransactionsContent />
    </Suspense>
  );
}
