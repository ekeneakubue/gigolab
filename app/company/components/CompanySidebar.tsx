"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type CSSProperties } from "react";

import { COMPANY_MASTERS_MENU } from "@/lib/company-masters-menu";
import { COMPANY_REPORTS_MENU } from "@/lib/company-reports-menu";
import { COMPANY_TRANSACTION_MENU } from "@/lib/company-transaction-menu";

import { useFlyoutPosition } from "./use-flyout-position";

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
    hasSubmenu: true,
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
    hasSubmenu: true,
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
    hasSubmenu: true,
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
  const searchParams = useSearchParams();
  const [company, setCompany] = useState<CompanySession | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [, startTransition] = useTransition();
  const [transactionsOpen, setTransactionsOpen] = useState(false);
  const transactionsWrapRef = useRef<HTMLDivElement>(null);
  const transactionsButtonRef = useRef<HTMLButtonElement>(null);
  const transactionsPopoverStyle = useFlyoutPosition(transactionsOpen, transactionsButtonRef);

  const [reportsOpen, setReportsOpen] = useState(false);
  const reportsWrapRef = useRef<HTMLDivElement>(null);
  const reportsButtonRef = useRef<HTMLButtonElement>(null);
  const reportsPopoverStyle = useFlyoutPosition(reportsOpen, reportsButtonRef);
  const [reportSubMenuState, setReportSubMenuState] = useState<{
    itemTab: string;
    style: CSSProperties;
  } | null>(null);
  const reportSubMenuRef = useRef<HTMLDivElement>(null);

  const [mastersOpen, setMastersOpen] = useState(false);
  const mastersWrapRef = useRef<HTMLDivElement>(null);
  const mastersButtonRef = useRef<HTMLButtonElement>(null);
  const mastersPopoverStyle = useFlyoutPosition(mastersOpen, mastersButtonRef);
  const mastersPopoverRef = useRef<HTMLDivElement>(null);
  const [masterSubMenuState, setMasterSubMenuState] = useState<{
    groupTab: string;
    style: CSSProperties;
  } | null>(null);
  const masterSubMenuRef = useRef<HTMLDivElement>(null);
  const [masterSubSubMenuState, setMasterSubSubMenuState] = useState<{
    parentTab: string;
    style: CSSProperties;
  } | null>(null);
  const masterSubSubMenuRef = useRef<HTMLDivElement>(null);

  const openTransactionsMenu = () => {
    setMastersOpen(false);
    setReportsOpen(false);
    setTransactionsOpen((v) => !v);
  };

  const openReportsMenu = () => {
    setMastersOpen(false);
    setTransactionsOpen(false);
    setReportsOpen((v) => !v);
  };

  const openMastersMenu = () => {
    setTransactionsOpen(false);
    setReportsOpen(false);
    setMastersOpen((v) => !v);
  };

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

  useEffect(() => {
    if (!transactionsOpen && !reportsOpen && !mastersOpen) return;

    function onDocMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      const tx = transactionsWrapRef.current;
      const rp = reportsWrapRef.current;
      const ms = mastersWrapRef.current;
      if (transactionsOpen && tx && !tx.contains(target)) {
        setTransactionsOpen(false);
      }
      if (reportsOpen && rp && !rp.contains(target)) {
        setReportsOpen(false);
      }
      if (mastersOpen && ms && !ms.contains(target)) {
        setMastersOpen(false);
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setTransactionsOpen(false);
        setReportsOpen(false);
        setMastersOpen(false);
      }
    }

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [transactionsOpen, reportsOpen, mastersOpen]);

  useEffect(() => {
    setTransactionsOpen(false);
    setReportsOpen(false);
    setMastersOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mastersOpen) setMasterSubMenuState(null);
  }, [mastersOpen]);

  useEffect(() => {
    if (!reportsOpen) setReportSubMenuState(null);
  }, [reportsOpen]);

  useEffect(() => {
    setMasterSubSubMenuState(null);
  }, [masterSubMenuState]);

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

          if (item.label === "Masters" && item.hasSubmenu) {
            const mastersActive = pathname.startsWith("/company/masters");
            const currentMasterTab = searchParams.get("tab");
            return (
              <div key={item.href} className="relative" ref={mastersWrapRef}>
                <button
                  ref={mastersButtonRef}
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={mastersOpen}
                  onClick={openMastersMenu}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-150 ${
                    mastersActive || mastersOpen
                      ? "bg-white text-zinc-900 shadow-[0_12px_26px_-18px_rgba(15,23,42,0.7)] ring-1 ring-[#dfe4ef]"
                      : "text-zinc-700 hover:bg-white/80 hover:text-zinc-900"
                  }`}
                >
                  <span
                    className={`shrink-0 transition-colors ${
                      mastersActive || mastersOpen
                        ? item.iconActive
                        : `${item.iconColor} group-hover:opacity-100 opacity-90`
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                  {mastersActive ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" /> : null}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className={`ml-auto h-4 w-4 shrink-0 text-zinc-500 transition-transform ${mastersOpen ? "rotate-90" : "-rotate-90"}`}
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {mastersOpen && mastersPopoverStyle ? (
                  <div
                    ref={mastersPopoverRef}
                    role="menu"
                    aria-label="Master categories"
                    style={mastersPopoverStyle}
                    className="z-100 w-max min-w-52 max-w-[min(20rem,calc(100vw-5rem))] overflow-y-auto overflow-x-hidden rounded-xl border border-[#dfe4ef] bg-white py-1 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.55)]"
                  >
                    {COMPANY_MASTERS_MENU.map((group) => {
                      const isGroupActive =
                        mastersActive && group.children.some((c) => c.tab === currentMasterTab);
                      const isSubOpen = masterSubMenuState?.groupTab === group.tab;
                      return (
                        <div key={group.tab}>
                          <button
                            type="button"
                            onClick={(e) => {
                              if (isSubOpen) {
                                setMasterSubMenuState(null);
                                return;
                              }
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              const gap = 4;
                              const estimatedWidth = 220;
                              let left = rect.right + gap;
                              if (left + estimatedWidth > window.innerWidth - gap) {
                                left = Math.max(gap, rect.left - estimatedWidth - gap);
                              }
                              setMasterSubMenuState({
                                groupTab: group.tab,
                                style: { position: "fixed", top: Math.max(8, rect.top), left },
                              });
                            }}
                            className={`flex w-full items-center gap-1.5 px-3 py-2.5 text-left text-xs font-medium transition-colors hover:bg-emerald-50 hover:text-zinc-950 ${
                              isGroupActive || isSubOpen
                                ? "bg-emerald-50 text-emerald-950 font-semibold"
                                : "text-zinc-800"
                            }`}
                          >
                            <span className="flex-1">{group.label}</span>
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              className={`h-3 w-3 shrink-0 text-zinc-400 transition-transform ${isSubOpen ? "rotate-90" : ""}`}
                              aria-hidden
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {mastersOpen && masterSubMenuState ? (
                  <div
                    ref={masterSubMenuRef}
                    role="menu"
                    aria-label="Master sub-items"
                    style={masterSubMenuState.style}
                    className="z-110 w-max min-w-48 max-w-[min(18rem,calc(100vw-5rem))] overflow-y-auto overflow-x-hidden rounded-xl border border-[#dfe4ef] bg-white py-1 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.55)]"
                  >
                    {COMPANY_MASTERS_MENU.find(
                      (m) => m.tab === masterSubMenuState.groupTab,
                    )?.children.map((child) => {
                      type WithKids = { children: readonly { tab: string }[] };
                      const hasGrandchildren = "children" in child;
                      const grandchildren = hasGrandchildren
                        ? (child as unknown as WithKids).children
                        : [];
                      const isSubSubOpen = masterSubSubMenuState?.parentTab === child.tab;
                      const isChildActive =
                        mastersActive &&
                        (hasGrandchildren
                          ? grandchildren.some((gc) => gc.tab === currentMasterTab)
                          : child.tab === currentMasterTab);
                      return (
                        <button
                          key={child.tab}
                          type="button"
                          role="menuitem"
                          onClick={(e) => {
                            if (hasGrandchildren) {
                              if (isSubSubOpen) {
                                setMasterSubSubMenuState(null);
                                return;
                              }
                              const rect = (
                                e.currentTarget as HTMLElement
                              ).getBoundingClientRect();
                              const gap = 4;
                              const estimatedWidth = 210;
                              let left = rect.right + gap;
                              if (left + estimatedWidth > window.innerWidth - gap) {
                                left = Math.max(gap, rect.left - estimatedWidth - gap);
                              }
                              setMasterSubSubMenuState({
                                parentTab: child.tab,
                                style: {
                                  position: "fixed",
                                  top: Math.max(8, rect.top),
                                  left,
                                },
                              });
                            } else {
                              setMastersOpen(false);
                              setMasterSubMenuState(null);
                              startTransition(() => {
                                router.push(`/company/masters?tab=${child.tab}`);
                              });
                            }
                          }}
                          className={`flex w-full items-center gap-1.5 px-3 py-2.5 text-left text-xs font-medium transition-colors hover:bg-emerald-50 hover:text-zinc-950 ${
                            isChildActive || isSubSubOpen
                              ? "bg-emerald-50 text-emerald-950 font-semibold"
                              : "text-zinc-800"
                          }`}
                        >
                          <span className="flex-1">{child.label}</span>
                          {hasGrandchildren && (
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              className={`h-3 w-3 shrink-0 text-zinc-400 transition-transform ${isSubSubOpen ? "rotate-90" : ""}`}
                              aria-hidden
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 6l6 6-6 6"
                              />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {mastersOpen && masterSubMenuState && masterSubSubMenuState ? (
                  <div
                    ref={masterSubSubMenuRef}
                    role="menu"
                    aria-label="Master leaf items"
                    style={masterSubSubMenuState.style}
                    className="z-120 w-max min-w-44 max-w-[min(18rem,calc(100vw-5rem))] overflow-y-auto overflow-x-hidden rounded-xl border border-[#dfe4ef] bg-white py-1 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.55)]"
                  >
                    {(() => {
                      const group = COMPANY_MASTERS_MENU.find(
                        (m) => m.tab === masterSubMenuState.groupTab,
                      );
                      const parent = group?.children.find(
                        (c) => c.tab === masterSubSubMenuState.parentTab,
                      );
                      const leaves =
                        parent && "children" in parent
                          ? (
                              parent as unknown as {
                                children: readonly { label: string; tab: string }[];
                              }
                            ).children
                          : [];
                      return leaves.map((leaf) => (
                        <button
                          key={leaf.tab}
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setMastersOpen(false);
                            setMasterSubMenuState(null);
                            setMasterSubSubMenuState(null);
                            startTransition(() => {
                              router.push(`/company/masters?tab=${leaf.tab}`);
                            });
                          }}
                          className={`flex w-full px-3 py-2.5 text-left text-xs font-medium transition-colors hover:bg-emerald-50 hover:text-zinc-950 ${
                            mastersActive && currentMasterTab === leaf.tab
                              ? "bg-emerald-50 text-emerald-950 font-semibold"
                              : "text-zinc-800"
                          }`}
                        >
                          {leaf.label}
                        </button>
                      ));
                    })()}
                  </div>
                ) : null}
              </div>
            );
          }

          if (item.label === "Transactions" && item.hasSubmenu) {
            const txActive = pathname.startsWith("/company/transactions");
            const currentTab = searchParams.get("tab");
            return (
              <div key={item.href} className="relative" ref={transactionsWrapRef}>
                <button
                  ref={transactionsButtonRef}
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={transactionsOpen}
                  onClick={openTransactionsMenu}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-150 ${
                    txActive || transactionsOpen
                      ? "bg-white text-zinc-900 shadow-[0_12px_26px_-18px_rgba(15,23,42,0.7)] ring-1 ring-[#dfe4ef]"
                      : "text-zinc-700 hover:bg-white/80 hover:text-zinc-900"
                  }`}
                >
                  <span
                    className={`shrink-0 transition-colors ${
                      txActive || transactionsOpen
                        ? item.iconActive
                        : `${item.iconColor} group-hover:opacity-100 opacity-90`
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                  {txActive ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" /> : null}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className={`ml-auto h-4 w-4 shrink-0 text-zinc-500 transition-transform ${transactionsOpen ? "rotate-90" : "-rotate-90"}`}
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {transactionsOpen && transactionsPopoverStyle ? (
                  <div
                    role="menu"
                    aria-label="Transaction types"
                    style={transactionsPopoverStyle}
                    className="z-100 w-max min-w-52 max-w-[min(20rem,calc(100vw-5rem))] overflow-y-auto overflow-x-hidden rounded-xl border border-[#dfe4ef] bg-white py-1 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.55)]"
                  >
                    {COMPANY_TRANSACTION_MENU.map((entry) => (
                      <button
                        key={entry.tab}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setTransactionsOpen(false);
                          startTransition(() => {
                            router.push(`/company/transactions?tab=${entry.tab}`);
                          });
                        }}
                        className={`flex w-full px-3 py-2.5 text-left text-xs font-medium transition-colors hover:bg-emerald-50 hover:text-zinc-950 ${
                          txActive && (currentTab ?? "registration") === entry.tab
                            ? "bg-emerald-50 text-emerald-950 font-semibold"
                            : "text-zinc-800"
                        }`}
                      >
                        {entry.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          }

          if (item.label === "Reports" && item.hasSubmenu) {
            const reportsActive = pathname.startsWith("/company/reports");
            const currentReportTab = searchParams.get("tab");
            return (
              <div key={item.href} className="relative" ref={reportsWrapRef}>
                <button
                  ref={reportsButtonRef}
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={reportsOpen}
                  onClick={openReportsMenu}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-150 ${
                    reportsActive || reportsOpen
                      ? "bg-white text-zinc-900 shadow-[0_12px_26px_-18px_rgba(15,23,42,0.7)] ring-1 ring-[#dfe4ef]"
                      : "text-zinc-700 hover:bg-white/80 hover:text-zinc-900"
                  }`}
                >
                  <span
                    className={`shrink-0 transition-colors ${
                      reportsActive || reportsOpen
                        ? item.iconActive
                        : `${item.iconColor} group-hover:opacity-100 opacity-90`
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                  {reportsActive ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" /> : null}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className={`ml-auto h-4 w-4 shrink-0 text-zinc-500 transition-transform ${reportsOpen ? "rotate-90" : "-rotate-90"}`}
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {reportsOpen && reportsPopoverStyle ? (
                  <div
                    role="menu"
                    aria-label="Report categories"
                    style={reportsPopoverStyle}
                    className="z-100 w-max min-w-52 max-w-[min(20rem,calc(100vw-5rem))] overflow-y-auto overflow-x-hidden rounded-xl border border-[#dfe4ef] bg-white py-1 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.55)]"
                  >
                    {COMPANY_REPORTS_MENU.map((entry) => {
                      type WithKids = { children: readonly { tab: string }[] };
                      const hasChildren = "children" in entry;
                      const children = hasChildren
                        ? (entry as unknown as WithKids).children
                        : [];
                      const isSubOpen = reportSubMenuState?.itemTab === entry.tab;
                      const isEntryActive =
                        reportsActive &&
                        (hasChildren
                          ? children.some((c) => c.tab === currentReportTab)
                          : entry.tab === currentReportTab);
                      return (
                        <button
                          key={entry.tab}
                          type="button"
                          role="menuitem"
                          onClick={(e) => {
                            if (hasChildren) {
                              if (isSubOpen) {
                                setReportSubMenuState(null);
                                return;
                              }
                              const rect = (
                                e.currentTarget as HTMLElement
                              ).getBoundingClientRect();
                              const gap = 4;
                              const estimatedWidth = 240;
                              let left = rect.right + gap;
                              if (left + estimatedWidth > window.innerWidth - gap) {
                                left = Math.max(gap, rect.left - estimatedWidth - gap);
                              }
                              setReportSubMenuState({
                                itemTab: entry.tab,
                                style: {
                                  position: "fixed",
                                  top: Math.max(8, rect.top),
                                  left,
                                },
                              });
                            } else {
                              setReportsOpen(false);
                              startTransition(() => {
                                router.push(`/company/reports?tab=${entry.tab}`);
                              });
                            }
                          }}
                          className={`flex w-full items-center gap-1.5 px-3 py-2.5 text-left text-xs font-medium transition-colors hover:bg-emerald-50 hover:text-zinc-950 ${
                            isEntryActive || isSubOpen
                              ? "bg-emerald-50 text-emerald-950 font-semibold"
                              : "text-zinc-800"
                          }`}
                        >
                          <span className="flex-1">{entry.label}</span>
                          {hasChildren && (
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              className={`h-3 w-3 shrink-0 text-zinc-400 transition-transform ${isSubOpen ? "rotate-90" : ""}`}
                              aria-hidden
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 6l6 6-6 6"
                              />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {reportsOpen && reportSubMenuState ? (
                  <div
                    ref={reportSubMenuRef}
                    role="menu"
                    aria-label="Report sub-items"
                    style={reportSubMenuState.style}
                    className="z-110 w-max overflow-y-auto overflow-x-hidden rounded-xl border border-[#dfe4ef] bg-white py-1 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.55)]"
                  >
                    {(() => {
                      const parent = COMPANY_REPORTS_MENU.find(
                        (m) => m.tab === reportSubMenuState.itemTab,
                      );
                      const leaves =
                        parent && "children" in parent
                          ? (
                              parent as unknown as {
                                children: readonly { label: string; tab: string }[];
                              }
                            ).children
                          : [];
                      return (
                        <div className="grid grid-cols-2">
                          {leaves.map((leaf) => (
                            <button
                              key={leaf.tab}
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setReportsOpen(false);
                                setReportSubMenuState(null);
                                startTransition(() => {
                                  router.push(`/company/reports?tab=${leaf.tab}`);
                                });
                              }}
                              className={`flex w-full px-3 py-2.5 text-left text-xs font-medium transition-colors hover:bg-emerald-50 hover:text-zinc-950 ${
                                reportsActive && currentReportTab === leaf.tab
                                  ? "bg-emerald-50 text-emerald-950 font-semibold"
                                  : "text-zinc-800"
                              }`}
                            >
                              {leaf.label}
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                ) : null}
              </div>
            );
          }

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
