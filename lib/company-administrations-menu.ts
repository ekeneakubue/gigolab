/** Administrations submenu items for the company portal sidebar and `/company/administrations` workspace. */
export const COMPANY_ADMINISTRATIONS_MENU = [
  { label: "Users", tab: "users" },
  { label: "Roles", tab: "roles" },
  { label: "Patients", tab: "patients" },
  { label: "Branches", tab: "branches" },
  { label: "Departments", tab: "departments" },
] as const;

export type CompanyAdministrationsTab = (typeof COMPANY_ADMINISTRATIONS_MENU)[number]["tab"];

export const COMPANY_ADMINISTRATIONS_TAB_VALUES = COMPANY_ADMINISTRATIONS_MENU.map(
  (item) => item.tab,
);
