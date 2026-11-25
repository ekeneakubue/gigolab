"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Breakdown,
  Card,
  Delta,
  EmptyState,
  Kpi,
  ReportActions,
  ReportError,
  ReportSkeleton,
  compactCurrency,
  currency,
  downloadCsv,
  fromInputDate,
  iconProps,
  reportInputClass,
  toInputDate,
  useReportFetch,
} from "./report-ui";

type MonthRow = {
  key: string;
  year: number;
  month: number;
  bills: number;
  billed: number;
  collected: number;
  payments: number;
  outstanding: number;
  paidAgainst: number;
  sameDay: number;
  arrears: number;
};

type AccountData = {
  range: { from: string; to: string };
  summary: {
    months: number;
    bills: number;
    billed: number;
    collected: number;
    payments: number;
    outstanding: number;
    paidAgainst: number;
    collectionRate: number;
    avgMonthlyBilled: number;
    avgMonthlyCollected: number;
    prevBilled: number;
    prevCollected: number;
    prevOutstanding: number;
    prevBills: number;
    prevPayments: number;
    peakMonth: string | null;
    peakCollectionMonth: string | null;
  };
  paymentStatus: Record<"Paid" | "Partial" | "Unpaid", number>;
  months: MonthRow[];
  years: { year: number; bills: number; billed: number; collected: number; outstanding: number; payments: number }[];
  methods: { method: string; count: number; amount: number }[];
  departments: { name: string; amount: number; tests: number }[];
  doctors: { name: string; bills: number; billed: number; outstanding: number }[];
};

type Preset = "this-year" | "last-year" | "ytd" | "last-6" | "last-12" | "custom";

type ReportRange = { from: string; to: string };

const presets: { id: Preset; label: string }[] = [
  { id: "this-year", label: "This year" },
  { id: "last-year", label: "Last year" },
  { id: "ytd", label: "Year to date" },
  { id: "last-6", label: "Last 6 months" },
  { id: "last-12", label: "Last 12 months" },
  { id: "custom", label: "Custom" },
];

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const rangeLabel = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });

function monthStart(year: number, monthIndex: number) {
  return toInputDate(new Date(year, monthIndex, 1));
}

function monthEndExclusiveAsInput(year: number, monthIndex: number) {
  // Inclusive end month for the date picker: last day of that month.
  return toInputDate(new Date(year, monthIndex + 1, 0));
}

function presetRange(preset: Preset): ReportRange {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (preset) {
    case "last-year":
      return { from: monthStart(y - 1, 0), to: monthEndExclusiveAsInput(y - 1, 11) };
    case "ytd":
      return { from: monthStart(y, 0), to: toInputDate(now) };
    case "last-6": {
      const from = new Date(y, m - 5, 1);
      return { from: toInputDate(from), to: toInputDate(now) };
    }
    case "last-12": {
      const from = new Date(y, m - 11, 1);
      return { from: toInputDate(from), to: toInputDate(now) };
    }
    case "this-year":
    default:
      return { from: monthStart(y, 0), to: toInputDate(now) };
  }
}

function formatMonthKey(key: string | null) {
  if (!key) return "—";
  const [year, month] = key.split("-").map(Number);
  return `${monthNames[(month ?? 1) - 1]} ${year}`;
}

function formatPeriod(range: ReportRange) {
  const from = fromInputDate(range.from);
  const to = fromInputDate(range.to);
  return `${rangeLabel.format(from)} – ${rangeLabel.format(to)}`;
}

export default function MonthlyAnnualAccount() {
  const [preset, setPreset] = useState<Preset>("this-year");
  const [range, setRange] = useState<ReportRange>(() => presetRange("this-year"));
  const [query, setQuery] = useState("");

  // useReportFetch appends +1 day to `to`, so pass an inclusive calendar end.
  const fetchRange = useMemo(() => {
    const from = fromInputDate(range.from);
    from.setDate(1);
    return { from: toInputDate(from), to: range.to };
  }, [range]);

  const { data, loading, error, refresh } = useReportFetch<AccountData>(
    "/api/company/reports/monthly-annual-account",
    fetchRange,
    "summary",
  );

  useEffect(() => {
    setQuery("");
  }, [data]);

  const choosePreset = (next: Preset) => {
    setPreset(next);
    if (next !== "custom") setRange(presetRange(next));
  };

  const filteredMonths = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data.months;
    return data.months.filter((row) => formatMonthKey(row.key).toLowerCase().includes(q));
  }, [data, query]);

  const exportCsv = () => {
    if (!data) return;
    downloadCsv(
      `monthly-annual-account_${range.from}_${range.to}.csv`,
      [
        "Month",
        "Bills",
        "Billed",
        "Collected",
        "Receipts",
        "Outstanding",
        "Paid against bills",
        "Same-month collections",
        "Arrears collections",
        "Collection rate %",
      ],
      filteredMonths.map((row) => [
        formatMonthKey(row.key),
        row.bills,
        row.billed.toFixed(2),
        row.collected.toFixed(2),
        row.payments,
        row.outstanding.toFixed(2),
        row.paidAgainst.toFixed(2),
        row.sameDay.toFixed(2),
        row.arrears.toFixed(2),
        row.billed > 0 ? ((row.paidAgainst / row.billed) * 100).toFixed(1) : "0",
      ]),
    );
  };

  const summary = data?.summary;
  const billedMax = Math.max(0, ...(data?.months.map((row) => Math.max(row.billed, row.collected)) ?? [0]));
  const methodTotal = data?.methods.reduce((sum, row) => sum + row.amount, 0) ?? 0;
  const deptTotal = data?.departments.reduce((sum, row) => sum + row.amount, 0) ?? 0;
  const today = toInputDate(new Date());

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="rounded-2xl border border-[#dfe4ef] bg-white p-4 shadow-[0_16px_32px_-26px_rgba(15,23,42,0.55)] sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
              Monthly / annual account
            </p>
            <h2 className="mt-1 text-lg font-bold text-zinc-900">{formatPeriod(range)}</h2>
            <p className="mt-0.5 text-xs text-zinc-600">
              Period billing, collections, outstanding dues and year-on-year account movement.
            </p>
          </div>
          <ReportActions
            loading={loading}
            onRefresh={refresh}
            onExport={exportCsv}
            exportDisabled={!data || filteredMonths.length === 0}
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-[#eef1f6] pt-4 md:flex-row md:items-center print:hidden">
          <div className="flex flex-wrap gap-1 rounded-xl border border-[#dfe4ef] bg-[#f8f9fc] p-1">
            {presets.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => choosePreset(item.id)}
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
                onChange={(event) => event.target.value && setRange((r) => ({ ...r, from: event.target.value }))}
                className={reportInputClass}
              />
              <span>to</span>
              <input
                type="date"
                value={range.to}
                min={range.from}
                max={today}
                onChange={(event) => event.target.value && setRange((r) => ({ ...r, to: event.target.value }))}
                className={reportInputClass}
              />
            </div>
          ) : null}
        </div>
      </section>

      <ReportError message={error} />

      {loading && !data ? <ReportSkeleton count={8} /> : null}

      {data && summary ? (
        <div className={`space-y-4 transition-opacity sm:space-y-5 ${loading ? "opacity-60" : ""}`}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <Kpi
              label="Total billed"
              value={currency.format(summary.billed)}
              hint={`${summary.bills} bill${summary.bills === 1 ? "" : "s"} · avg ${compactCurrency.format(summary.avgMonthlyBilled)}/mo`}
              accent="indigo"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21V3ZM10 8h4M10 12h4" />
                </svg>
              }
              delta={<Delta current={summary.billed} previous={summary.prevBilled} />}
            />
            <Kpi
              label="Total collected"
              value={currency.format(summary.collected)}
              hint={`${summary.payments} receipt${summary.payments === 1 ? "" : "s"} · avg ${compactCurrency.format(summary.avgMonthlyCollected)}/mo`}
              accent="emerald"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18v10H3V7Zm9 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                </svg>
              }
              delta={<Delta current={summary.collected} previous={summary.prevCollected} />}
            />
            <Kpi
              label="Outstanding"
              value={currency.format(summary.outstanding)}
              hint={`${summary.collectionRate.toFixed(0)}% of period billing settled`}
              accent="amber"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2.5 2.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              }
              delta={<Delta current={summary.outstanding} previous={summary.prevOutstanding} invert />}
            />
            <Kpi
              label="Peak billing month"
              value={formatMonthKey(summary.peakMonth)}
              hint={
                summary.peakMonth
                  ? currency.format(data.months.find((row) => row.key === summary.peakMonth)?.billed ?? 0)
                  : "No billing in period"
              }
              accent="sky"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16M7 15V9M12 15V5M17 15v-3" />
                </svg>
              }
            />
            <Kpi
              label="Peak collection month"
              value={formatMonthKey(summary.peakCollectionMonth)}
              hint={
                summary.peakCollectionMonth
                  ? currency.format(
                      data.months.find((row) => row.key === summary.peakCollectionMonth)?.collected ?? 0,
                    )
                  : "No collections in period"
              }
              accent="violet"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              }
            />
            <Kpi
              label="Months covered"
              value={String(summary.months)}
              hint={`${data.years.length} calendar year${data.years.length === 1 ? "" : "s"}`}
              accent="rose"
              icon={
                <svg {...iconProps}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 3v3M16 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
                  />
                </svg>
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3 sm:gap-5">
            <Card title="Monthly billed vs collected" subtitle="Bars scale to the period peak" className="lg:col-span-2">
              {billedMax === 0 ? (
                <EmptyState label="No billing or collections in this period." />
              ) : (
                <div>
                  <div className="flex h-52 items-end gap-1.5">
                    {data.months.map((row) => (
                      <div key={row.key} className="group relative flex h-full min-w-0 flex-1 flex-col justify-end gap-0.5">
                        <div
                          className="w-full rounded-t-md bg-indigo-300"
                          style={{ height: `${row.billed > 0 ? Math.max(4, (row.billed / billedMax) * 100) : 1.5}%` }}
                        />
                        <div
                          className="w-full rounded-t-md bg-emerald-500"
                          style={{
                            height: `${row.collected > 0 ? Math.max(4, (row.collected / billedMax) * 100) : 1.5}%`,
                          }}
                        />
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-900 px-2 py-1 text-[10px] font-medium text-white shadow-lg group-hover:block">
                          {formatMonthKey(row.key)} · billed {compactCurrency.format(row.billed)} · collected{" "}
                          {compactCurrency.format(row.collected)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-1.5 text-[10px] font-medium text-zinc-500">
                    {data.months.map((row, index) => {
                      const step = Math.max(1, Math.ceil(data.months.length / 8));
                      return (
                        <span key={row.key} className="min-w-0 flex-1 truncate text-center">
                          {index % step === 0 ? monthNames[row.month - 1] : ""}
                        </span>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex gap-4 text-[11px] text-zinc-600">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm bg-indigo-300" />
                      Billed
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                      Collected
                    </span>
                  </div>
                </div>
              )}
            </Card>

            <Card title="Bill settlement" subtitle="Payment status of bills raised in period">
              <Breakdown
                rows={[
                  { label: "Paid", value: data.paymentStatus.Paid, color: "bg-emerald-500" },
                  { label: "Partial", value: data.paymentStatus.Partial, color: "bg-amber-400" },
                  { label: "Unpaid", value: data.paymentStatus.Unpaid, color: "bg-rose-500" },
                ]}
              />
              <div className="mt-5 space-y-2 border-t border-[#eef1f6] pt-4 text-xs">
                <div className="flex justify-between gap-3">
                  <span className="text-zinc-600">Paid against period bills</span>
                  <span className="font-semibold tabular-nums text-zinc-900">
                    {currency.format(summary.paidAgainst)}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-zinc-600">Still outstanding</span>
                  <span className="font-semibold tabular-nums text-rose-700">
                    {currency.format(summary.outstanding)}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3 sm:gap-5">
            <Card title="Year comparison" subtitle="Calendar years inside the selected range">
              {data.years.length === 0 ? (
                <EmptyState label="No years to compare." />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#dfe4ef]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f3f5fa] text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                      <tr>
                        <th className="px-3 py-2">Year</th>
                        <th className="px-3 py-2 text-right">Billed</th>
                        <th className="px-3 py-2 text-right">Collected</th>
                        <th className="px-3 py-2 text-right">Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eef1f6]">
                      {data.years.map((row) => (
                        <tr key={row.year} className="hover:bg-[#f8f9fc]">
                          <td className="px-3 py-2.5 font-semibold text-zinc-800">{row.year}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700">
                            {compactCurrency.format(row.billed)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-emerald-700">
                            {compactCurrency.format(row.collected)}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-rose-700">
                            {compactCurrency.format(row.outstanding)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card title="Collections by method" subtitle={`${currency.format(methodTotal)} received`}>
              {data.methods.length === 0 ? (
                <EmptyState label="No payments in this period." />
              ) : (
                <ul className="space-y-3">
                  {data.methods.map((row) => {
                    const share = methodTotal > 0 ? (row.amount / methodTotal) * 100 : 0;
                    return (
                      <li key={row.method}>
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-zinc-800">{row.method}</span>
                          <span className="tabular-nums text-zinc-600">
                            {compactCurrency.format(row.amount)} · {row.count}
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${share}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card title="Department revenue" subtitle="From tests billed in period">
              {deptTotal === 0 ? (
                <EmptyState label="No department revenue in this period." />
              ) : (
                <ul className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
                  {data.departments
                    .filter((row) => row.amount > 0)
                    .map((row) => (
                      <li key={row.name}>
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="min-w-0 flex-1 truncate font-semibold text-zinc-800">{row.name}</span>
                          <span className="shrink-0 font-semibold tabular-nums text-zinc-900">
                            {compactCurrency.format(row.amount)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                            <div
                              className="h-full rounded-full bg-indigo-500"
                              style={{ width: `${(row.amount / deptTotal) * 100}%` }}
                            />
                          </div>
                          <span className="w-14 text-right text-[10px] tabular-nums text-zinc-500">{row.tests} tests</span>
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-5 sm:gap-5">
            <Card title="Top referral sources" subtitle="Highest billed referring doctors" className="lg:col-span-2">
              {data.doctors.length === 0 ? (
                <EmptyState label="No referral billing in this period." />
              ) : (
                <ol className="space-y-2">
                  {data.doctors.map((row, index) => (
                    <li
                      key={row.name}
                      className="flex items-center gap-3 rounded-xl border border-[#eef1f6] bg-[#f8f9fc] px-3 py-2"
                    >
                      <span
                        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                          index === 0 ? "bg-emerald-600 text-white" : "bg-white text-zinc-700 ring-1 ring-[#dfe4ef]"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-zinc-800">{row.name}</p>
                        <p className="text-[11px] text-zinc-500">
                          {row.bills} bill{row.bills === 1 ? "" : "s"} · due {compactCurrency.format(row.outstanding)}
                        </p>
                      </div>
                      <span className="text-xs font-semibold tabular-nums text-zinc-900">
                        {compactCurrency.format(row.billed)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>

            <Card
              title="Month-by-month ledger"
              subtitle={`${filteredMonths.length} month${filteredMonths.length === 1 ? "" : "s"}`}
              className="lg:col-span-3"
              action={
                <div className="relative print:hidden">
                  <svg
                    {...iconProps}
                    className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400"
                  >
                    <path strokeLinecap="round" d="M21 21l-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z" />
                  </svg>
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Filter months"
                    className={`${reportInputClass} h-8 w-40 pl-8 text-xs`}
                  />
                </div>
              }
            >
              {filteredMonths.length === 0 ? (
                <EmptyState label="No months match this filter." />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#dfe4ef]">
                  <table className="w-full min-w-[720px] text-left text-xs">
                    <thead className="bg-[#f3f5fa] text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                      <tr>
                        <th className="px-3 py-2">Month</th>
                        <th className="px-3 py-2 text-right">Bills</th>
                        <th className="px-3 py-2 text-right">Billed</th>
                        <th className="px-3 py-2 text-right">Collected</th>
                        <th className="px-3 py-2 text-right">Due</th>
                        <th className="px-3 py-2 text-right">Rate</th>
                        <th className="px-3 py-2">Collections mix</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eef1f6]">
                      {filteredMonths.map((row) => {
                        const rate = row.billed > 0 ? Math.round((row.paidAgainst / row.billed) * 100) : 0;
                        const mixTotal = row.sameDay + row.arrears;
                        return (
                          <tr key={row.key} className="hover:bg-[#f8f9fc]">
                            <td className="px-3 py-2.5 font-semibold text-zinc-800">{formatMonthKey(row.key)}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700">{row.bills}</td>
                            <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-zinc-900">
                              {currency.format(row.billed)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-emerald-700">
                              {currency.format(row.collected)}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-rose-700">
                              {currency.format(row.outstanding)}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums ${
                                  rate >= 80
                                    ? "bg-emerald-50 text-emerald-700"
                                    : rate >= 50
                                      ? "bg-amber-50 text-amber-700"
                                      : "bg-rose-50 text-rose-700"
                                }`}
                              >
                                {rate}%
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              {mixTotal > 0 ? (
                                <>
                                  <div className="flex h-1.5 overflow-hidden rounded-full bg-zinc-100">
                                    <div
                                      className="bg-emerald-500"
                                      style={{ width: `${(row.sameDay / mixTotal) * 100}%` }}
                                    />
                                    <div
                                      className="bg-sky-500"
                                      style={{ width: `${(row.arrears / mixTotal) * 100}%` }}
                                    />
                                  </div>
                                  <p className="mt-1 text-[10px] text-zinc-500">
                                    {compactCurrency.format(row.sameDay)} same-mo ·{" "}
                                    {compactCurrency.format(row.arrears)} arrears
                                  </p>
                                </>
                              ) : (
                                <span className="text-[11px] text-zinc-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
