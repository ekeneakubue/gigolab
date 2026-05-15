"use client";

import { useEffect, useRef, useState } from "react";
import CalculatorSection from "./components/CalculatorSection";
import CalendarSection from "./components/CalendarSection";

type SectionTab = "security" | "applications" | "operations" | "miscellaneous";

type SecurityMenuItem =
  | "users-creation"
  | "rights-allocation"
  | "change-password"
  | "lock-entry-date"
  | "unlock-entry-date";

type ApplicationsMenuItem = "calculator" | "calendar" | "timer";

const securityMenuItems: { id: SecurityMenuItem; label: string }[] = [
  { id: "users-creation", label: "Users creation" },
  { id: "rights-allocation", label: "Rights allocation" },
  { id: "change-password", label: "Change password" },
  { id: "lock-entry-date", label: "Lock entry date" },
  { id: "unlock-entry-date", label: "Unlock entry date" },
];

const applicationsMenuItems: { id: ApplicationsMenuItem; label: string }[] = [
  { id: "calculator", label: "Calculator" },
  { id: "calendar", label: "Calendar" },
  { id: "timer", label: "Timer" },
];

const plainTabs: { id: "operations" | "miscellaneous"; label: string; description: string }[] = [
  {
    id: "operations",
    label: "Operations",
    description: "Queues, printers, backups, and environment health.",
  },
  {
    id: "miscellaneous",
    label: "Miscellaneous",
    description: "Labels, lookups, and one-off lab preferences.",
  },
];

const plainPanelCopy: Record<
  "operations" | "miscellaneous",
  { kicker: string; title: string; body: string; placeholders: string[] }
> = {
  operations: {
    kicker: "Operations",
    title: "Day-two operations",
    body: "Monitor background tasks, printer routing, barcode ranges, and backup schedules.",
    placeholders: ["Job runner", "Device roster", "Maintenance window"],
  },
  miscellaneous: {
    kicker: "Miscellaneous",
    title: "Catch-all utilities",
    body: "Small tools that do not fit elsewhere: default texts, numbering schemes, and lab-specific tweaks.",
    placeholders: ["Reference lookups", "Print templates", "Lab defaults"],
  },
};

const applicationsPanels: Record<
  ApplicationsMenuItem,
  { kicker: string; title: string; body: string; placeholders: string[] }
> = {
  calculator: {
    kicker: "Calculator",
    title: "Quick calculations",
    body: "Run pricing, dilution, or unit conversions without leaving the portal.",
    placeholders: [],
  },
  calendar: {
    kicker: "Calendar",
    title: "Schedule at a glance",
    body: "Surface shifts, instrument maintenance windows, and clinic closures.",
    placeholders: [],
  },
  timer: {
    kicker: "Timer",
    title: "Countdown and stopwatch",
    body: "Track incubation steps or timed procedures from the utilities tray.",
    placeholders: [],
  },
};

const securityPanels: Record<
  SecurityMenuItem,
  { kicker: string; title: string; body: string; placeholders: string[] }
> = {
  "users-creation": {
    kicker: "Users creation",
    title: "Create and maintain users",
    body: "Add lab staff accounts, assign default sites, and manage activation status.",
    placeholders: ["New user form", "Department defaults", "Bulk import"],
  },
  "rights-allocation": {
    kicker: "Rights allocation",
    title: "Roles and permissions",
    body: "Map roles to screens and actions so teams only see what they need.",
    placeholders: ["Role templates", "Screen matrix", "Effective preview"],
  },
  "change-password": {
    kicker: "Change password",
    title: "Password rotation",
    body: "Force resets, enforce complexity rules, and unlock locked accounts.",
    placeholders: ["Self-service reset", "Admin override", "History"],
  },
  "lock-entry-date": {
    kicker: "Lock entry date",
    title: "Freeze posting periods",
    body: "Prevent transactions before a cutoff date for audit or closing periods.",
    placeholders: ["Effective date", "Scope by module", "Audit trail"],
  },
  "unlock-entry-date": {
    kicker: "Unlock entry date",
    title: "Re-open periods",
    body: "Temporarily lift locks for corrections with supervisor approval.",
    placeholders: ["Unlock window", "Approver", "Reason code"],
  },
};

function formatCountdown(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function formatStopwatch(ms: number) {
  const totalCs = Math.floor(ms / 10);
  const cs = totalCs % 100;
  const totalSec = Math.floor(totalCs / 100);
  const s = totalSec % 60;
  const m = Math.floor(totalSec / 60) % 60;
  const h = Math.floor(totalSec / 3600);
  const time =
    h > 0
      ? `${String(h)}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${time}.${String(cs).padStart(2, "0")}`;
}

function TimerSection() {
  const [timerMode, setTimerMode] = useState<"countdown" | "stopwatch">("countdown");

  const [cdMinutes, setCdMinutes] = useState(5);
  const [cdSeconds, setCdSeconds] = useState(0);
  const [cdDurationSec, setCdDurationSec] = useState(300);
  const [cdRemainingSec, setCdRemainingSec] = useState(300);
  const [cdRunning, setCdRunning] = useState(false);
  const [cdDone, setCdDone] = useState(false);

  const [swAccumMs, setSwAccumMs] = useState(0);
  const [swStartedAtMs, setSwStartedAtMs] = useState<number | null>(null);
  const [swRunning, setSwRunning] = useState(false);
  const [, setSwTick] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);

  useEffect(() => {
    if (!cdRunning) return;
    const id = window.setInterval(() => {
      setCdRemainingSec((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cdRunning]);

  useEffect(() => {
    if (!cdRunning || cdRemainingSec > 0) return;
    setCdRunning(false);
    setCdDone(true);
  }, [cdRunning, cdRemainingSec]);

  useEffect(() => {
    if (!swRunning) return;
    const id = window.setInterval(() => setSwTick((t) => t + 1), 50);
    return () => window.clearInterval(id);
  }, [swRunning]);

  const stopwatchElapsedMs =
    swRunning && swStartedAtMs !== null ? swAccumMs + (performance.now() - swStartedAtMs) : swAccumMs;

  function applyCountdownDuration() {
    const m = Math.min(59, Math.max(0, Math.floor(cdMinutes)));
    const s = Math.min(59, Math.max(0, Math.floor(cdSeconds)));
    const total = m * 60 + s;
    setCdMinutes(m);
    setCdSeconds(s);
    setCdDurationSec(total || 1);
    setCdRemainingSec(total || 1);
    setCdDone(false);
    setCdRunning(false);
  }

  function countdownPreset(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    setCdMinutes(m);
    setCdSeconds(s);
    setCdDurationSec(seconds);
    setCdRemainingSec(seconds);
    setCdDone(false);
    setCdRunning(false);
  }

  function resetCountdown() {
    setCdRemainingSec(cdDurationSec);
    setCdRunning(false);
    setCdDone(false);
  }

  function toggleStopwatch() {
    if (swRunning && swStartedAtMs !== null) {
      setSwAccumMs((prev) => prev + (performance.now() - swStartedAtMs));
      setSwStartedAtMs(null);
      setSwRunning(false);
      return;
    }
    const now = performance.now();
    setSwStartedAtMs(now);
    setSwRunning(true);
  }

  function resetStopwatch() {
    setSwAccumMs(0);
    setSwStartedAtMs(null);
    setSwRunning(false);
    setLaps([]);
    setSwTick(0);
  }

  function lapStopwatch() {
    const elapsed =
      swRunning && swStartedAtMs !== null ? swAccumMs + (performance.now() - swStartedAtMs) : swAccumMs;
    setLaps((prev) => [...prev, elapsed]);
  }

  const btnPrimary =
    "rounded-lg border border-zinc-700 bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40";
  const btnSecondary =
    "rounded-lg border border-[#d7ddea] bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">{applicationsPanels.timer.kicker}</p>
        <h2 className="mt-1 text-lg font-bold text-zinc-900">{applicationsPanels.timer.title}</h2>
        <p className="mt-1 max-w-xl text-sm text-zinc-700">{applicationsPanels.timer.body}</p>
      </div>

      <div className="inline-flex rounded-xl border border-[#dfe4ef] bg-[#eef1f6] p-1 shadow-[inset_0_2px_8px_rgba(15,23,42,0.06)]">
        <button
          type="button"
          onClick={() => setTimerMode("countdown")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            timerMode === "countdown"
              ? "bg-white text-zinc-900 shadow-[0_10px_22px_-14px_rgba(15,23,42,0.55)] ring-1 ring-[#dfe4ef]"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          Countdown
        </button>
        <button
          type="button"
          onClick={() => setTimerMode("stopwatch")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            timerMode === "stopwatch"
              ? "bg-white text-zinc-900 shadow-[0_10px_22px_-14px_rgba(15,23,42,0.55)] ring-1 ring-[#dfe4ef]"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          Stopwatch
        </button>
      </div>

      {timerMode === "countdown" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#dfe4ef] bg-white p-6 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">Countdown</p>
            <div
              className={`mt-4 tabular-nums text-5xl font-bold tracking-tight sm:text-6xl ${cdDone ? "text-zinc-700" : "text-zinc-900"}`}
              aria-live="polite"
            >
              {cdDone ? "00:00" : formatCountdown(cdRemainingSec)}
            </div>
            {cdDone ? (
              <p className="mt-2 text-sm font-medium text-zinc-700">Time is up.</p>
            ) : (
              <p className="mt-2 text-xs text-zinc-600">
                {cdRunning ? "Running…" : "Paused"} · Total set {formatCountdown(cdDurationSec)}
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                className={btnPrimary}
                onClick={() => {
                  if (!cdRunning && (cdRemainingSec === 0 || cdDone)) {
                    setCdRemainingSec(cdDurationSec);
                    setCdDone(false);
                    setCdRunning(true);
                    return;
                  }
                  setCdRunning((r) => !r);
                }}
              >
                {cdRunning ? "Pause" : !cdRunning && (cdRemainingSec === 0 || cdDone) ? "Restart" : "Start"}
              </button>
              <button type="button" className={btnSecondary} onClick={resetCountdown}>
                Reset
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-[#dfe4ef] bg-white p-6 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">Duration</p>
            <p className="mt-1 text-xs text-zinc-700">Set minutes and seconds, then apply. Presets adjust duration while paused.</p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-zinc-700">Minutes</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  disabled={cdRunning}
                  value={cdMinutes}
                  onChange={(e) => setCdMinutes(Number(e.target.value))}
                  className="w-20 rounded-lg border border-[#d7ddea] bg-[#f8f9fc] px-3 py-2 text-sm font-semibold tabular-nums text-zinc-900 outline-none focus:border-[#bcc6da]"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-zinc-700">Seconds</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  disabled={cdRunning}
                  value={cdSeconds}
                  onChange={(e) => setCdSeconds(Number(e.target.value))}
                  className="w-20 rounded-lg border border-[#d7ddea] bg-[#f8f9fc] px-3 py-2 text-sm font-semibold tabular-nums text-zinc-900 outline-none focus:border-[#bcc6da]"
                />
              </label>
              <button type="button" className={btnPrimary} disabled={cdRunning} onClick={applyCountdownDuration}>
                Apply
              </button>
            </div>
            <div className="mt-6">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Quick presets</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  { label: "1 min", sec: 60 },
                  { label: "3 min", sec: 180 },
                  { label: "5 min", sec: 300 },
                  { label: "10 min", sec: 600 },
                ].map((p) => (
                  <button
                    key={p.sec}
                    type="button"
                    disabled={cdRunning}
                    onClick={() => countdownPreset(p.sec)}
                    className="rounded-lg border border-[#d7ddea] bg-[#f8f9fc] px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-white disabled:opacity-40"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#dfe4ef] bg-white p-6 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">Stopwatch</p>
            <div className="mt-4 tabular-nums text-5xl font-bold tracking-tight text-zinc-900 sm:text-6xl">{formatStopwatch(stopwatchElapsedMs)}</div>
            <p className="mt-2 text-xs text-zinc-600">{swRunning ? "Running…" : "Paused"}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button type="button" className={btnPrimary} onClick={toggleStopwatch}>
                {swRunning ? "Pause" : "Start"}
              </button>
              <button type="button" className={btnSecondary} disabled={!swRunning && stopwatchElapsedMs === 0} onClick={lapStopwatch}>
                Lap
              </button>
              <button type="button" className={btnSecondary} onClick={resetStopwatch}>
                Reset
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-[#dfe4ef] bg-white p-6 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">Laps</p>
            <p className="mt-1 text-xs text-zinc-700">Latest lap shows delta from the previous lap.</p>
            <ul className="mt-4 max-h-[280px] space-y-2 overflow-y-auto">
              {laps.length === 0 ? (
                <li className="rounded-lg border border-dashed border-[#e8ecf5] px-4 py-8 text-center text-sm text-zinc-600">
                  No laps yet — press Lap while running or paused after a run.
                </li>
              ) : (
                laps.map((absoluteMs, idx) => {
                  const prev = idx === 0 ? 0 : laps[idx - 1]!;
                  const lapDelta = absoluteMs - prev;
                  return (
                    <li
                      key={`${idx}-${absoluteMs}`}
                      className="flex items-center justify-between rounded-lg border border-[#e8ecf5] bg-[#f8f9fc] px-4 py-2.5 text-sm"
                    >
                      <span className="font-semibold text-zinc-600">Lap {idx + 1}</span>
                      <span className="tabular-nums font-semibold text-zinc-900">{formatStopwatch(lapDelta)}</span>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
      className={`mt-0.5 h-5 w-5 shrink-0 text-zinc-600 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function CompanyUtilitiesPage() {
  const [activeSection, setActiveSection] = useState<SectionTab>("security");
  const [securityItem, setSecurityItem] = useState<SecurityMenuItem>("users-creation");
  const [applicationsItem, setApplicationsItem] = useState<ApplicationsMenuItem>("calculator");
  const [securityOpen, setSecurityOpen] = useState(false);
  const [applicationsOpen, setApplicationsOpen] = useState(false);

  const securityDropdownRef = useRef<HTMLDivElement>(null);
  const applicationsDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | PointerEvent) {
      const target = event.target as Node;
      if (!securityDropdownRef.current?.contains(target)) {
        setSecurityOpen(false);
      }
      if (!applicationsDropdownRef.current?.contains(target)) {
        setApplicationsOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const panel =
    activeSection === "security"
      ? securityPanels[securityItem]
      : activeSection === "applications"
        ? applicationsPanels[applicationsItem]
        : plainPanelCopy[activeSection];

  const securityTriggerActive = activeSection === "security";
  const applicationsTriggerActive = activeSection === "applications";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[#dfe4ef] bg-[#f3f5fa] px-6 py-4 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.65)]">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-base font-bold text-zinc-900">Utilities</h1>
            <p className="text-xs text-zinc-700">Administrative tools grouped by purpose.</p>
          </div>

          <div
            className="flex flex-col gap-2 rounded-xl border border-[#dfe4ef] bg-[#eef1f6] p-1.5 shadow-[inset_0_2px_8px_rgba(15,23,42,0.06)] sm:flex-row sm:flex-wrap sm:items-stretch"
            aria-label="Utility category"
          >
            <div ref={securityDropdownRef} className="relative flex-1 sm:min-w-[min(100%,220px)] sm:flex-[1_1_calc(25%-0.45rem)]">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={securityOpen}
                onClick={() => {
                  setActiveSection("security");
                  setSecurityOpen((open) => !open);
                  setApplicationsOpen(false);
                }}
                className={`flex min-h-[44px] w-full items-start justify-between gap-2 rounded-lg px-4 py-2.5 text-left transition-all duration-150 ${
                  securityTriggerActive
                    ? "bg-white text-zinc-900 shadow-[0_12px_26px_-18px_rgba(15,23,42,0.65)] ring-1 ring-[#dfe4ef]"
                    : "text-zinc-600 hover:bg-white/70 hover:text-zinc-900"
                }`}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-snug">Security</span>
                  <span
                    className={`mt-0.5 block text-[11px] leading-snug ${securityTriggerActive ? "text-zinc-700" : "text-zinc-600"}`}
                  >
                    Users, roles, and posting controls — choose an action below.
                  </span>
                </span>
                <ChevronIcon open={securityOpen} />
              </button>

              {securityOpen ? (
                <div
                  role="menu"
                  aria-label="Security actions"
                  className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-20 overflow-hidden rounded-xl border border-[#dfe4ef] bg-white py-1.5 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.45)] sm:left-0 sm:right-auto sm:min-w-[min(100%,260px)]"
                >
                  {securityMenuItems.map((item) => {
                    const isCurrent = activeSection === "security" && securityItem === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setSecurityItem(item.id);
                          setActiveSection("security");
                          setSecurityOpen(false);
                        }}
                        className={`flex w-full items-center px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                          isCurrent ? "bg-zinc-100 text-zinc-900" : "text-zinc-700 hover:bg-zinc-50"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div ref={applicationsDropdownRef} className="relative flex-1 sm:min-w-[min(100%,220px)] sm:flex-[1_1_calc(25%-0.45rem)]">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={applicationsOpen}
                onClick={() => {
                  setActiveSection("applications");
                  setApplicationsOpen((open) => !open);
                  setSecurityOpen(false);
                }}
                className={`flex min-h-[44px] w-full items-start justify-between gap-2 rounded-lg px-4 py-2.5 text-left transition-all duration-150 ${
                  applicationsTriggerActive
                    ? "bg-white text-zinc-900 shadow-[0_12px_26px_-18px_rgba(15,23,42,0.65)] ring-1 ring-[#dfe4ef]"
                    : "text-zinc-600 hover:bg-white/70 hover:text-zinc-900"
                }`}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-snug">Applications</span>
                  <span
                    className={`mt-0.5 block text-[11px] leading-snug ${applicationsTriggerActive ? "text-zinc-700" : "text-zinc-600"}`}
                  >
                    Calculator, calendar, and timer utilities — pick a tool below.
                  </span>
                </span>
                <ChevronIcon open={applicationsOpen} />
              </button>

              {applicationsOpen ? (
                <div
                  role="menu"
                  aria-label="Applications tools"
                  className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-20 overflow-hidden rounded-xl border border-[#dfe4ef] bg-white py-1.5 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.45)] sm:left-0 sm:right-auto sm:min-w-[min(100%,220px)]"
                >
                  {applicationsMenuItems.map((item) => {
                    const isCurrent = activeSection === "applications" && applicationsItem === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setApplicationsItem(item.id);
                          setActiveSection("applications");
                          setApplicationsOpen(false);
                        }}
                        className={`flex w-full items-center px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                          isCurrent ? "bg-zinc-100 text-zinc-900" : "text-zinc-700 hover:bg-zinc-50"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {plainTabs.map((tab) => {
              const isSelected = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(tab.id);
                    setSecurityOpen(false);
                    setApplicationsOpen(false);
                  }}
                  className={`min-h-[44px] flex-1 rounded-lg px-4 py-2.5 text-left transition-all duration-150 sm:min-w-[min(100%,220px)] sm:flex-[1_1_calc(25%-0.45rem)] ${
                    isSelected
                      ? "bg-white text-zinc-900 shadow-[0_12px_26px_-18px_rgba(15,23,42,0.65)] ring-1 ring-[#dfe4ef]"
                      : "text-zinc-600 hover:bg-white/70 hover:text-zinc-900"
                  }`}
                >
                  <span className="block text-sm font-semibold leading-snug">{tab.label}</span>
                  <span className={`mt-0.5 block text-[11px] leading-snug ${isSelected ? "text-zinc-700" : "text-zinc-600"}`}>
                    {tab.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <section className="overflow-hidden rounded-2xl border border-[#dfe4ef] bg-[#f8f9fc] p-8 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.6)]">
          {activeSection === "applications" && applicationsItem === "calculator" ? (
            <CalculatorSection />
          ) : activeSection === "applications" && applicationsItem === "calendar" ? (
            <CalendarSection />
          ) : activeSection === "applications" && applicationsItem === "timer" ? (
            <TimerSection />
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">{panel.kicker}</p>
              <h2 className="text-lg font-bold text-zinc-900">{panel.title}</h2>
              <p className="max-w-xl text-sm text-zinc-700">{panel.body}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {panel.placeholders.map((card) => (
                  <div
                    key={card}
                    className="rounded-xl border border-[#e8ecf5] bg-white/80 px-4 py-3 text-sm font-medium text-zinc-700 shadow-[0_8px_20px_-16px_rgba(15,23,42,0.45)]"
                  >
                    {card}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
