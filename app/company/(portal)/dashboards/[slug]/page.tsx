"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { navModuleHref, type CompanyNavFeature, type CompanyNavModule } from "@/lib/company-nav";

type DashboardSession = {
  userName?: string | null;
  role?: string | null;
  dashboardRoute?: string | null;
  name?: string | null;
};

function ModuleLinks({
  feature,
  modules,
  depth = 0,
}: {
  feature: CompanyNavFeature;
  modules: CompanyNavModule[];
  depth?: number;
}) {
  if (modules.length === 0) return null;

  return (
    <ul className={depth === 0 ? "mt-2 space-y-1" : "mt-1 space-y-1 border-l border-emerald-100 pl-3"}>
      {modules.map((module) => {
        const hasChildren = module.children.length > 0;
        return (
          <li key={`${feature.id}-${module.id ?? module.label}-${depth}`}>
            {hasChildren ? (
              <p className="px-1 py-1 text-sm font-semibold text-zinc-800">{module.label}</p>
            ) : (
              <Link
                href={navModuleHref(feature.route, module.label)}
                className="block rounded-lg px-2 py-1.5 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-50"
              >
                {module.label}
              </Link>
            )}
            <ModuleLinks feature={feature} modules={module.children} depth={depth + 1} />
          </li>
        );
      })}
    </ul>
  );
}

export default function CompanyRoleDashboardPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const [session, setSession] = useState<DashboardSession | null>(null);
  const [features, setFeatures] = useState<CompanyNavFeature[]>([]);
  const [isLoadingFeatures, setIsLoadingFeatures] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/company/auth/session");
        if (!response.ok) return;
        const data = (await response.json()) as { company: DashboardSession | null };
        if (!cancelled) setSession(data.company);
      } catch {
        if (!cancelled) setSession(null);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadFeatures() {
      setIsLoadingFeatures(true);
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
      } finally {
        if (!cancelled) setIsLoadingFeatures(false);
      }
    }

    void loadFeatures();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[#dfe4ef] bg-[#f3f5fa] px-4 py-4 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.65)] sm:px-6">
        <div>
          <h1 className="text-base font-bold text-zinc-900">
            {session?.role ? `${session.role} dashboard` : "Role dashboard"}
          </h1>
          <p className="mt-1 text-xs text-zinc-700">
            Your assigned features and sub-menus ·{" "}
            <span className="font-mono text-zinc-600">/company/dashboards/{slug}</span>
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <section className="rounded-2xl border border-[#dfe4ef] bg-white px-5 py-5 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.6)]">
          <h2 className="text-sm font-bold text-zinc-900">
            Welcome{session?.userName ? `, ${session.userName}` : ""}
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Only the features selected for your role appear here and in the sidebar.
          </p>
        </section>

        <section className="mt-4">
          <h2 className="mb-3 text-sm font-bold text-zinc-900">Your access</h2>
          {isLoadingFeatures ? (
            <p className="text-sm text-zinc-600">Loading features…</p>
          ) : features.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#dfe4ef] bg-white px-5 py-8 text-center text-sm text-zinc-600">
              No features assigned to this role yet.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {features.map((feature) => {
                const hasModules = feature.modules.length > 0;
                return (
                  <article
                    key={feature.id}
                    className="rounded-2xl border border-[#dfe4ef] bg-white px-4 py-4 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.55)]"
                  >
                    {hasModules ? (
                      <>
                        <h3 className="text-sm font-bold text-zinc-900">{feature.name}</h3>
                        <p className="mt-0.5 font-mono text-[11px] text-zinc-500">{feature.route}</p>
                        <ModuleLinks feature={feature} modules={feature.modules} />
                      </>
                    ) : (
                      <Link
                        href={feature.route}
                        className="block transition-colors hover:text-emerald-800"
                      >
                        <h3 className="text-sm font-bold text-zinc-900">{feature.name}</h3>
                        <p className="mt-0.5 font-mono text-[11px] text-zinc-500">{feature.route}</p>
                        <span className="mt-2 inline-block text-xs font-semibold text-emerald-700">
                          Open →
                        </span>
                      </Link>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
