"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { COMPANY_CODE_PREFIX } from "@/lib/company-code";
import { DEMO_COMPANY_PASSWORD } from "@/lib/company-demo";

const loginSparks = [
  { top: "12%", left: "6%", size: 4, color: "bg-emerald-400", delay: "0s" },
  { top: "28%", left: "88%", size: 3, color: "bg-violet-400", delay: "1.1s" },
  { top: "72%", left: "10%", size: 3, color: "bg-sky-400", delay: "0.5s" },
  { top: "58%", left: "92%", size: 4, color: "bg-amber-400", delay: "1.8s" },
  { top: "85%", left: "48%", size: 2, color: "bg-rose-400", delay: "2.4s" },
  { top: "38%", left: "22%", size: 2, color: "bg-teal-400", delay: "0.9s" },
] as const;

export default function CompanyLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/company";
  const fromDemo = searchParams.get("from") === "demo";
  const demoLabName = searchParams.get("lab");
  const demoLabCode = searchParams.get("code");

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!fromDemo) return;
    if (demoLabCode) setCode(demoLabCode);
    setPassword(DEMO_COMPANY_PASSWORD);
  }, [fromDemo, demoLabCode]);

  const submitLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!code.trim() || !password) {
      setError("Enter your lab code and password.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/company/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          password,
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Could not sign in.");
        return;
      }

      const destination = nextPath.startsWith("/company") ? nextPath : "/company";
      startTransition(() => {
        router.push(destination);
      });
      return;
    } catch {
      setError("Could not sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#e8ecf3] font-sans text-zinc-900">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden animate-hue-drift">
        <div className="animate-float-a animate-pulse-glow absolute -left-28 top-0 h-80 w-80 rounded-full bg-emerald-400/40 blur-3xl" />
        <div
          className="animate-float-b animate-pulse-glow absolute top-[18%] -right-24 h-96 w-96 rounded-full bg-violet-400/30 blur-3xl"
          style={{ animationDelay: "1.5s" }}
        />
        <div
          className="animate-float-c animate-pulse-glow absolute bottom-0 left-[20%] h-72 w-72 rounded-full bg-sky-400/35 blur-3xl"
          style={{ animationDelay: "0.7s" }}
        />
        <div
          className="animate-float-b absolute bottom-[22%] right-[18%] h-56 w-56 rounded-full bg-amber-300/30 blur-3xl"
          style={{ animationDelay: "2.2s" }}
        />
        <div
          className="animate-float-a absolute top-[42%] left-[42%] h-48 w-48 rounded-full bg-rose-300/25 blur-3xl"
          style={{ animationDelay: "3s" }}
        />
        {loginSparks.map((spark, i) => (
          <div
            key={i}
            className={`animate-pulse-glow absolute rounded-full opacity-60 ${spark.color}`}
            style={{
              top: spark.top,
              left: spark.left,
              width: spark.size * 4,
              height: spark.size * 4,
              animationDelay: spark.delay,
            }}
          />
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 600 600" className="animate-spin-slow absolute h-[min(90vw,720px)] w-[min(90vw,720px)] opacity-[0.07]" fill="none">
            <circle cx="300" cy="300" r="250" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="10 20" />
          </svg>
          <svg viewBox="0 0 600 600" className="animate-spin-rev absolute h-[min(70vw,540px)] w-[min(70vw,540px)] opacity-[0.09]" fill="none">
            <circle cx="300" cy="300" r="210" stroke="#10b981" strokeWidth="1.5" strokeDasharray="6 16" />
          </svg>
          <svg
            viewBox="0 0 600 600"
            className="animate-spin-slow absolute h-[min(50vw,380px)] w-[min(50vw,380px)] opacity-[0.06]"
            fill="none"
            style={{ animationDuration: "35s" }}
          >
            <circle cx="300" cy="300" r="170" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="4 12" />
          </svg>
        </div>
        <div className="absolute inset-x-0 top-0 bottom-0 overflow-hidden">
          <div className="animate-scan absolute inset-x-0 h-px bg-linear-to-r from-transparent via-violet-500/25 to-transparent" style={{ top: "35%" }} />
          <div
            className="animate-scan absolute inset-x-0 h-px bg-linear-to-r from-transparent via-emerald-500/30 to-transparent"
            style={{ top: "68%", animationDelay: "2.5s" }}
          />
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.28]"
        style={{
          backgroundImage:
            "linear-gradient(#d7dde8 1px, transparent 1px), linear-gradient(90deg, #d7dde8 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-12 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden lg:block">
            <div
              className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/80 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800 shadow-sm backdrop-blur-sm"
              style={{ animationDelay: "0.05s" }}
            >
              <span className="animate-pulse-glow h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
              Company portal
            </div>
            <h1
              className="animate-fade-up mt-5 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl"
              style={{ animationDelay: "0.15s" }}
            >
              Run your lab operations from{" "}
              <span className="shimmer-emerald">one workspace</span>.
            </h1>
            <p
              className="animate-fade-up mt-4 max-w-md text-base leading-relaxed text-zinc-700"
              style={{ animationDelay: "0.25s" }}
            >
              Sign in with the lab code and password issued when your organisation was registered on Gigolab.
            </p>

            <ul className="animate-fade-up mt-8 space-y-3" style={{ animationDelay: "0.35s" }}>
              {[
                "Track samples, reports, and daily KPIs",
                "Manage masters, transactions, and utilities",
                "Secure access scoped to your lab only",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-base text-zinc-700">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-3.5 w-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="mx-auto w-full max-w-md animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="overflow-hidden rounded-3xl border border-[#dfe4ef]/80 bg-white/95 shadow-[0_28px_60px_-32px_rgba(15,23,42,0.45)] backdrop-blur-md ring-1 ring-white/60">
              <div className="border-b border-[#e8ecf5] bg-linear-to-r from-emerald-50/80 via-violet-50/50 to-sky-50/80 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 via-teal-500 to-violet-600 text-sm font-bold text-white shadow-[0_12px_24px_-14px_rgba(16,185,129,0.55)] animate-pulse-glow">
                    G
                  </div>
                  <div>
                    <p className="text-lg font-bold text-zinc-900">gigolab</p>
                    <p className="text-sm text-zinc-700">Company sign in</p>
                  </div>
                </div>
              </div>

              <form onSubmit={submitLogin} className="space-y-4 px-6 py-6">
                {fromDemo ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3.5 text-sm text-emerald-950">
                    <p className="font-semibold text-emerald-900">
                      {demoLabName ? `Demo lab ready: ${demoLabName}` : "Your demo lab is ready"}
                    </p>
                    <p className="mt-1.5 text-emerald-800/90">
                      Sign in with the credentials below to open your trial company portal.
                    </p>
                    <dl className="mt-3 space-y-2 rounded-lg border border-emerald-200/80 bg-white/70 px-3 py-2.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-emerald-800/80">
                          Lab code
                        </dt>
                        <dd className="font-mono text-sm font-semibold text-emerald-950">
                          {demoLabCode ?? "—"}
                        </dd>
                      </div>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-emerald-800/80">
                          Password
                        </dt>
                        <dd className="font-mono text-sm font-semibold text-emerald-950">{DEMO_COMPANY_PASSWORD}</dd>
                      </div>
                    </dl>
                  </div>
                ) : null}

                <div>
                  <label htmlFor="lab-code" className="text-sm font-semibold text-zinc-800">
                    Lab code
                  </label>
                  <input
                    id="lab-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={`${COMPANY_CODE_PREFIX}A1b2C3`}
                    autoComplete="username"
                    spellCheck={false}
                    className="mt-2 h-12 w-full rounded-xl border border-[#dfe4ef] bg-[#f8f9fc] px-3.5 font-mono text-base text-zinc-900 outline-none transition-colors placeholder:text-zinc-600 focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                  />
                  <p className="mt-2 text-sm text-zinc-700">
                    {fromDemo
                      ? "Use the demo lab code shown above"
                      : `Format: ${COMPANY_CODE_PREFIX} followed by 6 letters or numbers`}
                  </p>
                </div>

                <div>
                  <label htmlFor="password" className="text-sm font-semibold text-zinc-800">
                    Password
                  </label>
                  <div className="relative mt-2">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="h-12 w-full rounded-xl border border-[#dfe4ef] bg-[#f8f9fc] py-0 pl-3.5 pr-12 text-base text-zinc-900 outline-none transition-colors focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029M6.223 6.223A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411M15 12a3 3 0 11-6 0 3 3 0 016 0zM3 3l18 18"
                          />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {error ? (
                  <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-600 via-teal-500 to-violet-600 bg-[length:200%_200%] text-base font-semibold text-white shadow-[0_12px_28px_-12px_rgba(16,185,129,0.65)] transition-all animate-gradient-shift hover:shadow-[0_16px_32px_-10px_rgba(139,92,246,0.5)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Signing in…
                    </>
                  ) : (
                    "Sign in to portal"
                  )}
                </button>
              </form>

              <div className="border-t border-[#e8ecf5] bg-[#f8f9fc] px-6 py-4 text-center">
                <Link
                  href="/"
                  className="text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900"
                >
                  ← Back to Gigolab website
                </Link>
              </div>
            </div>

            <p className="mt-4 text-center text-sm text-zinc-700 lg:hidden">
              Use the lab code and password from your Gigolab registration email.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
