import { Suspense } from "react";

import CompanySidebar from "../components/CompanySidebar";

export default function CompanyPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#eef1f6] font-sans text-zinc-900">
      <Suspense>
        <CompanySidebar />
      </Suspense>
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
