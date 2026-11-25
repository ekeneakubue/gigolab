import { redirect } from "next/navigation";

export default function CompanyUsersPage() {
  redirect("/company/administrations?tab=users");
}
