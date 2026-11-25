import type { Metadata } from "next";

import AdminRolesPageClient from "./roles-page-client";

export const metadata: Metadata = { title: "Roles — Gigolab Admin" };

export default function AdminRolesPage() {
  return <AdminRolesPageClient />;
}
