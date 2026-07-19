/**
 * Reports menu for the company portal sidebar and `/company/reports` workspace.
 *
 * Items with a `children` array open a sub-flyout in the sidebar; their `tab` value is
 * not itself a navigable page.  Leaf items (no `children`) navigate directly.
 */
export const COMPANY_REPORTS_MENU = [
  {
    label: "Daily Reports",
    tab: "daily-reports",
    children: [
      { label: "Collective / Due Report", tab: "dr-collective-due" },
      { label: "Payment Due Report", tab: "dr-payment-due" },
      { label: "List of Patients", tab: "dr-list-patients" },
      { label: "Due Tests", tab: "dr-due-tests" },
      { label: "Login Wise Collection", tab: "dr-login-wise-collection" },
      { label: "Work List for Technician", tab: "dr-work-list-technician" },
      { label: "Diabetic Card Printing", tab: "dr-diabetic-card-printing" },
      { label: "List of Patients (Creditors)", tab: "dr-list-patients-creditors" },
      { label: "List of Patients (Coll. Cntr)", tab: "dr-list-patients-coll-cntr" },
      { label: "List of Patients (Outside)", tab: "dr-list-patients-outside" },
      { label: "Collection - Dept Wise", tab: "dr-collection-dept-wise" },
      { label: "Rate List of Center", tab: "dr-rate-list-center" },
      { label: "Expense Report", tab: "dr-expense-report" },
      { label: "Collection Center Summary", tab: "dr-collection-center-summary" },
      { label: "Form - E Printing", tab: "dr-form-e-printing" },
      { label: "List of Patients (Test Value)", tab: "dr-list-patients-test-value" },
      { label: "Rate Lists Printing", tab: "dr-rate-lists-printing" },
      { label: "List of Patients Mobile No", tab: "dr-list-patients-mobile" },
      { label: "List of Patients Email ID", tab: "dr-list-patients-email" },
      { label: "Patients Appointments", tab: "dr-patients-appointments" },
      { label: "Discounted Rate", tab: "dr-discounted-rate" },
    ],
  },
  { label: "Referral Dr. Reports", tab: "referral-dr-reports" },
  { label: "MIS Reports", tab: "mis-reports" },
  { label: "Prep. Charge Reports", tab: "prep-charge-reports" },
  { label: "Performance Graphics", tab: "performance-graphics" },
  { label: "Multi Dept Reports", tab: "multi-dept-reports" },
  { label: "Other Reports", tab: "other-reports" },
] as const;

export type CompanyReportGroupTab = (typeof COMPANY_REPORTS_MENU)[number]["tab"];

/** All navigable (leaf) tab values. */
export const COMPANY_REPORT_TAB_VALUES: string[] = (() => {
  const vals: string[] = [];
  for (const item of COMPANY_REPORTS_MENU) {
    if ("children" in item) {
      for (const child of (item as { children: readonly { tab: string }[] }).children) {
        vals.push(child.tab);
      }
    } else {
      vals.push((item as { tab: string }).tab);
    }
  }
  return vals;
})();

export type CompanyReportTab = string;
export const DEFAULT_COMPANY_REPORT_TAB: string = "dr-collective-due";
