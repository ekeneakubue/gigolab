import type { Metadata } from "next";
import UsersPageClient from "./users-page-client";

export const metadata: Metadata = { title: "Users — Gigolab Admin" };

export default function UsersPage() {
  return <UsersPageClient />;
}
