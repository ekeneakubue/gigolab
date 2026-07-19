/** Transaction submenu items for the company portal sidebar and `/company/transactions` workspace. */
export const COMPANY_TRANSACTION_MENU = [
  { label: "Registration", tab: "registration" },
  { label: "Transfer", tab: "transfer" },
  { label: "Reports Receipts Entry", tab: "reports-receipts-entry" },
  { label: "Reports Despatch Entry", tab: "reports-despatch-entry" },
  { label: "Bar Code Management", tab: "bar-code-management" },
  { label: "Expenses Entry", tab: "expenses-entry" },
  { label: "Cash RCVD From Operators", tab: "cash-rcvd-from-operators" },
  { label: "Registration Rate Split", tab: "registration-rate-split" },
  { label: "Registration - Outsourced", tab: "registration-outsourced" },
  { label: "Payments - Outsourced", tab: "payments-outsourced" },
  { label: "Patient Queue", tab: "patient-queue" },
  { label: "Sample/Appointment Booking", tab: "sample-appointment-booking" },
  { label: "Test Wise NABH Entries", tab: "test-wise-nabh-entries" },
] as const;

export type CompanyTransactionTab = (typeof COMPANY_TRANSACTION_MENU)[number]["tab"];
