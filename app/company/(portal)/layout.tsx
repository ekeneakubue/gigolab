import { Suspense } from "react";

import { getCompanySession } from "@/lib/company-auth";
import { prisma } from "@/lib/prisma";

import CompanySidebar from "../components/CompanySidebar";

async function loadBrandColor() {
  const session = await getCompanySession();
  if (!session) return null;
  try {
    const company = await prisma.company.findUnique({
      where: { id: session.companyId },
      select: { brandColor: true },
    });
    return company?.brandColor ?? null;
  } catch {
    return null;
  }
}

export default async function CompanyPortalLayout({ children }: { children: React.ReactNode }) {
  const brandColor = await loadBrandColor();

  return (
    <div className="flex h-dvh overflow-hidden bg-[#eef1f6] font-sans text-zinc-900">
      <Suspense>
        <CompanySidebar initialBrandColor={brandColor} />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden pt-14 md:pt-0">{children}</div>
    </div>
  );
}
