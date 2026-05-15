import CompanySidebar from "../components/CompanySidebar";

export default function CompanyPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#eef1f6] font-sans text-zinc-900">
      <CompanySidebar />
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
