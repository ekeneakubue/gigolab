import type { Metadata } from "next";

import CompanyProfilePageClient from "./profile-page-client";

export const metadata: Metadata = { title: "Profile — Gigolab" };

export default function CompanyProfilePage() {
  return <CompanyProfilePageClient />;
}
