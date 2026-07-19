/**
 * Masters menu tree for the company portal sidebar and `/company/masters` workspace.
 *
 * Structure:
 *   L1 – top group  (e.g. "Lab Management Master")
 *   L2 – section    (e.g. "Main Master")          – may have L3 children
 *   L3 – leaf item  (e.g. "Tests")                – always a navigable page
 *
 * Accounting System Master and Other Masters are only two levels deep (L1 → L3 directly).
 */
export const COMPANY_MASTERS_MENU = [
  {
    label: "Lab Management Master",
    tab: "lab-management-master",
    children: [
      {
        label: "Main Master",
        tab: "lab-main-master",
        children: [
          { label: "Tests", tab: "lab-mm-tests" },
          { label: "Doctors", tab: "lab-mm-doctors" },
          { label: "Departments", tab: "lab-mm-departments" },
          { label: "Age Groups", tab: "lab-mm-age-groups" },
          { label: "Packages", tab: "lab-mm-packages" },
          { label: "Rate Lists", tab: "lab-mm-rate-lists" },
          { label: "Members", tab: "lab-mm-members" },
          { label: "Antibiotic Master", tab: "lab-mm-antibiotic-master" },
          { label: "Disease / DOT Category", tab: "lab-mm-disease-dot-category" },
          { label: "Interpretation / Comments", tab: "lab-mm-interpretation-comments" },
          { label: "Franchisee Master", tab: "lab-mm-franchisee-master" },
          { label: "Collection Center Master", tab: "lab-mm-collection-center-master" },
          { label: "USG Types in Pregnancy", tab: "lab-mm-usg-types-pregnancy" },
          { label: "Outsider Master", tab: "lab-mm-outsider-master" },
          { label: "Titles", tab: "lab-mm-titles" },
          { label: "Firm Master", tab: "lab-mm-firm-master" },
          { label: "Room Master", tab: "lab-mm-room-master" },
        ],
      },
      {
        label: "Configuration Settings",
        tab: "lab-configuration-settings",
        children: [
          { label: "Lab Controller Options", tab: "lab-cs-controller-options" },
          { label: "Lab Setup Options", tab: "lab-cs-setup-options" },
          { label: "Email Settings", tab: "lab-cs-email-settings" },
          { label: "Doctors Signatures", tab: "lab-cs-doctors-signatures" },
        ],
      },
      {
        label: "Edit Masters",
        tab: "lab-edit-masters",
        children: [
          { label: "Edit Doctor Master", tab: "lab-em-edit-doctor-master" },
          { label: "Edit Test Rate", tab: "lab-em-edit-test-rate" },
          { label: "Edit Normal Values", tab: "lab-em-edit-normal-values" },
        ],
      },
      {
        label: "Preparation Charges",
        tab: "lab-preparation-charges",
        children: [
          { label: "Prep. Charges (Dr. Wise)", tab: "lab-pc-dr-wise" },
          { label: "Prep. Charges (Test Wise)", tab: "lab-pc-test-wise" },
          { label: "Prep. Charges (Franchisee)", tab: "lab-pc-franchisee" },
          { label: "Prep. Charges (Dept Wise)", tab: "lab-pc-dept-wise" },
        ],
      },
      {
        label: "Outsourcing",
        tab: "lab-outsourcing",
        children: [
          { label: "Outsourced Investigation", tab: "lab-os-outsourced-investigation" },
          { label: "Specimen Types", tab: "lab-os-specimen-types" },
        ],
      },
    ],
  },
  {
    label: "Accounting System Master",
    tab: "accounting-system-master",
    children: [
      { label: "Company Master", tab: "acc-company-master" },
      { label: "Financial Years", tab: "acc-financial-years" },
      { label: "Balance Sheet Groups", tab: "acc-balance-sheet-groups" },
      { label: "Account Master", tab: "acc-account-master" },
    ],
  },
  {
    label: "Other Masters",
    tab: "other-masters",
    children: [
      { label: "Sender Master", tab: "other-sender-master" },
      { label: "Address Book", tab: "other-address-book" },
      { label: "Note Book", tab: "other-note-book" },
    ],
  },
] as const;

export type CompanyMasterGroupTab = (typeof COMPANY_MASTERS_MENU)[number]["tab"];

/** All navigable (leaf) tab values, computed by walking the full tree. */
export const COMPANY_MASTER_TAB_VALUES: string[] = (() => {
  const vals: string[] = [];
  for (const group of COMPANY_MASTERS_MENU) {
    for (const child of group.children) {
      if ("children" in child) {
        for (const gc of (child as { children: readonly { tab: string }[] }).children) {
          vals.push(gc.tab);
        }
      } else {
        vals.push((child as { tab: string }).tab);
      }
    }
  }
  return vals;
})();

export type CompanyMasterTab = string;

export const DEFAULT_COMPANY_MASTER_TAB: string = "lab-mm-tests";
