"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import {
  COMPANY_ADMINISTRATIONS_TAB_VALUES,
  type CompanyAdministrationsTab,
} from "@/lib/company-administrations-menu";

import CompanyBranchesPanel from "./BranchesPanel";
import CompanyDepartmentsPanel from "./DepartmentsPanel";
import CompanyPatientsPanel from "./PatientsPanel";
import CompanyRolesPanel from "./RolesPanel";
import CompanyUsersPanel from "./UsersPanel";

const validTabSet = new Set<string>(COMPANY_ADMINISTRATIONS_TAB_VALUES);

function normalizeTabParam(raw: string | null): CompanyAdministrationsTab {
  if (raw && validTabSet.has(raw)) return raw as CompanyAdministrationsTab;
  return "users";
}

function CompanyAdministrationsContent() {
  const searchParams = useSearchParams();
  const active = useMemo(
    () => normalizeTabParam(searchParams.get("tab")),
    [searchParams],
  );

  if (active === "users") {
    return <CompanyUsersPanel />;
  }

  if (active === "roles") {
    return <CompanyRolesPanel />;
  }

  if (active === "patients") {
    return <CompanyPatientsPanel />;
  }

  if (active === "branches") {
    return <CompanyBranchesPanel />;
  }

  return <CompanyDepartmentsPanel />;
}

export default function CompanyAdministrationsPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-zinc-600">Loading administrations…</div>}>
      <CompanyAdministrationsContent />
    </Suspense>
  );
}
