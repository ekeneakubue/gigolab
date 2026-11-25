/** Insurance submenu items for the company portal sidebar and `/company/insurance` workspace. */
export const COMPANY_INSURANCE_MENU = [
  { label: "Insurance Type", tab: "insurance-type" },
  { label: "Providers", tab: "providers" },
  { label: "Plans", tab: "plans" },
] as const;

export type CompanyInsuranceTab = (typeof COMPANY_INSURANCE_MENU)[number]["tab"];

export const COMPANY_INSURANCE_TAB_VALUES = COMPANY_INSURANCE_MENU.map((item) => item.tab);
