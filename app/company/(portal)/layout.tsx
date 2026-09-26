import { Suspense } from "react";

import CompanySidebar from "../components/CompanySidebar";

export default function CompanyPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-[#eef1f6] font-sans text-zinc-900">
      <Suspense>
        <CompanySidebar />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden pt-14 md:pt-0">{children}</div>
    </div>
  );
}
