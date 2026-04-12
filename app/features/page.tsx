import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";

export const metadata: Metadata = {
  title: "Features — Gigolab",
  description:
    "Explore every capability of Gigolab — from admin workflows and patient management to billing, home visits, cloud monitoring, and the patient portal.",
};

// ─── Data ────────────────────────────────────────────────────────────────────

const adminGroups = [
  {
    id: "registration",
    label: "Registration & catalog",
    color: "emerald",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6M3 12a9 9 0 1 0 18 0A9 9 0 0 0 3 12z" />
      </svg>
    ),
    items: [
      { name: "Registration", desc: "Fast patient and sample registration with validations." },
      { name: "Managing tests", desc: "Define and update the full test catalogue." },
      { name: "Managing cultures & antibiotics", desc: "Configure cultures and antibiotic panels." },
      { name: "Tests & cultures price list", desc: "Set and maintain pricing per test or culture." },
    ],
  },
  {
    id: "patients",
    label: "Patients, doctors & documents",
    color: "violet",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-1a4 4 0 0 0-5.447-3.724M9 20H4v-1a4 4 0 0 1 5.447-3.724M15 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm6 3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM3 11a2 2 0 1 1 4 0 2 2 0 0 1-4 0z" />
      </svg>
    ),
    items: [
      { name: "Referring doctors management", desc: "Track and manage the referring physician network." },
      { name: "Patient management", desc: "Complete patient profiles with history and records." },
      { name: "Generate patient receipts", desc: "Issue receipts instantly from the dashboard." },
      { name: "Full patient test report management", desc: "Create, edit, and approve test reports end-to-end." },
      { name: "Print receipts & test reports", desc: "Direct print support for all patient documents." },
      { name: "Print barcodes", desc: "Generate and print unique sample barcodes." },
    ],
  },
  {
    id: "homevisits",
    label: "Home visits & notifications",
    color: "sky",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9" />
      </svg>
    ),
    items: [
      { name: "Patient home visit requests", desc: "Receive and manage requests from patients." },
      { name: "Daily home visit schedule", desc: "View a full per-day schedule for field staff." },
      { name: "Notification system", desc: "Send and receive messages and home-visit alerts." },
    ],
  },
  {
    id: "team",
    label: "Team, roles & cloud",
    color: "amber",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4V9a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v6z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h6M9 12h4" />
      </svg>
    ),
    items: [
      { name: "Contracts with discounts", desc: "Create and manage client contracts with custom rates." },
      { name: "Multi-user roles", desc: "Assign granular permissions to each staff member." },
      { name: "Internal chat", desc: "Built-in messaging between lab employees." },
      { name: "Cloud online monitoring", desc: "See who is active in real time, from anywhere." },
    ],
  },
  {
    id: "finance",
    label: "Finance, settings & compliance",
    color: "rose",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6M9 11h6M9 15h4M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      </svg>
    ),
    items: [
      { name: "Accounting module", desc: "Track expenses, income, profits, and inventory in one place." },
      { name: "Laboratory configuration", desc: "Tailor every setting to your lab's workflow." },
      { name: "Database backup", desc: "On-demand and scheduled backups for peace of mind." },
      { name: "RTL & LIS support", desc: "Full right-to-left interface and LIS integration." },
    ],
  },
];

const patientGroups = [
  {
    id: "portal",
    label: "Patient portal",
    color: "cyan",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A9 9 0 0 1 12 15a9 9 0 0 1 6.879 2.804M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
      </svg>
    ),
    items: [
      { name: "Patient profile management", desc: "Update personal details and medical history." },
      { name: "View test reports & receipts", desc: "Access any report or receipt securely, anytime." },
      { name: "Send home visit requests", desc: "Book a home visit directly from the portal." },
    ],
  },
  {
    id: "outreach",
    label: "Outreach & standards",
    color: "indigo",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l9-5 9 5v8l-9 5-9-5V8z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v14" />
      </svg>
    ),
    items: [
      { name: "Results by email & SMS", desc: "Notify patients with codes and results automatically." },
      { name: "RTL & LIS support", desc: "Inclusive interface with full LIS compatibility." },
    ],
  },
  {
    id: "learning",
    label: "Learning & support",
    color: "pink",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-4.586-2.65A1 1 0 0 0 8.5 9.382v5.236a1 1 0 0 0 1.666.746l4.586-2.618a1 1 0 0 0 0-1.578z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
      </svg>
    ),
    items: [
      { name: "Training videos", desc: "On-demand video library to get up to speed fast." },
    ],
  },
];

// ─── Green-tinted unified style ──────────────────────────────────────────────

const cardStyle = {
  pill:       "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  badge:      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  icon:       "text-emerald-600 bg-emerald-50",
  checkBg:    "bg-emerald-600",
  checkText:  "text-white",
  cardBorder: "border-emerald-100/80 hover:border-emerald-200",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function DashboardSection({
  title,
  subtitle,
  avatarLabel,
  avatarStyle,
  groups,
}: {
  title: string;
  subtitle: string;
  avatarLabel: string;
  avatarStyle: string;
  groups: typeof adminGroups;
}) {
  return (
    <section className="mb-20 md:mb-28">
      {/* Section header card — gigolabs lifted-white style */}
      <div className="mb-8 rounded-2xl border border-emerald-100 bg-white px-6 py-5 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold shadow-md ${avatarStyle}`}
          >
            {avatarLabel}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-0.5 text-emerald-600">
              Dashboard
            </p>
            <h2 className="text-xl md:text-2xl font-bold text-zinc-900 tracking-tight">
              {title}
            </h2>
            <p className="text-zinc-500 mt-0.5 text-sm">{subtitle}</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center self-start md:self-auto rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 ${cardStyle.badge}`}
        >
          {groups.reduce((s, g) => s + g.items.length, 0)} capabilities
        </span>
      </div>

      {/* Category groups — cards sit directly on the zinc-50 body */}
      <div className="space-y-10">
        {groups.map((group) => (
          <div key={group.id}>
            {/* Category pill header */}
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${cardStyle.pill}`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full ${cardStyle.icon}`}>
                  {group.icon}
                </span>
                {group.label}
              </span>
              <div className="flex-1 h-px bg-emerald-100" />
            </div>

            {/* Feature cards directly on body */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {group.items.map((item) => (
                <div
                  key={item.name}
                  className={`group flex flex-col gap-3 rounded-2xl border bg-white p-5 shadow-md hover:shadow-xl hover:shadow-emerald-100 hover:-translate-y-0.5 transition-all duration-300 ${cardStyle.cardBorder}`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold shadow-sm ${cardStyle.checkBg} ${cardStyle.checkText}`}
                      aria-hidden
                    >
                      ✓
                    </span>
                    <p className="text-sm font-semibold text-zinc-800 leading-snug">
                      {item.name}
                    </p>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed pl-8">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FeaturesPage() {
  const totalAdmin = adminGroups.reduce((s, g) => s + g.items.length, 0);
  const totalPatient = patientGroups.reduce((s, g) => s + g.items.length, 0);

  return (
    <div className="min-h-screen bg-emerald-50/40 font-sans">
      <Navbar activePath="/features" />

      {/* ── Hero (light) ── */}
      <section className="relative overflow-hidden bg-emerald-50/60 px-6 py-24 md:py-32">

        {/* ── Layer 1: soft gradient mesh ── */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 55% at 50% -10%, rgba(16,185,129,0.18), transparent 65%), radial-gradient(ellipse 50% 40% at 92% 85%, rgba(16,185,129,0.10), transparent 60%), radial-gradient(ellipse 40% 35% at 5% 70%, rgba(52,211,153,0.10), transparent 55%)",
          }}
          aria-hidden
        />

        {/* ── Layer 2: dot grid ── */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.45] bg-[radial-gradient(circle_at_1px_1px,rgba(24,24,27,0.07)_1px,transparent_0)] bg-size-[28px_28px]"
          aria-hidden
        />

        {/* ── Layer 3: floating orbs ── */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-float-a animate-pulse-glow absolute -top-24 -left-24 h-80 w-80 rounded-full bg-emerald-300/30 blur-3xl" />
          <div className="animate-float-b animate-pulse-glow absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-emerald-200/25 blur-3xl" style={{ animationDelay: "2s" }} />
          <div className="animate-float-c animate-pulse-glow absolute -bottom-16 left-1/3 h-64 w-64 rounded-full bg-teal-300/25 blur-3xl" style={{ animationDelay: "1s" }} />
          {/* Sparks */}
          {([
            { top: "18%", left: "8%",  size: 4, color: "bg-emerald-400", delay: "0s"   },
            { top: "62%", left: "92%", size: 3, color: "bg-emerald-500", delay: "1.2s" },
            { top: "80%", left: "14%", size: 3, color: "bg-teal-400",    delay: "0.6s" },
            { top: "10%", left: "78%", size: 4, color: "bg-emerald-300", delay: "2s"   },
            { top: "45%", left: "3%",  size: 2, color: "bg-green-400",   delay: "1.8s" },
            { top: "30%", left: "96%", size: 3, color: "bg-teal-500",    delay: "0.9s" },
          ] as {top:string;left:string;size:number;color:string;delay:string}[]).map((p, i) => (
            <div
              key={i}
              className={`animate-pulse-glow absolute rounded-full opacity-50 ${p.color}`}
              style={{ top: p.top, left: p.left, width: p.size * 4, height: p.size * 4, animationDelay: p.delay }}
            />
          ))}
        </div>

        {/* ── Layer 4: rotating rings ── */}
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 600 600" className="animate-spin-slow absolute w-[min(600px,100vw)] opacity-[0.06]" fill="none">
            <circle cx="300" cy="300" r="240" stroke="#18181b" strokeWidth="1" strokeDasharray="8 18" />
          </svg>
          <svg viewBox="0 0 600 600" className="animate-spin-rev absolute w-[min(450px,80vw)] opacity-[0.08]" fill="none">
            <circle cx="300" cy="300" r="200" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 14" />
          </svg>
        </div>

        {/* ── Layer 5: scan line ── */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 bottom-0 overflow-hidden">
          <div
            className="animate-scan absolute inset-x-0 h-px bg-linear-to-r from-transparent via-emerald-500/30 to-transparent"
            style={{ top: "50%" }}
          />
        </div>

        {/* ── Content ── */}
        <div className="relative max-w-5xl mx-auto text-center">

          <span
            className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm mb-6"
            style={{ animationDelay: "0s" }}
          >
            <span className="animate-pulse-glow h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            Gigolab Software
          </span>

          <h1
            className="animate-fade-up text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] text-zinc-900 mb-6"
            style={{ animationDelay: "0.12s" }}
          >
            Every feature your lab{" "}
            <span className="shimmer-emerald">needs to thrive.</span>
          </h1>

          <p
            className="animate-fade-up text-zinc-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10"
            style={{ animationDelay: "0.24s" }}
          >
            Two powerful dashboards — one for your admin team, one for your
            patients — covering everything from sample registration to cloud
            monitoring and training.
          </p>

          <div
            className="animate-fade-up flex flex-wrap items-center justify-center gap-4"
            style={{ animationDelay: "0.36s" }}
          >
            <Link
              href="#admin"
              className="group inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white font-semibold px-6 py-3 text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
            >
              Admin dashboard
              <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 opacity-40 group-hover:translate-y-0.5 transition-transform duration-200">
                <path d="M8 2a.75.75 0 0 1 .75.75v8.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.22 3.22V2.75A.75.75 0 0 1 8 2z" />
              </svg>
            </Link>
            <Link
              href="#patient"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white text-emerald-700 font-semibold px-6 py-3 text-sm hover:bg-emerald-50 hover:border-emerald-300 transition-colors shadow-sm"
            >
              Patient dashboard
            </Link>
          </div>

          {/* Stats strip */}
          <div
            className="animate-fade-up mt-16 grid grid-cols-2 md:grid-cols-4 gap-4"
            style={{ animationDelay: "0.5s" }}
          >
            {[
              { value: `${totalAdmin}`, label: "Admin capabilities" },
              { value: `${totalPatient}`, label: "Patient capabilities" },
              { value: "99.9%", label: "Uptime" },
              { value: "25+", label: "Years experience" },
            ].map((s) => (
              <div
                key={s.label}
                className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white px-6 py-6 text-center shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-transparent via-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden />
                <p className="text-3xl md:text-4xl font-bold text-zinc-900 tabular-nums">{s.value}</p>
                <p className="text-xs text-zinc-400 mt-1.5 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature content ── */}
      <main className="px-6 py-16 md:py-24 max-w-7xl mx-auto bg-emerald-50/40">
        {/* Admin */}
        <div id="admin" className="scroll-mt-24">
          <DashboardSection
            title="Admin Dashboard"
            subtitle="Full control for lab staff and administrators — from sample intake to finance."
            avatarLabel="A"
            avatarStyle="bg-emerald-600 text-white"
            groups={adminGroups}
          />
        </div>

        {/* Divider */}
          <div className="relative my-4 mb-16">
          <div className="absolute inset-0 flex items-center" aria-hidden>
            <div className="w-full border-t border-emerald-100" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-emerald-50/40 px-4 text-xs font-medium text-emerald-600 uppercase tracking-wider">
              Patient dashboard
            </span>
          </div>
        </div>

        {/* Patient */}
        <div id="patient" className="scroll-mt-24">
          <DashboardSection
            title="Patient Dashboard"
            subtitle="Self-service for patients and guardians — profiles, reports, appointments, and learning."
            avatarLabel="P"
            avatarStyle="bg-emerald-100 text-emerald-800"
            groups={patientGroups}
          />
        </div>
      </main>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden bg-emerald-600 text-white px-6 py-20 text-center">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 60% at 50% 110%, rgba(0,0,0,0.2), transparent), radial-gradient(ellipse 60% 50% at 50% -10%, rgba(255,255,255,0.1), transparent)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.4)_1px,transparent_0)] bg-size-[24px_24px]"
          aria-hidden
        />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Ready to see it in action?
          </h2>
          <p className="text-emerald-100 text-base md:text-lg leading-relaxed mb-8">
            Book a demo and we&apos;ll walk you through every feature live.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/#demo"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-emerald-700 font-semibold px-7 py-3.5 text-sm hover:bg-emerald-50 transition-colors shadow-lg"
            >
              Get a Demo
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 text-white font-semibold px-7 py-3.5 text-sm hover:bg-white/20 transition-colors"
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer strip ── */}
      <footer className="border-t border-emerald-100 bg-emerald-50/60 px-6 py-6 text-center text-xs text-emerald-700/60">
        © 2026 Gigolab. All rights reserved.
      </footer>
    </div>
  );
}
