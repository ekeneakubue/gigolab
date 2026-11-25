"use client";

import { FormEvent, Suspense, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function PatientLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/patients";

  const [email, setEmail] = useState("");
  const [patientCode, setPatientCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, startTransition] = useTransition();

  async function submitLogin(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !patientCode.trim()) {
      setError("Enter your email and patient code.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/patients/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          patientCode: patientCode.trim(),
        }),
      });
      const payload = (await response.json()) as { error?: string; redirectTo?: string };
      if (!response.ok || !payload.redirectTo) {
        setError(payload.error ?? "Could not sign in.");
        return;
      }

      const destination =
        nextPath.startsWith("/patients") && !nextPath.startsWith("/patients/login")
          ? nextPath
          : payload.redirectTo;

      startTransition(() => {
        router.push(destination);
      });
    } catch {
      setError("Could not sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#e8ecf3] font-sans text-zinc-900">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-28 top-0 h-80 w-80 rounded-full bg-emerald-400/35 blur-3xl" />
        <div className="absolute top-[18%] -right-24 h-96 w-96 rounded-full bg-sky-400/25 blur-3xl" />
        <div className="absolute bottom-0 left-[20%] h-72 w-72 rounded-full bg-teal-300/30 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
            Patient portal
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">
            Check results & book visits
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Sign in with the email on your lab record and your patient code.
          </p>
        </div>

        <form
          onSubmit={submitLogin}
          className="rounded-3xl border border-emerald-100 bg-white/95 p-6 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.45)] sm:p-8"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="patient-email" className="text-sm font-bold text-zinc-950">
                Email
              </label>
              <input
                id="patient-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                placeholder="you@email.com"
                className="mt-1.5 h-11 w-full rounded-xl border border-emerald-200 px-3 text-base font-medium text-zinc-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="patient-code" className="text-sm font-bold text-zinc-950">
                Patient code
              </label>
              <div className="relative mt-1.5">
                <input
                  id="patient-code"
                  type={showCode ? "text" : "password"}
                  autoComplete="current-password"
                  value={patientCode}
                  onChange={(e) => setPatientCode(e.target.value)}
                  disabled={isLoading}
                  placeholder="Code from your lab / receipt"
                  className="h-11 w-full rounded-xl border border-emerald-200 px-3 pr-16 text-base font-medium uppercase text-zinc-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowCode((value) => !value)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
                >
                  {showCode ? "Hide" : "Show"}
                </button>
              </div>
              <p className="mt-1.5 text-xs font-medium text-zinc-500">
                Your lab-issued patient code is your password.
              </p>
            </div>

            {error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-emerald-300 bg-emerald-100 text-sm font-bold text-emerald-950 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-600">
          Lab staff?{" "}
          <Link href="/login" className="font-semibold text-emerald-800 hover:underline">
            Company login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function PatientLoginPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-zinc-600">Loading…</div>}>
      <PatientLoginForm />
    </Suspense>
  );
}
