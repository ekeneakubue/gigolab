"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { COMPANY_MASTER_TAB_VALUES } from "@/lib/company-masters-menu";

const validTabSet = new Set<string>(COMPANY_MASTER_TAB_VALUES);

/** Old group/section tabs that are no longer leaf pages → redirect to their first leaf. */
const legacyRedirectMap: Record<string, string> = {
  "lab-management-master": "lab-mm-tests",
  "lab-main-master": "lab-mm-tests",
  "lab-configuration-settings": "lab-cs-controller-options",
  "lab-edit-masters": "lab-em-edit-doctor-master",
  "lab-preparation-charges": "lab-pc-dr-wise",
  "lab-outsourcing": "lab-os-outsourced-investigation",
  "accounting-system-master": "acc-company-master",
  "other-masters": "other-sender-master",
};

function normalizeTabParam(raw: string | null): string {
  if (!raw) return "lab-mm-tests";
  if (legacyRedirectMap[raw]) return legacyRedirectMap[raw];
  if (validTabSet.has(raw)) return raw;
  return "lab-mm-tests";
}

type Panel = {
  breadcrumb: string[];
  title: string;
  body: string;
  placeholders: string[];
};

const panels: Record<string, Panel> = {
  /* ── Lab Management Master › Main Master ── */
  "lab-mm-tests": {
    breadcrumb: ["Lab Management Master", "Main Master", "Tests"],
    title: "Test catalogue",
    body: "Define every test the laboratory offers — code, name, specimen, methodology, TAT, and result type. Tests configured here are available in registration and the billing engine.",
    placeholders: ["Test code & name", "Specimen & methodology", "TAT & result type"],
  },
  "lab-mm-doctors": {
    breadcrumb: ["Lab Management Master", "Main Master", "Doctors"],
    title: "Referring doctor directory",
    body: "Maintain the list of doctors and consultants who refer patients. Each record holds contact details, specialisation, and the rate card used for commission settlement.",
    placeholders: ["Doctor profile", "Specialisation", "Rate card linkage"],
  },
  "lab-mm-departments": {
    breadcrumb: ["Lab Management Master", "Main Master", "Departments"],
    title: "Laboratory departments",
    body: "Register internal departments (biochemistry, haematology, microbiology, etc.) that tests are routed to. Departments control workload distribution and report headers.",
    placeholders: ["Department code & name", "Reporting section", "Instrument routing"],
  },
  "lab-mm-age-groups": {
    breadcrumb: ["Lab Management Master", "Main Master", "Age Groups"],
    title: "Age group definitions",
    body: "Create age brackets (neonate, paediatric, adult, geriatric) to drive age-specific reference ranges and auto-flagging rules on result reports.",
    placeholders: ["Age bracket ranges", "Reference range mapping", "Flag thresholds"],
  },
  "lab-mm-packages": {
    breadcrumb: ["Lab Management Master", "Main Master", "Packages"],
    title: "Test packages and panels",
    body: "Bundle individual tests into packages for common health check-ups or disease profiles. Packages inherit component pricing or carry a flat rate override.",
    placeholders: ["Package composition", "Flat rate override", "Health check profiles"],
  },
  "lab-mm-rate-lists": {
    breadcrumb: ["Lab Management Master", "Main Master", "Rate Lists"],
    title: "Tariff and rate lists",
    body: "Manage multiple price lists — walk-in, corporate, insurance, and concessional. Each rate list can be assigned to patients, companies, or referral sources.",
    placeholders: ["Rate list codes", "Test-wise pricing", "Corporate & insurance rates"],
  },
  "lab-mm-members": {
    breadcrumb: ["Lab Management Master", "Main Master", "Members"],
    title: "Member / subscriber registry",
    body: "Track members enrolled under prepaid or subscription health schemes. Member records carry entitlements, validity dates, and a linked rate plan.",
    placeholders: ["Member ID & profile", "Entitlement plan", "Validity & renewal"],
  },
  "lab-mm-antibiotic-master": {
    breadcrumb: ["Lab Management Master", "Main Master", "Antibiotic Master"],
    title: "Antibiotic sensitivity master",
    body: "Define antibiotics and their sensitivity categories (sensitive, intermediate, resistant) for use in culture and sensitivity reports across microbiology.",
    placeholders: ["Antibiotic library", "Sensitivity categories", "Organism mapping"],
  },
  "lab-mm-disease-dot-category": {
    breadcrumb: ["Lab Management Master", "Main Master", "Disease / DOT Category"],
    title: "Disease and DOT categories",
    body: "Maintain disease codes and Directly Observed Therapy categories required for government reporting, epidemiological tracking, and test ordering rules.",
    placeholders: ["Disease code list", "DOT category mapping", "Notification rules"],
  },
  "lab-mm-interpretation-comments": {
    breadcrumb: ["Lab Management Master", "Main Master", "Interpretation / Comments"],
    title: "Interpretation and comment library",
    body: "Build a library of reusable interpretive text and clinical comments that can be auto-attached or manually selected when authorising patient reports.",
    placeholders: ["Comment templates", "Auto-attach rules", "Test-specific narratives"],
  },
  "lab-mm-franchisee-master": {
    breadcrumb: ["Lab Management Master", "Main Master", "Franchisee Master"],
    title: "Franchisee network",
    body: "Register franchise partners, their collection areas, and applicable revenue-sharing terms. Franchisees appear as selectable sources in registration and settlement.",
    placeholders: ["Franchisee profiles", "Revenue-share rules", "Coverage areas"],
  },
  "lab-mm-collection-center-master": {
    breadcrumb: ["Lab Management Master", "Main Master", "Collection Center Master"],
    title: "Collection centre directory",
    body: "Maintain all collection points (satellite labs, phlebotomy booths) with their codes, contact details, and dispatch schedules to the main processing lab.",
    placeholders: ["Centre code & address", "Dispatch schedule", "Contact & logistics"],
  },
  "lab-mm-usg-types-pregnancy": {
    breadcrumb: ["Lab Management Master", "Main Master", "USG Types in Pregnancy"],
    title: "USG types for obstetric studies",
    body: "Define ultrasound examination types performed during pregnancy (dating, anomaly, growth, Doppler) with default gestational age ranges and report templates.",
    placeholders: ["USG type codes", "GA range defaults", "Report template linkage"],
  },
  "lab-mm-outsider-master": {
    breadcrumb: ["Lab Management Master", "Main Master", "Outsider Master"],
    title: "External patient / walk-in sources",
    body: "Track patients or source codes that originate outside the normal referral network — direct walk-ins, camps, or externally ordered investigations.",
    placeholders: ["Source code list", "Walk-in categories", "Camp / drive events"],
  },
  "lab-mm-titles": {
    breadcrumb: ["Lab Management Master", "Main Master", "Titles"],
    title: "Name title definitions",
    body: "Manage honorifics and professional titles (Mr., Mrs., Dr., Prof., etc.) used in patient registration, report headers, and correspondence.",
    placeholders: ["Title codes", "Default gender mapping", "Report display format"],
  },
  "lab-mm-firm-master": {
    breadcrumb: ["Lab Management Master", "Main Master", "Firm Master"],
    title: "Corporate firm accounts",
    body: "Register corporate clients and firms who send patients under credit or billing arrangements. Each firm record carries a rate list and a credit limit.",
    placeholders: ["Firm code & name", "Credit limit & terms", "Rate list linkage"],
  },
  "lab-mm-room-master": {
    breadcrumb: ["Lab Management Master", "Main Master", "Room Master"],
    title: "Room and ward definitions",
    body: "Define rooms, wards, or beds in the clinical facility that appear as location fields in patient registration and inpatient sample collection.",
    placeholders: ["Room / ward codes", "Floor & block mapping", "Inpatient linkage"],
  },

  /* ── Lab Management Master › Configuration Settings ── */
  "lab-cs-controller-options": {
    breadcrumb: ["Lab Management Master", "Configuration Settings", "Lab Controller Options"],
    title: "Lab controller configuration",
    body: "Set system-level options governing result auto-validation thresholds, critical value alerting, delta-check tolerance, and LIS communication protocols.",
    placeholders: ["Auto-validation rules", "Critical value alerts", "Delta-check settings"],
  },
  "lab-cs-setup-options": {
    breadcrumb: ["Lab Management Master", "Configuration Settings", "Lab Setup Options"],
    title: "Lab setup preferences",
    body: "Configure general setup parameters — default department routing, barcode format, TAT notification thresholds, and shift-based operational windows.",
    placeholders: ["Department routing", "Barcode format", "TAT notification rules"],
  },
  "lab-cs-email-settings": {
    breadcrumb: ["Lab Management Master", "Configuration Settings", "Email Settings"],
    title: "Outbound email configuration",
    body: "Set the SMTP server, sender address, and email templates used to deliver patient reports, critical value notifications, and pending sample reminders.",
    placeholders: ["SMTP credentials", "Sender address & display name", "Report delivery templates"],
  },
  "lab-cs-doctors-signatures": {
    breadcrumb: ["Lab Management Master", "Configuration Settings", "Doctors Signatures"],
    title: "Pathologist and doctor signatures",
    body: "Upload and manage digital signatures for pathologists and authorising doctors. Signatures are stamped automatically on electronically authorised reports.",
    placeholders: ["Signature upload", "Doctor assignment", "Report stamp settings"],
  },

  /* ── Lab Management Master › Edit Masters ── */
  "lab-em-edit-doctor-master": {
    breadcrumb: ["Lab Management Master", "Edit Masters", "Edit Doctor Master"],
    title: "Amend doctor records",
    body: "Search and update existing doctor profiles — contact details, specialisation, rate card, or commission structure — with a full audit trail of each change.",
    placeholders: ["Doctor search & filter", "Field-level editing", "Audit trail"],
  },
  "lab-em-edit-test-rate": {
    breadcrumb: ["Lab Management Master", "Edit Masters", "Edit Test Rate"],
    title: "Revise test pricing",
    body: "Locate tests across any rate list and apply bulk or individual price corrections. Every change is version-stamped, preserving the historical rate for existing orders.",
    placeholders: ["Test & rate list search", "Bulk price update", "Version history"],
  },
  "lab-em-edit-normal-values": {
    breadcrumb: ["Lab Management Master", "Edit Masters", "Edit Normal Values"],
    title: "Update reference ranges",
    body: "Review and revise normal value ranges by test, age group, and gender. Effective dates ensure that existing authorised reports are unaffected by future range changes.",
    placeholders: ["Test & age group search", "Range editing", "Effective date control"],
  },

  /* ── Lab Management Master › Preparation Charges ── */
  "lab-pc-dr-wise": {
    breadcrumb: ["Lab Management Master", "Preparation Charges", "Prep. Charges (Dr. Wise)"],
    title: "Doctor-wise preparation charges",
    body: "Define preparation surcharges specific to referring doctors. These charges are applied automatically during registration when a matching doctor is selected.",
    placeholders: ["Doctor selection", "Charge code & amount", "Override conditions"],
  },
  "lab-pc-test-wise": {
    breadcrumb: ["Lab Management Master", "Preparation Charges", "Prep. Charges (Test Wise)"],
    title: "Test-wise preparation charges",
    body: "Attach preparation fees to individual tests (e.g. cold-chain kits, special media). Charges are triggered whenever the associated test appears on an order.",
    placeholders: ["Test code lookup", "Charge amount", "Specimen condition rules"],
  },
  "lab-pc-franchisee": {
    breadcrumb: ["Lab Management Master", "Preparation Charges", "Prep. Charges (Franchisee)"],
    title: "Franchisee preparation charges",
    body: "Set preparation surcharges applicable when samples originate from specific franchise partners, allowing differentiated cost structures per collection point.",
    placeholders: ["Franchisee selection", "Charge schedule", "Settlement impact"],
  },
  "lab-pc-dept-wise": {
    breadcrumb: ["Lab Management Master", "Preparation Charges", "Prep. Charges (Dept Wise)"],
    title: "Department-wise preparation charges",
    body: "Apply preparation levies at the department level (e.g. histopathology, cytology) to cover department-specific consumables and processing overhead.",
    placeholders: ["Department selection", "Levy amount", "Invoice line display"],
  },

  /* ── Lab Management Master › Outsourcing ── */
  "lab-os-outsourced-investigation": {
    breadcrumb: ["Lab Management Master", "Outsourcing", "Outsourced Investigation"],
    title: "Outsourced test definitions",
    body: "Map your internal test codes to the codes used by partner reference laboratories. Configure send-out rules, expected TAT, and cost per test for each referral lab.",
    placeholders: ["Internal → partner code map", "Referral lab assignment", "Cost & TAT settings"],
  },
  "lab-os-specimen-types": {
    breadcrumb: ["Lab Management Master", "Outsourcing", "Specimen Types"],
    title: "Specimen type catalogue",
    body: "Define all specimen types (serum, EDTA blood, urine, swab, etc.) with container details, storage conditions, and stability windows used in outsourcing logistics.",
    placeholders: ["Specimen code & name", "Container & volume", "Stability & transport conditions"],
  },

  /* ── Accounting System Master ── */
  "acc-company-master": {
    breadcrumb: ["Accounting System Master", "Company Master"],
    title: "Legal entity and branch details",
    body: "Store the organisation's registered name, GST / tax identifiers, bank accounts, and branch locations. This information prints on invoices, receipts, and statutory reports.",
    placeholders: ["Company & branch profiles", "Bank accounts", "Tax registration details"],
  },
  "acc-financial-years": {
    breadcrumb: ["Accounting System Master", "Financial Years"],
    title: "Accounting period configuration",
    body: "Open, close, and manage financial years and periods. Lock prior periods to prevent back-dating and set the active year that all new transactions default to.",
    placeholders: ["Year & period calendar", "Lock / unlock controls", "Opening balance import"],
  },
  "acc-balance-sheet-groups": {
    breadcrumb: ["Accounting System Master", "Balance Sheet Groups"],
    title: "Chart of accounts grouping",
    body: "Organise ledger accounts into balance-sheet categories (assets, liabilities, equity) and P&L groups (income, expenditure). The hierarchy defined here drives all financial statements.",
    placeholders: ["Group hierarchy tree", "Statutory mapping", "Reporting labels"],
  },
  "acc-account-master": {
    breadcrumb: ["Accounting System Master", "Account Master"],
    title: "Individual ledger accounts",
    body: "Create and maintain the full chart of accounts — opening balances, account types, currency, and the parent group each account rolls into for reporting.",
    placeholders: ["Account code & name", "Opening balances", "Currency & type settings"],
  },

  /* ── Other Masters ── */
  "other-sender-master": {
    breadcrumb: ["Other Masters", "Sender Master"],
    title: "Referring sender directory",
    body: "Maintain the list of doctors, clinics, and collection centres that refer samples to your laboratory. Link senders to rate cards and commission structures for automated settlement.",
    placeholders: ["Sender profiles", "Rate card linkage", "Commission rules"],
  },
  "other-address-book": {
    breadcrumb: ["Other Masters", "Address Book"],
    title: "Contacts and delivery addresses",
    body: "Store addresses for patients, couriers, partner labs, and vendors. Entries here are available as auto-complete options across registration, dispatch, and procurement modules.",
    placeholders: ["Contact directory", "Delivery point mapping", "Pincode validation"],
  },
  "other-note-book": {
    breadcrumb: ["Other Masters", "Note Book"],
    title: "Shared notes and observations",
    body: "Keep a collaborative notebook for lab-wide announcements, QC observations, or operational reminders that need to be visible across teams and shifts.",
    placeholders: ["Pinned announcements", "QC observation log", "Shift handover notes"],
  },
};

function CompanyMastersContent() {
  const searchParams = useSearchParams();
  const tab = useMemo(() => normalizeTabParam(searchParams.get("tab")), [searchParams]);
  const panel = useMemo(() => panels[tab] ?? panels["lab-mm-tests"], [tab]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[#dfe4ef] bg-[#f3f5fa] px-6 py-4 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.65)]">
        <div>
          <h1 className="text-base font-bold text-zinc-900">Masters</h1>
          <p className="mt-1 text-xs text-zinc-700">
            <span className="font-semibold text-zinc-900">{panel.breadcrumb.join(" · ")}</span>
            <span className="text-zinc-600"> · Switch from the Masters menu in the sidebar.</span>
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
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

export default function CompanyMastersPage() {
  return (
    <Suspense>
      <CompanyMastersContent />
    </Suspense>
  );
}
