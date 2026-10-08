import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — Gigolab",
  description: "Sign in to Gigolab with your email and password to open your dashboard",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
