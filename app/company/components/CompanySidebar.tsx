"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type CSSProperties, type ReactNode } from "react";

import {
  navFeatureColors,
  navModuleHref,
  navModuleTab,
  type CompanyNavFeature,
  type CompanyNavModule,
} from "@/lib/company-nav";
import {
  brandColorPrefersLightText,
  darkenBrandColor,
  normalizeCompanyBrandColor,
} from "@/lib/company-brand-colors";

import { useFlyoutPosition } from "./use-flyout-position";

type CompanySession = {
  companyId: string;
  code: string;
  name: string;
  initials: string;
  logoUrl: string | null;
  brandColor?: string | null;
  userName?: string | null;
  userInitials?: string | null;
  userImageUrl?: string | null;
  role?: string | null;
};

function FeatureIcon({ name }: { name: string }) {
  const key = name.toLowerCase();
  if (key.includes("overview") || key.includes("dashboard")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  }
  if (key.includes("admin")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
      </svg>
    );
  }
  if (key.includes("diagnostic")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6M10 3v6.5L5.5 18a3 3 0 0 0 2.6 4.5h8a3 3 0 0 0 2.6-4.5L14 9.5V3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 14h7" />
      </svg>
    );
  }
  if (key.includes("pharmacy")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 3.5 3.5 10.5a3 3 0 0 0 0 4.2l6 6a3 3 0 0 0 4.2 0l7-7a3 3 0 0 0 0-4.2l-6-6a3 3 0 0 0-4.2 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 12.5h5M11 10v5" />
      </svg>
    );
  }
  if (key.includes("medical")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v6M9 11h6" />
      </svg>
    );
  }
  if (key.includes("referal") || key.includes("referral")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  if (key.includes("insurance")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V7l8-4Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
      </svg>
    );
  }
  if (key.includes("report")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 13H8M16 17H8M10 9H8" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h10M4 17h7" />
    </svg>
  );
}

function Chevron({
  open,
  isMobile,
  className = "text-zinc-500",
}: {
  open: boolean;
  isMobile: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={`ml-auto h-4 w-4 shrink-0 ${className} transition-transform ${
        isMobile ? (open ? "rotate-180" : "") : open ? "rotate-90" : "-rotate-90"
      }`}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
      </svg>
  );
}

export default function CompanySidebar({
  initialBrandColor = null,
}: {
  initialBrandColor?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [company, setCompany] = useState<CompanySession | null>(null);
  const [features, setFeatures] = useState<CompanyNavFeature[]>([]);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [, startTransition] = useTransition();

  const [openFeatureId, setOpenFeatureId] = useState<string | null>(null);
  const openFeatureWrapRef = useRef<HTMLDivElement>(null);
  const openFeatureButtonRef = useRef<HTMLButtonElement>(null);
  const openFeaturePopoverStyle = useFlyoutPosition(Boolean(openFeatureId), openFeatureButtonRef);
  const [nestedMenuState, setNestedMenuState] = useState<{
    key: string;
    style: CSSProperties;
    modules: CompanyNavModule[];
  } | null>(null);
  const nestedMenuRef = useRef<HTMLDivElement>(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

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

    void loadSession();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;

    async function loadFeatures() {
      try {
        const response = await fetch("/api/company/app-features");
        const data = (await response.json()) as CompanyNavFeature[] | { error?: string };
        if (cancelled) return;
        if (!response.ok || !Array.isArray(data)) {
          setFeatures([]);
          return;
        }
        setFeatures(
          data.map((feature) => ({
            id: feature.id,
            name: feature.name,
            route: feature.route,
            type: feature.type,
            modules: feature.modules ?? [],
          })),
        );
      } catch {
        if (!cancelled) setFeatures([]);
      }
    }

    void loadFeatures();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!openFeatureId) return;

    function onDocMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      const wrap = openFeatureWrapRef.current;
      const nested = nestedMenuRef.current;
      const insideWrap = wrap?.contains(target);
      const insideNested = nested?.contains(target);
      if (!insideWrap && !insideNested) {
        setOpenFeatureId(null);
        setNestedMenuState(null);
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenFeatureId(null);
        setNestedMenuState(null);
        setMobileOpen(false);
      }
    }

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openFeatureId]);

  const searchKey = searchParams.toString();

  useEffect(() => {
    setOpenFeatureId(null);
    setNestedMenuState(null);
    setMobileOpen(false);
  }, [pathname, searchKey]);

  useEffect(() => {
    if (!openFeatureId) setNestedMenuState(null);
  }, [openFeatureId]);

  const brandColor = normalizeCompanyBrandColor(company?.brandColor ?? initialBrandColor);
  const lightText = brandColorPrefersLightText(brandColor);
  const sidebarStyle: CSSProperties = {
    backgroundColor: brandColor,
    backgroundImage: `radial-gradient(120% 60% at 0% 0%, rgba(255,255,255,0.18), transparent 60%), linear-gradient(180deg, ${brandColor} 0%, ${darkenBrandColor(brandColor, 0.28)} 100%)`,
  };
  const mobileBarStyle: CSSProperties = {
    backgroundColor: brandColor,
    backgroundImage: `linear-gradient(90deg, ${brandColor} 0%, ${darkenBrandColor(brandColor, 0.2)} 100%)`,
  };
  const flyoutStyle: CSSProperties = isMobile
    ? { backgroundColor: darkenBrandColor(brandColor, 0.18) }
    : {
        backgroundColor: brandColor,
        backgroundImage: `linear-gradient(160deg, ${brandColor} 0%, ${darkenBrandColor(brandColor, 0.22)} 100%)`,
      };
  const theme = lightText
    ? {
        title: "text-white",
        subtitle: "text-white/70",
        section: "text-white/60",
        border: "border-white/15",
        item: "text-white/85 hover:bg-white/15 hover:text-white",
        icon: "text-white/80 group-hover:text-white",
        chevron: "text-white/70",
        hover: "hover:bg-white/15",
        logoFallback: "bg-white/20 text-white ring-1 ring-white/30",
        avatarFallback: "bg-white/20 text-white ring-1 ring-white/30",
        signOut: "text-white/85 hover:bg-white/15 hover:text-white",
        signOutIcon: "text-white/80",
        menuItem: "text-white/90 hover:bg-white/15 hover:text-white",
        menuItemActive: "bg-white/20 font-semibold text-white",
        menuChevron: "text-white/70",
      }
    : {
        title: "text-zinc-900",
        subtitle: "text-zinc-700",
        section: "text-zinc-700",
        border: "border-black/10",
        item: "text-zinc-800 hover:bg-white/60 hover:text-zinc-950",
        icon: "text-zinc-700 group-hover:text-zinc-900",
        chevron: "text-zinc-600",
        hover: "hover:bg-white/60",
        logoFallback: "bg-[#1f2937] text-white",
        avatarFallback: "bg-white/70 text-zinc-800 ring-1 ring-black/10",
        signOut: "text-zinc-800 hover:bg-white/60 hover:text-zinc-950",
        signOutIcon: "text-rose-700",
        menuItem: "text-zinc-800 hover:bg-white/50 hover:text-zinc-950",
        menuItemActive: "bg-white/70 font-semibold text-zinc-950",
        menuChevron: "text-zinc-600",
      };

  const menuFlyoutClass = isMobile
    ? `relative mt-1 max-h-72 w-full overflow-y-auto overflow-x-hidden rounded-xl border ${theme.border} py-1`
    : `z-100 w-max min-w-52 max-w-[min(20rem,calc(100vw-5rem))] overflow-y-auto overflow-x-hidden rounded-xl border ${theme.border} py-1 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.55)]`;
  const nestedFlyoutClass = isMobile
    ? `relative mt-1 max-h-64 w-full overflow-y-auto overflow-x-hidden rounded-xl border ${theme.border} py-1`
    : `z-110 w-max overflow-y-auto overflow-x-hidden rounded-xl border ${theme.border} py-1 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.55)]`;

  const signOut = async () => {
    setIsSigningOut(true);
    try {
      await fetch("/api/company/auth/logout", { method: "POST" });
      startTransition(() => {
        router.push("/login");
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  const currentTab = searchParams.get("tab");

  const renderModuleButtons = (
    feature: CompanyNavFeature,
    modules: CompanyNavModule[],
    closeMenus: () => void,
  ): ReactNode =>
    modules.map((entry) => {
      const hasChildren = entry.children.length > 0;
      const entryTab = navModuleTab(feature.route, entry.label);
      const isSubOpen = nestedMenuState?.key === `${feature.id}:${entry.label}`;
      const isEntryActive =
        pathname.startsWith(feature.route) &&
        (hasChildren
          ? entry.children.some(
              (child) => navModuleTab(feature.route, child.label) === currentTab,
            )
          : (currentTab ?? "") === entryTab);

      return (
        <button
          key={`${feature.id}-${entry.label}`}
          type="button"
          role="menuitem"
          onClick={(e) => {
            if (hasChildren) {
              if (isSubOpen) {
                setNestedMenuState(null);
                return;
              }
              if (isMobile) {
                setNestedMenuState({
                  key: `${feature.id}:${entry.label}`,
                  style: {},
                  modules: entry.children,
                });
                return;
              }
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              const gap = 4;
              const estimatedWidth = 240;
              let left = rect.right + gap;
              if (left + estimatedWidth > window.innerWidth - gap) {
                left = Math.max(gap, rect.left - estimatedWidth - gap);
              }
              setNestedMenuState({
                key: `${feature.id}:${entry.label}`,
                style: {
                  position: "fixed",
                  top: Math.max(8, rect.top),
                  left,
                },
                modules: entry.children,
              });
              return;
            }

            closeMenus();
            startTransition(() => {
              router.push(navModuleHref(feature.route, entry.label));
            });
          }}
          className={`flex w-full items-center gap-1.5 px-3 py-2.5 text-left text-xs font-medium transition-colors ${
            isEntryActive || isSubOpen ? theme.menuItemActive : theme.menuItem
          }`}
        >
          <span className="flex-1">{entry.label}</span>
          {hasChildren ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className={`h-3 w-3 shrink-0 ${theme.menuChevron} transition-transform ${isSubOpen ? "rotate-90" : ""}`}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
            </svg>
          ) : null}
        </button>
      );
    });

  const profileActive = pathname.startsWith("/company/profile");
  const activeItemClass =
    "bg-white text-zinc-900 shadow-[0_12px_26px_-18px_rgba(15,23,42,0.7)] ring-1 ring-black/5";

  return (
    <>
      <div
        className={`fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b ${theme.border} px-3 md:hidden`}
        style={mobileBarStyle}
      >
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${theme.title} ${theme.hover}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
            <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <div className="min-w-0">
          <p className={`truncate text-sm font-bold ${theme.title}`}>{company?.name ?? "Your lab"}</p>
          <p className={`truncate font-mono text-[10px] font-semibold uppercase tracking-wider ${theme.subtitle}`}>
            {company?.code ?? "Company portal"}
          </p>
        </div>
      </div>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-zinc-900/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-full w-72 max-w-[85vw] flex-col border-r ${theme.border} shadow-[0_14px_38px_-28px_rgba(15,23,42,0.45)] transition-[transform,background-color] duration-200 md:static md:z-auto md:w-64 md:max-w-none md:translate-x-0 md:pointer-events-auto ${
        mobileOpen ? "translate-x-0" : "pointer-events-none -translate-x-full"
      }`}
      style={sidebarStyle}
    >
      <div className={`flex items-center gap-3 border-b ${theme.border} px-5 py-5`}>
        {company?.logoUrl ? (
          <img
            src={company.logoUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-xl bg-white object-cover shadow-[0_10px_22px_-14px_rgba(15,23,42,0.65)] ring-1 ring-white/40"
          />
        ) : (
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-[0_10px_22px_-14px_rgba(15,23,42,0.65)] ${theme.logoFallback}`}
          >
            {company?.initials ?? "—"}
          </div>
        )}
        <div className="min-w-0">
            <p className={`truncate text-sm font-bold leading-tight ${theme.title}`}>
            {company?.name ?? "Your lab"}
          </p>
            <p className={`truncate font-mono text-[10px] font-semibold uppercase tracking-wider leading-tight ${theme.subtitle}`}>
            {company?.code ?? "Company portal"}
          </p>
        </div>
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
          className={`ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg ${theme.subtitle} ${theme.hover} md:hidden`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          <p className={`mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest ${theme.section}`}>
          Workspace
        </p>
          {features.map((feature, index) => {
            const colors = navFeatureColors(index);
          const isActive =
              feature.route === "/company"
              ? pathname === "/company"
                : pathname.startsWith(feature.route);
            const hasSubmenu = feature.type === "Menu" && feature.modules.length > 0;
            const isOpen = openFeatureId === feature.id;

            if (hasSubmenu) {
            return (
                <div
                  key={feature.id}
                  className="relative"
                  ref={isOpen ? openFeatureWrapRef : undefined}
                >
                          <button
                    ref={isOpen ? openFeatureButtonRef : undefined}
                  type="button"
                  aria-haspopup="menu"
                    aria-expanded={isOpen}
                    onClick={() => {
                      setNestedMenuState(null);
                      setOpenFeatureId((current) => (current === feature.id ? null : feature.id));
                    }}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-150 ${
                      isActive || isOpen ? activeItemClass : theme.item
                  }`}
                >
                  <span
                    className={`shrink-0 transition-colors ${
                        isActive || isOpen ? colors.iconActive : theme.icon
                      }`}
                    >
                      <FeatureIcon name={feature.name} />
                  </span>
                    <span className="min-w-0 flex-1 truncate text-left">{feature.name}</span>
                    {isActive ? (
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: brandColor }}
                      />
                    ) : null}
                    <Chevron
                      open={isOpen}
                      isMobile={isMobile}
                      className={isActive || isOpen ? "text-zinc-500" : theme.chevron}
                    />
                </button>

                  {isOpen && (isMobile || openFeaturePopoverStyle) ? (
                  <div
                    role="menu"
                      aria-label={`${feature.name} modules`}
                      style={isMobile ? flyoutStyle : { ...openFeaturePopoverStyle, ...flyoutStyle }}
                    className={menuFlyoutClass}
                  >
                      {renderModuleButtons(feature, feature.modules, () => {
                        setOpenFeatureId(null);
                        setNestedMenuState(null);
                    })}
                  </div>
                ) : null}

                  {isOpen && nestedMenuState?.key.startsWith(`${feature.id}:`) ? (
                  <div
                      ref={nestedMenuRef}
                    role="menu"
                      aria-label={`${feature.name} nested modules`}
                      style={isMobile ? flyoutStyle : { ...nestedMenuState.style, ...flyoutStyle }}
                      className={nestedFlyoutClass}
                    >
                      <div className="grid grid-cols-1">
                        {nestedMenuState.modules.map((leaf) => {
                          const leafTab = navModuleTab(feature.route, leaf.label);
                      return (
                            <button
                              key={`${feature.id}-${leaf.label}`}
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenFeatureId(null);
                                setNestedMenuState(null);
                                startTransition(() => {
                                  router.push(navModuleHref(feature.route, leaf.label));
                                });
                              }}
                              className={`flex w-full px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                                isActive && currentTab === leafTab
                                  ? theme.menuItemActive
                                  : theme.menuItem
                              }`}
                            >
                              {leaf.label}
                            </button>
                          );
                        })}
                        </div>
                  </div>
                ) : null}
              </div>
            );
          }

          return (
            <Link
                key={feature.id}
                href={feature.route}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive ? activeItemClass : theme.item
              }`}
            >
              <span
                className={`shrink-0 transition-colors ${
                    isActive ? colors.iconActive : theme.icon
                }`}
              >
                  <FeatureIcon name={feature.name} />
              </span>
                {feature.name}
              {isActive ? (
                <span
                  className="ml-auto h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: brandColor }}
                />
              ) : null}
            </Link>
          );
        })}
      </nav>

        <div className={`space-y-1 border-t ${theme.border} px-3 py-4`}>
          <Link
            href="/company/profile"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
              profileActive ? activeItemClass : theme.hover
            }`}
          >
            {company?.userImageUrl ? (
              <img
                src={company.userImageUrl}
                alt=""
                className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-white/40"
              />
            ) : (
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  profileActive ? "text-white" : theme.avatarFallback
                }`}
                style={profileActive ? { backgroundColor: brandColor } : undefined}
              >
            {company?.userInitials ?? company?.initials ?? "—"}
          </div>
            )}
          <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-semibold ${profileActive ? "text-zinc-900" : theme.title}`}>
              {company?.userName ?? company?.name ?? "Your lab"}
            </p>
            {company?.role ? (
              <p
                className={`truncate text-xs font-medium ${profileActive ? "" : theme.subtitle}`}
                style={profileActive ? { color: brandColor } : undefined}
              >
                {company.role}
              </p>
            ) : (
              <p className={`truncate font-mono text-xs ${profileActive ? "text-zinc-600" : theme.subtitle}`}>
                {company?.code ?? "Not signed in"}
              </p>
            )}
          </div>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wide ${
                profileActive ? "text-zinc-500" : theme.section
              }`}
            >
              Profile
            </span>
          </Link>
        <button
          type="button"
          onClick={signOut}
          disabled={isSigningOut}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${theme.signOut}`}
        >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className={`h-5 w-5 shrink-0 ${theme.signOutIcon}`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
              />
          </svg>
          {isSigningOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </aside>
    </>
  );
}
