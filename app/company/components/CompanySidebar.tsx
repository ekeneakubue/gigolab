"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type CompanySession = {
  companyId: string;
  code: string;
  name: string;
  initials: string;
  logoUrl: string | null;
};

const navItems = [
  {
    label: "Overview",
    href: "/company",
    iconColor: "text-emerald-600",
    iconActive: "text-emerald-700",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: "Users",
    href: "/company/users",
    iconColor: "text-indigo-600",
    iconActive: "text-indigo-700",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Masters",
    href: "/company/masters",
    iconColor: "text-violet-600",
    iconActive: "text-violet-700",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9h8M8 12h8M8 15h5" />
      </svg>
    ),
  },
  {
    label: "Transactions",
    href: "/company/transactions",
    iconColor: "text-blue-600",
    iconActive: "text-blue-700",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h11M7 7l3-3M7 7l3 3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17H6M17 17l-3-3M17 17l-3 3" />
      </svg>
    ),
  },
  {
    label: "Reports",
    href: "/company/reports",
    iconColor: "text-amber-600",
    iconActive: "text-amber-700",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 13H8M16 17H8M10 9H8" />
      </svg>
    ),
  },
  {
    label: "Utilities",
    href: "/company/utilities",
    iconColor: "text-teal-600",
    iconActive: "text-teal-700",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 0 0 1.4 0l1-1a1 1 0 0 1 1.4 0l.2.2a1 1 0 0 1 0 1.4l-1 1a1 1 0 0 0 0 1.4l.4.4a1 1 0 0 0 1.1.22l1.3-.55a1 1 0 0 1 1.3.54l.1.28a1 1 0 0 1-.54 1.3l-1.3.55a1 1 0 0 0-.6.94v.56a1 1 0 0 0 .6.93l1.3.56a1 1 0 0 1 .54 1.3l-.1.28a1 1 0 0 1-1.3.54l-1.3-.55a1 1 0 0 0-1.1.22l-.4.4a1 1 0 0 0 0 1.4l1 1a1 1 0 0 1 0 1.4l-.2.2a1 1 0 0 1-1.4 0l-1-1a1 1 0 0 0-1.4 0l-.4.4a1 1 0 0 0-.22 1.1l.55 1.3a1 1 0 0 1-.54 1.3l-.28.1a1 1 0 0 1-1.3-.54l-.56-1.3a1 1 0 0 0-.93-.6h-.56a1 1 0 0 0-.94.6l-.55 1.3a1 1 0 0 1-1.3.54l-.28-.1a1 1 0 0 1-.54-1.3l.55-1.3a1 1 0 0 0-.22-1.1l-.4-.4a1 1 0 0 0-1.4 0l-1 1a1 1 0 0 1-1.4 0l-.2-.2a1 1 0 0 1 0-1.4l1-1a1 1 0 0 0 0-1.4l-.4-.4a1 1 0 0 0-1.1-.22l-1.3.55a1 1 0 0 1-1.3-.54l-.1-.28a1 1 0 0 1 .54-1.3l1.3-.56a1 1 0 0 0 .6-.93v-.56a1 1 0 0 0-.6-.94l-1.3-.55a1 1 0 0 1-.54-1.3l.1-.28a1 1 0 0 1 1.3-.54l1.3.55a1 1 0 0 0 1.1-.22l.4-.4a1 1 0 0 0 0-1.4l-1-1a1 1 0 0 1 0-1.4l.2-.2a1 1 0 0 1 1.4 0l1 1a1 1 0 0 0 1.4 0l.4-.4a1 1 0 0 0 .22-1.1l-.55-1.3a1 1 0 0 1 .54-1.3l.28-.1a1 1 0 0 1 1.3.54l.55 1.3a1 1 0 0 0 .94.6h.56a1 1 0 0 0 .93-.6l.56-1.3a1 1 0 0 1 1.3-.54l.28.1a1 1 0 0 1 .54 1.3l-.55 1.3a1 1 0 0 0 .22 1.1z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    ),
  },
];

export default function CompanySidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [company, setCompany] = useState<CompanySession | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const response = await fetch("/api/company/auth/session");
        if (cancelled) return;
        if (!response.ok) {
          setCompany(null);
          return;
        }
        const data = (await response.json()) as { company: CompanySession | null };
        if (!cancelled) setCompany(data.company);
      } catch {
        if (!cancelled) setCompany(null);
      }
    }

    loadSession();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const signOut = async () => {
    setIsSigningOut(true);
    try {
      await fetch("/api/company/auth/logout", { method: "POST" });
      startTransition(() => {
        router.push("/company/login");
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-[#dfe4ef] bg-[#f3f5fa] shadow-[0_14px_38px_-28px_rgba(15,23,42,0.45)]">
      <div className="flex items-center gap-3 border-b border-[#e7ebf4] px-5 py-5">
        {company?.logoUrl ? (
          <img
            src={company.logoUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-xl object-cover shadow-[0_10px_22px_-14px_rgba(15,23,42,0.65)] ring-1 ring-[#dfe4ef]"
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1f2937] text-sm font-bold text-white shadow-[0_10px_22px_-14px_rgba(15,23,42,0.65)]">
            {company?.initials ?? "—"}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold text-zinc-900 leading-tight truncate">
            {company?.name ?? "Your lab"}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wider leading-tight text-zinc-600 truncate font-mono">
            {company?.code ?? "Company portal"}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
          Workspace
        </p>
        {navItems.map((item) => {
          const isActive =
            item.href === "/company"
              ? pathname === "/company"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-white text-zinc-900 shadow-[0_12px_26px_-18px_rgba(15,23,42,0.7)] ring-1 ring-[#dfe4ef]"
                  : "text-zinc-700 hover:bg-white/80 hover:text-zinc-900"
              }`}
            >
              <span
                className={`shrink-0 transition-colors ${
                  isActive ? item.iconActive : `${item.iconColor} group-hover:opacity-100 opacity-90`
                }`}
              >
                {item.icon}
              </span>
              {item.label}
              {isActive ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#e7ebf4] px-3 py-4 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 shrink-0 text-sky-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7 7-7M3 12h18" />
          </svg>
          Back to site
        </Link>
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-700 text-xs font-bold">
            {company?.initials ?? "—"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-800 truncate">
              {company?.name ?? "Your lab"}
            </p>
            <p className="text-xs text-zinc-600 truncate font-mono">
              {company?.code ?? "Not signed in"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={signOut}
          disabled={isSigningOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-white hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 shrink-0 text-rose-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          {isSigningOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </aside>
  );
}
