"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

export const currency = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 2,
});

export const compactCurrency = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function toInputDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromInputDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function shiftDate(value: string, days: number) {
  const date = fromInputDate(value);
  date.setDate(date.getDate() + days);
  return toInputDate(date);
}

export type ReportPreset = "today" | "yesterday" | "7d" | "30d" | "month" | "next7" | "next30" | "custom";
export type ReportRange = { from: string; to: string };

const reportPresets: { id: ReportPreset; label: string; upcoming?: boolean }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "month", label: "This month" },
  { id: "next7", label: "Next 7 days", upcoming: true },
  { id: "next30", label: "Next 30 days", upcoming: true },
  { id: "custom", label: "Custom" },
];

export function presetRange(preset: ReportPreset): ReportRange {
  const today = toInputDate(new Date());
  switch (preset) {
    case "next7":
      return { from: today, to: shiftDate(today, 6) };
    case "next30":
      return { from: today, to: shiftDate(today, 29) };
    case "yesterday": {
      const y = shiftDate(today, -1);
      return { from: y, to: y };
    }
    case "7d":
      return { from: shiftDate(today, -6), to: today };
    case "30d":
      return { from: shiftDate(today, -29), to: today };
    case "month": {
      const now = new Date();
      return { from: toInputDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: today };
    }
    default:
      return { from: today, to: today };
  }
}

export function useReportRange(initial: ReportPreset) {
  const [preset, setPreset] = useState<ReportPreset>(initial);
  const [range, setRange] = useState<ReportRange>(() => presetRange(initial));
  const choosePreset = useCallback((next: ReportPreset) => {
    setPreset(next);
    if (next !== "custom") setRange(presetRange(next));
  }, []);
  return { preset, range, choosePreset, setRange };
}

/** Fetches `path?from&to` for an inclusive local-date range; the payload must contain `readyKey`. */
export function useReportFetch<T extends object>(path: string, range: ReportRange, readyKey: keyof T) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const from = fromInputDate(range.from);
    const to = fromInputDate(range.to);
    to.setDate(to.getDate() + 1);

    setLoading(true);
    setError("");
    fetch(`${path}?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`)
      .then(async (response) => {
        const payload = (await response.json()) as T | { error?: string };
        if (cancelled) return;
        if (!response.ok || !(readyKey in payload)) {
          setError(("error" in payload && typeof payload.error === "string" && payload.error) || "Failed to load report.");
          setData(null);
          return;
        }
        setData(payload as T);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load report.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [path, range, readyKey, reloadKey]);

  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);
  return { data, loading, error, refresh };
}

export const reportInputClass =
  "h-9 rounded-lg border border-[#dfe4ef] bg-white px-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30";

export function PeriodPicker({
  preset,
  range,
  onPreset,
  onRange,
  allowFuture = false,
}: {
  preset: ReportPreset;
  range: ReportRange;
  onPreset: (preset: ReportPreset) => void;
  onRange: (range: ReportRange) => void;
  /** Adds upcoming presets and lets custom ranges end after today. */
  allowFuture?: boolean;
}) {
  const today = toInputDate(new Date());
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center print:hidden">
      <div className="flex flex-wrap gap-1 rounded-xl border border-[#dfe4ef] bg-[#f8f9fc] p-1">
        {reportPresets.filter((item) => allowFuture || !item.upcoming).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onPreset(item.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              preset === item.id
                ? "bg-white text-emerald-800 shadow-sm ring-1 ring-[#dfe4ef]"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {preset === "custom" ? (
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-600">
          <input
            type="date"
            value={range.from}
            max={range.to}
            onChange={(event) => event.target.value && onRange({ ...range, from: event.target.value })}
            className={reportInputClass}
          />
          <span>to</span>
          <input
            type="date"
            value={range.to}
            min={range.from}
            max={allowFuture ? undefined : today}
            onChange={(event) => event.target.value && onRange({ ...range, to: event.target.value })}
            className={reportInputClass}
          />
        </div>
      ) : null}
    </div>
  );
}

const rangeDateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export function formatReportRange(range: ReportRange) {
  const from = rangeDateFormat.format(fromInputDate(range.from));
  return range.from === range.to ? from : `${from} – ${rangeDateFormat.format(fromInputDate(range.to))}`;
}

export function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const body = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ReportActions({
  loading,
  onRefresh,
  onExport,
  exportDisabled,
}: {
  loading: boolean;
  onRefresh: () => void;
  onExport?: () => void;
  exportDisabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <button
        type="button"
        onClick={onRefresh}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dfe4ef] bg-white px-3 text-sm font-semibold text-zinc-800 hover:bg-[#f8f9fc]"
      >
        <svg {...iconProps} className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v6h6M20 20v-6h-6M5.5 15a7 7 0 0 0 12.4 2M18.5 9A7 7 0 0 0 6.1 7"
          />
        </svg>
        Refresh
      </button>
      {onExport ? (
        <button
          type="button"
          onClick={onExport}
          disabled={exportDisabled}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dfe4ef] bg-white px-3 text-sm font-semibold text-zinc-800 hover:bg-[#f8f9fc] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg {...iconProps}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" />
          </svg>
          Export CSV
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
      >
        <svg {...iconProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2M6 14h12v7H6v-7Z"
          />
        </svg>
        Print
      </button>
    </div>
  );
}

export function Delta({
  current,
  previous,
  invert = false,
  label = "prev. period",
}: {
  current: number;
  previous: number;
  invert?: boolean;
  label?: string;
}) {
  if (previous === 0 && current === 0) {
    return <span className="text-[11px] font-medium text-zinc-500">No change vs {label}</span>;
  }
  if (previous === 0) {
    return <span className="text-[11px] font-semibold text-emerald-700">New vs {label}</span>;
  }
  const change = ((current - previous) / previous) * 100;
  const up = change >= 0;
  const good = invert ? !up : up;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
        Math.abs(change) < 0.05 ? "text-zinc-500" : good ? "text-emerald-700" : "text-rose-700"
      }`}
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className={`h-3 w-3 ${up ? "" : "rotate-180"}`} aria-hidden>
        <path d="M10 4l6 8H4l6-8Z" />
      </svg>
      {Math.abs(change).toFixed(1)}% vs {label}
    </span>
  );
}

export function ReportSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="h-32 animate-pulse rounded-2xl border border-[#dfe4ef] bg-white/70" />
      ))}
    </div>
  );
}

export function ReportError({ message }: { message: string }) {
  return message ? (
    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
      {message}
    </div>
  ) : null;
}

export const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  className: "h-4 w-4",
  "aria-hidden": true,
} as const;

export function Card({
  title,
  subtitle,
  children,
  className = "",
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border border-[#dfe4ef] bg-white p-4 shadow-[0_16px_32px_-26px_rgba(15,23,42,0.55)] sm:p-5 ${className}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-zinc-900">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-zinc-600">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-[#dfe4ef] bg-[#f8f9fc] text-xs font-medium text-zinc-500">
      {label}
    </div>
  );
}

export function Breakdown({ rows }: { rows: { label: string; value: number; color: string }[] }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  return (
    <div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-zinc-100">
        {total > 0
          ? rows.map((row) =>
              row.value > 0 ? (
                <div key={row.label} className={row.color} style={{ width: `${(row.value / total) * 100}%` }} />
              ) : null,
            )
          : null}
      </div>
      <ul className="mt-3 space-y-2">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-2 text-xs">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${row.color}`} />
            <span className="flex-1 font-medium text-zinc-700">{row.label}</span>
            <span className="font-semibold tabular-nums text-zinc-900">{row.value}</span>
            <span className="w-10 text-right tabular-nums text-zinc-500">
              {total > 0 ? `${Math.round((row.value / total) * 100)}%` : "0%"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const kpiAccent = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  sky: "bg-sky-50 text-sky-700 ring-sky-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
  rose: "bg-rose-50 text-rose-700 ring-rose-100",
} as const;

export function Kpi({
  label,
  value,
  hint,
  accent,
  icon,
  delta,
}: {
  label: string;
  value: string;
  hint?: string;
  accent: keyof typeof kpiAccent;
  icon: ReactNode;
  delta?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#dfe4ef] bg-white p-4 shadow-[0_16px_32px_-26px_rgba(15,23,42,0.55)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">{label}</p>
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1 ${kpiAccent[accent]}`}>
          {icon}
        </span>
      </div>
      <p className="mt-2 truncate text-2xl font-bold tabular-nums text-zinc-900" title={value}>
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-zinc-600">{hint}</p> : null}
      {delta ? <div className="mt-2">{delta}</div> : null}
    </div>
  );
}
