"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { COMPANY_REPORT_TAB_VALUES } from "@/lib/company-reports-menu";

const validTabSet = new Set<string>(COMPANY_REPORT_TAB_VALUES);

/** Legacy group-level tab redirects to first leaf. */
const legacyRedirectMap: Record<string, string> = {
  "daily-reports": "dr-collective-due",
};

function normalizeTabParam(raw: string | null): string {
  if (!raw) return "dr-collective-due";
  if (legacyRedirectMap[raw]) return legacyRedirectMap[raw];
  if (validTabSet.has(raw)) return raw;
  return "dr-collective-due";
}

type Panel = {
  breadcrumb: string[];
  title: string;
  body: string;
  placeholders: string[];
};

const panels: Record<string, Panel> = {
  /* ── Daily Reports ── */
  "dr-collective-due": {
    breadcrumb: ["Daily Reports", "Collective / Due Report"],
    title: "Collective and due collections",
    body: "View the total collections for the day alongside outstanding amounts not yet received. Drill into individual patient ledgers or export the reconciliation sheet.",
    placeholders: ["Day total", "Outstanding balance", "Export reconciliation"],
  },
  "dr-payment-due": {
    breadcrumb: ["Daily Reports", "Payment Due Report"],
    title: "Pending payment report",
    body: "List patients and corporate accounts with unpaid or partially paid invoices. Filter by age of debt, payer type, or collection centre to prioritise follow-up.",
    placeholders: ["Ageing buckets", "Payer type filter", "Follow-up export"],
  },
  "dr-list-patients": {
    breadcrumb: ["Daily Reports", "List of Patients"],
    title: "Daily patient roster",
    body: "Full register of patients processed during the selected date range with sample status, billing amount, and result delivery mode.",
    placeholders: ["Date range filter", "Status breakdown", "Print / export"],
  },
  "dr-due-tests": {
    breadcrumb: ["Daily Reports", "Due Tests"],
    title: "Pending and overdue tests",
    body: "Identify tests that have been ordered but whose results are not yet authorised or delivered. Sortable by TAT breach level and responsible department.",
    placeholders: ["TAT breach filter", "Department view", "Alert escalation"],
  },
  "dr-login-wise-collection": {
    breadcrumb: ["Daily Reports", "Login Wise Collection"],
    title: "Collection by login / operator",
    body: "Break down daily registrations and revenue by the operator login that processed each transaction — useful for shift accountability and cash-on-hand checks.",
    placeholders: ["Operator ranking", "Cash vs credit split", "Shift summary"],
  },
  "dr-work-list-technician": {
    breadcrumb: ["Daily Reports", "Work List for Technician"],
    title: "Technician work list",
    body: "Print or display the ordered tests assigned to each department or bench for the current session, enabling organised sample processing and result entry.",
    placeholders: ["Department filter", "Sample priority", "Print work list"],
  },
  "dr-diabetic-card-printing": {
    breadcrumb: ["Daily Reports", "Diabetic Card Printing"],
    title: "Diabetic monitoring cards",
    body: "Generate and print diabetic patient tracking cards summarising glucose, HbA1c, and other relevant parameters for clinician review at follow-up visits.",
    placeholders: ["Patient selection", "Parameter summary", "Card print layout"],
  },
  "dr-list-patients-creditors": {
    breadcrumb: ["Daily Reports", "List of Patients (Creditors)"],
    title: "Creditor patient list",
    body: "Patients whose charges are billed to a corporate or insurance account. Shows outstanding ledger balances and credit limit utilisation per firm.",
    placeholders: ["Firm / insurer filter", "Credit utilisation", "Settlement export"],
  },
  "dr-list-patients-coll-cntr": {
    breadcrumb: ["Daily Reports", "List of Patients (Coll. Cntr)"],
    title: "Collection centre patient list",
    body: "Patients registered through satellite collection centres. Includes dispatch status, sample receipt confirmation, and centre-wise revenue summary.",
    placeholders: ["Centre filter", "Dispatch & receipt status", "Centre revenue"],
  },
  "dr-list-patients-outside": {
    breadcrumb: ["Daily Reports", "List of Patients (Outside)"],
    title: "Outside / walk-in patient list",
    body: "Patients not arriving through a registered referral channel — walk-ins, camps, or externally requested tests. Useful for source analysis.",
    placeholders: ["Source breakdown", "Walk-in vs camp", "Revenue attribution"],
  },
  "dr-collection-dept-wise": {
    breadcrumb: ["Daily Reports", "Collection - Dept Wise"],
    title: "Department-wise collection",
    body: "Revenue and test volume summarised by processing department (biochemistry, haematology, etc.) for a selected date range.",
    placeholders: ["Department matrix", "Test count vs revenue", "Date comparison"],
  },
  "dr-rate-list-center": {
    breadcrumb: ["Daily Reports", "Rate List of Center"],
    title: "Collection centre rate list",
    body: "Display or print the applicable test price list for a specific collection centre, showing any centre-negotiated concessions.",
    placeholders: ["Centre selection", "Rate table", "Print / PDF export"],
  },
  "dr-expense-report": {
    breadcrumb: ["Daily Reports", "Expense Report"],
    title: "Daily expense register",
    body: "Record and summarise laboratory expenses (reagents, consumables, miscellaneous) entered for the selected period, grouped by expense category.",
    placeholders: ["Expense categories", "Period total", "Category breakdown"],
  },
  "dr-collection-center-summary": {
    breadcrumb: ["Daily Reports", "Collection Center Summary"],
    title: "Collection centre summary",
    body: "Consolidated view of registrations, revenue, and outstanding amounts across all active collection centres for a chosen date range.",
    placeholders: ["Centre comparison", "Revenue vs outstanding", "Trend view"],
  },
  "dr-form-e-printing": {
    breadcrumb: ["Daily Reports", "Form - E Printing"],
    title: "Form-E batch printing",
    body: "Generate Form-E documents for requisite government or regulatory submissions, batched by date and filterable by test category.",
    placeholders: ["Date batch", "Test category filter", "Batch print"],
  },
  "dr-list-patients-test-value": {
    breadcrumb: ["Daily Reports", "List of Patients (Test Value)"],
    title: "Patient list with test values",
    body: "Combined register showing patient details alongside their result values for selected tests — useful for clinical follow-up and QC review.",
    placeholders: ["Test selection", "Value range filter", "Export for review"],
  },
  "dr-rate-lists-printing": {
    breadcrumb: ["Daily Reports", "Rate Lists Printing"],
    title: "Rate list printing",
    body: "Print any tariff list in a formatted layout suitable for display at reception or for distribution to referral doctors.",
    placeholders: ["Rate list selection", "Format options", "Print / PDF"],
  },
  "dr-list-patients-mobile": {
    breadcrumb: ["Daily Reports", "List of Patients Mobile No"],
    title: "Patient mobile number list",
    body: "Export a list of patients with their mobile numbers for SMS-based report delivery notification, appointment reminders, or campaign messaging.",
    placeholders: ["Date range", "Opt-in filter", "SMS export"],
  },
  "dr-list-patients-email": {
    breadcrumb: ["Daily Reports", "List of Patients Email ID"],
    title: "Patient email address list",
    body: "Extract patient email addresses for electronic report delivery, follow-up communication, or marketing campaigns, with opt-in status shown.",
    placeholders: ["Date range", "Opt-in filter", "Email export"],
  },
  "dr-patients-appointments": {
    breadcrumb: ["Daily Reports", "Patients Appointments"],
    title: "Appointment schedule",
    body: "View scheduled patient appointments for a selected date, including sample collection slots, home visit bookings, and no-show tracking.",
    placeholders: ["Date & slot view", "No-show tracking", "Confirmation export"],
  },
  "dr-discounted-rate": {
    breadcrumb: ["Daily Reports", "Discounted Rate"],
    title: "Discounted rate report",
    body: "List patients who received a discount during registration, showing the original rate, discount applied, and the resulting billed amount.",
    placeholders: ["Discount breakdown", "Authoriser filter", "Revenue impact"],
  },

  /* ── Other top-level report items (no sub-items) ── */
  "referral-dr-reports": {
    breadcrumb: ["Referral Dr. Reports"],
    title: "Referring physician analytics",
    body: "Trace workload and outcomes linked to referral sources with drill-down by doctor.",
    placeholders: ["Referrer ranking", "Test mix", "Period compare"],
  },
  "mis-reports": {
    breadcrumb: ["MIS Reports"],
    title: "Management information summaries",
    body: "Executive-friendly aggregates: revenue, utilization, and KPI roll-ups.",
    placeholders: ["Monthly dashboard", "Variance", "Forecast hooks"],
  },
  "prep-charge-reports": {
    breadcrumb: ["Prep. Charge Reports"],
    title: "Preparation and charges",
    body: "Align preparation steps with billed amounts for reconciliation and auditing.",
    placeholders: ["Charge codes", "Prep vs billed", "Exceptions"],
  },
  "performance-graphics": {
    breadcrumb: ["Performance Graphics"],
    title: "Lab performance visuals",
    body: "Turnaround, productivity, quality indicators, and chart-ready series.",
    placeholders: ["SLA attainment", "By discipline", "Trend charts"],
  },
  "multi-dept-reports": {
    breadcrumb: ["Multi Dept Reports"],
    title: "Cross-department views",
    body: "Unified roll-ups blending haematology, chemistry, microbiology, and logistics metrics.",
    placeholders: ["Dept matrix", "Shared filters", "Scheduled PDF"],
  },
  "other-reports": {
    breadcrumb: ["Other Reports"],
    title: "Additional reporting",
    body: "Ad hoc and specialised outputs that do not fit standard categories. Custom layouts and filters can attach here.",
    placeholders: ["Saved layouts", "Custom filters", "Archive"],
  },
};

function CompanyReportsContent() {
  const searchParams = useSearchParams();
  const tab = useMemo(() => normalizeTabParam(searchParams.get("tab")), [searchParams]);
  const panel = useMemo(() => panels[tab] ?? panels["dr-collective-due"], [tab]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[#dfe4ef] bg-[#f3f5fa] px-6 py-4 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.65)]">
        <div>
          <h1 className="text-base font-bold text-zinc-900">Reports</h1>
          <p className="mt-1 text-xs text-zinc-700">
            <span className="font-semibold text-zinc-900">{panel.breadcrumb.join(" · ")}</span>
            <span className="text-zinc-600"> · Switch report from the Reports menu in the sidebar.</span>
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <section className="overflow-hidden rounded-2xl border border-[#dfe4ef] bg-[#f8f9fc] p-8 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.6)]">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              {panel.breadcrumb.join(" · ")}
            </p>
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

export default function CompanyReportsPage() {
  return (
    <Suspense>
      <CompanyReportsContent />
    </Suspense>
  );
}
