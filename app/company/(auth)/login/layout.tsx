import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Company Sign In — Gigolab",
  description: "Sign in to your lab workspace with your Gigolab lab code and password",
};

export default function CompanyLoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
