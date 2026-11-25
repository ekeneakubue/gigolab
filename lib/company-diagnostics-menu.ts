/** Diagnostics submenu items for the company portal sidebar and `/company/diagnostics` workspace. */
export const COMPANY_DIAGNOSTICS_MENU = [
  { label: "Test Requests", tab: "test-requests" },
  { label: "Prepare Test Result", tab: "prepare-test-result" },
  { label: "Check Test Result", tab: "check-test-result" },
  { label: "Test Settings", tab: "test-settings" },
] as const;

/** Older feature-module labels that should resolve to the same tabs. */
export const COMPANY_DIAGNOSTICS_LEGACY_MENU = [
  { label: "New Test", tab: "test-requests" },
] as const;

export type CompanyDiagnosticsTab = (typeof COMPANY_DIAGNOSTICS_MENU)[number]["tab"];

export const COMPANY_DIAGNOSTICS_TAB_VALUES = COMPANY_DIAGNOSTICS_MENU.map((item) => item.tab);
