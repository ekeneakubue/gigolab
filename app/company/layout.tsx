import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Company Portal — Gigolab",
  description: "Operational workspace for company laboratory teams",
};

export default function CompanyRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
