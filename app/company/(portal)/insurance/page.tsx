"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import {
  COMPANY_INSURANCE_MENU,
  COMPANY_INSURANCE_TAB_VALUES,
  type CompanyInsuranceTab,
} from "@/lib/company-insurance-menu";

import InsuranceTypePanel from "./InsuranceTypePanel";

const validTabSet = new Set<string>(COMPANY_INSURANCE_TAB_VALUES);

function normalizeTabParam(raw: string | null): CompanyInsuranceTab {
  if (raw && validTabSet.has(raw)) return raw as CompanyInsuranceTab;
  return "insurance-type";
}

const panels: Record<
  Exclude<CompanyInsuranceTab, "insurance-type">,
  { title: string; body: string }
> = {
  providers: {
    title: "Providers",
    body: "Manage HMO and insurance company providers linked to your lab.",
  },
  plans: {
    title: "Plans",
    body: "Configure coverage plans and benefit tiers for insurance billing.",
  },
};

function CompanyInsuranceContent() {
  const searchParams = useSearchParams();
  const active = useMemo(
    () => normalizeTabParam(searchParams.get("tab")),
    [searchParams],
  );

  if (active === "insurance-type") {
    return <InsuranceTypePanel />;
  }

  const panel = panels[active];
  const menuLabel =
    COMPANY_INSURANCE_MENU.find((item) => item.tab === active)?.label ?? panel.title;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[#dfe4ef] bg-[#f3f5fa] px-4 py-4 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.65)] sm:px-6">
        <div>
          <h1 className="text-base font-bold text-zinc-900">Insurance</h1>
          <p className="mt-1 text-xs text-zinc-700">
            <span className="font-semibold text-zinc-900">{menuLabel}</span>
            <span className="text-zinc-600">
              {" "}
              · Switch module from the Insurance menu in the sidebar.
            </span>
          </p>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <section className="rounded-2xl border border-[#dfe4ef] bg-white px-5 py-5 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.6)]">
          <h2 className="text-sm font-bold text-zinc-900">{panel.title}</h2>
          <p className="mt-1 text-sm text-zinc-600">{panel.body}</p>
        </section>
      </main>
    </div>
  );
}

export default function CompanyInsurancePage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-zinc-600">Loading insurance…</div>}>
      <CompanyInsuranceContent />
    </Suspense>
  );
}
