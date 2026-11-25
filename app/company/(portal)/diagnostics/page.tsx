"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import {
  COMPANY_DIAGNOSTICS_TAB_VALUES,
  type CompanyDiagnosticsTab,
} from "@/lib/company-diagnostics-menu";

import CheckTestResultPanel from "./CheckTestResultPanel";
import PrepareTestResultPanel from "./PrepareTestResultPanel";
import TestRequestsPanel from "./TestRequestsPanel";
import TestSettingsPanel from "./TestSettingsPanel";

const validTabSet = new Set<string>([
  ...COMPANY_DIAGNOSTICS_TAB_VALUES,
  "new-test",
]);

function normalizeTabParam(raw: string | null): CompanyDiagnosticsTab | "new-test" {
  if (raw && validTabSet.has(raw)) {
    if (raw === "new-test") return "test-requests";
    return raw as CompanyDiagnosticsTab;
  }
  return "test-requests";
}

function CompanyDiagnosticsContent() {
  const searchParams = useSearchParams();
  const active = useMemo(
    () => normalizeTabParam(searchParams.get("tab")),
    [searchParams],
  );

  if (active === "test-requests") {
    return <TestRequestsPanel />;
  }

  if (active === "prepare-test-result") {
    return <PrepareTestResultPanel />;
  }

  if (active === "check-test-result") {
    return <CheckTestResultPanel />;
  }

  return <TestSettingsPanel />;
}

export default function CompanyDiagnosticsPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-zinc-600">Loading diagnostics…</div>}>
      <CompanyDiagnosticsContent />
    </Suspense>
  );
}
