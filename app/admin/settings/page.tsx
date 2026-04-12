import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings — Gigolab Admin" };

const settingSections = [
  {
    id: "general",
    title: "General",
    subtitle: "Branding and default configuration",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253a3 3 0 1 0 0 5.494a3 3 0 0 0 0-5.494Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82A1.65 1.65 0 0 0 3 14.49V14a2 2 0 0 1 0-4v-.49a1.65 1.65 0 0 0 1.51-1a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8.82 3a1.65 1.65 0 0 0 1-1.51V1a2 2 0 0 1 4 0v.49a1.65 1.65 0 0 0 1 1.51a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 8c0 .52.2 1 .53 1.35c.33.35.78.56 1.27.64V10a2 2 0 0 1 0 4v.49c-.49.08-.94.29-1.27.64c-.33.35-.53.83-.53 1.35Z" />
      </svg>
    ),
  },
  {
    id: "notifications",
    title: "Notifications",
    subtitle: "Email, SMS and in-app messaging preferences",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    id: "security",
    title: "Security",
    subtitle: "Access control and session policies",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v-2m0-4h.01M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      </svg>
    ),
  },
  {
    id: "integrations",
    title: "API & Integrations",
    subtitle: "Connect LIS, webhooks and external services",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8m-9 5a9 9 0 1 1 10 0" />
      </svg>
    ),
  },
];

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-zinc-700">{label}</label>
      {children}
      {hint ? <p className="text-[11px] text-zinc-400">{hint}</p> : null}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <header className="shrink-0 flex items-center justify-between gap-4 bg-white border-b border-emerald-100 px-6 py-3.5 shadow-sm">
        <div>
          <h1 className="text-base font-bold text-zinc-900">Settings</h1>
          <p className="text-xs text-zinc-400">Super admin configuration for your workspace</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
            <path strokeLinecap="round" d="M12 5v14m7-7H5" />
          </svg>
          New policy
        </button>
      </header>

      {/* Body */}
      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        <div className="rounded-2xl border border-emerald-100 bg-white shadow-md overflow-hidden">
          <div className="px-5 py-4 border-b border-emerald-50 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Configuration sections</h2>
              <p className="text-xs text-zinc-400">Pick a section and adjust settings</p>
            </div>
            <div className="hidden lg:flex items-center gap-2">
              {settingSections.map((s) => (
                <span key={s.id} className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/40 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {s.title}
                </span>
              ))}
            </div>
          </div>

          <div className="p-5 grid xl:grid-cols-2 gap-5">
            {/* General */}
            <section className="rounded-2xl border border-emerald-100 bg-emerald-50/25 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                  {settingSections[0].icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">{settingSections[0].title}</h3>
                  <p className="text-xs text-zinc-600">{settingSections[0].subtitle}</p>
                </div>
              </div>

              <div className="space-y-4">
                <Field label="Workspace name" hint="Shown across dashboards">
                  <input
                    className="h-10 w-full rounded-xl border border-emerald-100 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                    defaultValue="Gigolab"
                  />
                </Field>
                <Field label="Support email">
                  <input
                    className="h-10 w-full rounded-xl border border-emerald-100 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                    defaultValue="support@gigolab.com"
                  />
                </Field>
                <Field label="Default locale" hint="Affects formatting and RTL/LTR defaults">
                  <select
                    className="h-10 w-full rounded-xl border border-emerald-100 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                    defaultValue="en"
                  >
                    <option value="en">English (LTR)</option>
                    <option value="ar">Arabic (RTL)</option>
                  </select>
                </Field>
              </div>
            </section>

            {/* Notifications */}
            <section className="rounded-2xl border border-emerald-100 bg-emerald-50/25 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  {settingSections[1].icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">{settingSections[1].title}</h3>
                  <p className="text-xs text-zinc-600">{settingSections[1].subtitle}</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { k: "homeVisit", t: "Home visit requests", d: "Notify patients when a request is submitted" },
                  { k: "results", t: "Results notifications", d: "Send patient results via email/SMS" },
                  { k: "receipts", t: "Receipt and report emails", d: "Auto-send receipts and full reports" },
                  { k: "messages", t: "In-app alerts", d: "Show message notifications inside the app" },
                ].map((row) => (
                  <label
                    key={row.k}
                    className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-white p-4 hover:bg-emerald-50/40 transition-colors"
                  >
                    <input type="checkbox" defaultChecked className="mt-1 h-4 w-4 rounded border-emerald-200 text-emerald-600 focus:ring-emerald-100" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-zinc-800">{row.t}</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">{row.d}</div>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* Security */}
            <section className="rounded-2xl border border-emerald-100 bg-emerald-50/25 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                  {settingSections[2].icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">{settingSections[2].title}</h3>
                  <p className="text-xs text-zinc-600">{settingSections[2].subtitle}</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { t: "Require MFA for Admins", d: "Add a second factor for high-privilege accounts" },
                  { t: "Session timeout (minutes)", d: "Automatic logout after inactivity" },
                  { t: "Audit trail retention", d: "How long to keep audit logs for compliance" },
                ].map((row, idx) => (
                  <div key={idx} className="rounded-xl border border-emerald-100 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-zinc-800">{row.t}</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">{row.d}</div>
                      </div>
                      {idx === 0 ? (
                        <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-emerald-200 text-emerald-600 focus:ring-emerald-100" />
                      ) : null}
                    </div>
                    {idx === 1 ? (
                      <input
                        type="number"
                        defaultValue={30}
                        className="mt-3 h-9 w-full rounded-xl border border-emerald-100 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                      />
                    ) : null}
                    {idx === 2 ? (
                      <select
                        defaultValue="365"
                        className="mt-3 h-9 w-full rounded-xl border border-emerald-100 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                      >
                        <option value="180">180 days</option>
                        <option value="365">365 days</option>
                        <option value="730">2 years</option>
                      </select>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>

            {/* Integrations */}
            <section className="rounded-2xl border border-emerald-100 bg-emerald-50/25 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  {settingSections[3].icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">{settingSections[3].title}</h3>
                  <p className="text-xs text-zinc-600">{settingSections[3].subtitle}</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { t: "LIS integration", d: "Enable LIS sync for patient and test data" },
                  { t: "Webhooks", d: "Push events to external systems (HTTPS)" },
                  { t: "API keys", d: "Create keys for apps and partner systems" },
                ].map((row) => (
                  <div key={row.t} className="rounded-xl border border-emerald-100 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-zinc-800">{row.t}</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">{row.d}</div>
                      </div>
                      <button className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors">
                        Configure
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Save bar */}
      <footer className="shrink-0 border-t border-emerald-100 bg-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <p className="text-xs text-zinc-400">
            Changes are stored locally in this demo UI. Hook up APIs when ready.
          </p>
          <div className="flex items-center gap-3">
            <button className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors">
              Save changes
            </button>
            <button className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

