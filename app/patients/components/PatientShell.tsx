"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

type PatientSessionInfo = {
  name: string;
  email: string;
  patientCode: string;
  companyName: string;
  companyLogoUrl: string | null;
};

const navItems = [
  { href: "/patients", label: "Dashboard", exact: true },
  { href: "/patients/results", label: "Results" },
  { href: "/patients/appointments", label: "Appointments" },
] as const;

export default function PatientShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [patient, setPatient] = useState<PatientSessionInfo | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/patients/auth/session", { cache: "no-store" });
        const payload = (await response.json()) as {
          patient?: PatientSessionInfo | null;
        };
        if (cancelled) return;
        if (!response.ok || !payload.patient) {
          router.replace("/patients/login");
          return;
        }
        setPatient(payload.patient);
      } catch {
        if (!cancelled) router.replace("/patients/login");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/patients/auth/logout", { method: "POST" });
    } finally {
      router.replace("/patients/login");
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f5fa] text-zinc-900">
      <header className="border-b border-[#dfe4ef] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            {patient?.companyLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={patient.companyLogoUrl}
                alt=""
                className="h-10 w-10 rounded-xl object-contain"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-800">
                {(patient?.companyName ?? "L").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-zinc-900">
                {patient?.companyName ?? "Patient portal"}
              </p>
              <p className="text-xs text-zinc-600">
                {patient ? `${patient.name} · ${patient.patientCode}` : "Loading…"}
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                      : "border-[#d7ddea] bg-white text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => void logout()}
              disabled={loggingOut}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
            >
              {loggingOut ? "Signing out…" : "Logout"}
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
