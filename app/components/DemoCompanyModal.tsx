"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { CompanyFormFields, type CompanyFormValues } from "@/app/components/CompanyFormFields";
import { DEMO_COMPANY_PASSWORD, generateDemoCompanyCode } from "@/lib/company-demo";

type CreatedCompany = {
  code: string;
  name: string;
};

function demoLoginUrl(labName?: string, labCode?: string) {
  const params = new URLSearchParams({ from: "demo" });
  if (labName?.trim()) params.set("lab", labName.trim());
  if (labCode?.trim()) params.set("code", labCode.trim());
  return `/company/login?${params.toString()}`;
}

function emptyDemoForm(): CompanyFormValues {
  return {
    logo: null,
    name: "",
    labCode: generateDemoCompanyCode(),
    password: DEMO_COMPANY_PASSWORD,
    location: "",
    status: "Trial",
    contact: "",
    phone: "",
  };
}

type DemoCompanyModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function DemoCompanyModal({ isOpen, onClose }: DemoCompanyModalProps) {
  const router = useRouter();
  const [form, setForm] = useState<CompanyFormValues>(emptyDemoForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(emptyDemoForm());
    setError("");
    setIsSubmitting(false);
  }, [isOpen]);

  const submitDemo = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.location.trim() || !form.contact.trim()) {
      setError("Lab name, location, and contact email are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          code: form.labCode,
          password: form.password,
          location: form.location,
          status: "Trial",
          contact: form.contact,
          phone: form.phone,
          logoUrl: form.logo,
        }),
      });

      const payload = (await response.json()) as CreatedCompany | { error?: string };

      if (!response.ok) {
        setError("error" in payload && payload.error ? payload.error : "Could not create demo lab. Please try again.");
        return;
      }

      const createdCode = "code" in payload ? payload.code : form.labCode;
      const createdName = "name" in payload ? payload.name : form.name;

      onClose();
      router.push(demoLoginUrl(createdName, createdCode));
    } catch {
      setError("Could not create demo lab. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl rounded-2xl border border-emerald-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-emerald-50">
          <div>
            <h2 className="text-lg font-bold text-zinc-950">Get a Demo</h2>
            <p className="text-sm font-medium text-zinc-800 mt-1">
              Create your demo lab — same fields as admin company setup
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Close
          </button>
        </div>

        <form onSubmit={submitDemo} className="px-6 py-4 space-y-3">
          <CompanyFormFields
            form={form}
            onChange={(updater) => setForm(updater)}
            onImageError={setError}
            infoLine="Lab code is auto-generated (Demo + 4 characters). Password is preset for sign-in. All demo labs use Trial status."
            statusMode="readonly"
            passwordMode="readonly"
          />

          {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-base font-bold text-zinc-900 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-100 px-4 py-2.5 text-base font-bold text-emerald-900 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-70 min-w-36"
            >
              {isSubmitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating…
                </>
              ) : (
                "Create demo lab"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
