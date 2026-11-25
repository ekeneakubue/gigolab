"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Breakdown,
  Card,
  Delta as SharedDelta,
  EmptyState,
  Kpi,
  compactCurrency,
  currency,
  fromInputDate,
  iconProps,
  shiftDate,
  toInputDate,
} from "./report-ui";

type Totals = {
  requests: number;
  tests: number;
  billed: number;
  collected: number;
  payments: number;
  outstanding: number;
  newPatients: number;
  appointments: number;
};

type FlashSummary = {
  range: { from: string; to: string };
  current: Totals;
  previous: Totals;
  hourly: { hour: number; requests: number; amount: number }[];
  status: Record<string, number>;
  priority: Record<string, number>;
  paymentStatus: Record<string, number>;
  paymentMethods: { method: string; count: number; amount: number }[];
  departments: { name: string; tests: number; amount: number }[];
  topTests: { name: string; count: number; amount: number }[];
  topDoctors: { name: string; requests: number; amount: number }[];
  appointmentStatus: Record<string, number>;
};

const longDate = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

function hourLabel(hour: number) {
  const suffix = hour < 12 ? "a" : "p";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${suffix}`;
}

function Delta(props: { current: number; previous: number; invert?: boolean }) {
  return <SharedDelta {...props} label="prev. day" />;
}

export default function DailyFlashSummary() {
  const [date, setDate] = useState(() => toInputDate(new Date()));
  const [data, setData] = useState<FlashSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const today = toInputDate(new Date());
  const isToday = date === today;

  useEffect(() => {
    let cancelled = false;
    const from = fromInputDate(date);
    const to = new Date(from);
    to.setDate(to.getDate() + 1);

    setLoading(true);
    setError("");
    fetch(
      `/api/company/reports/daily-flash-summary?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
    )
      .then(async (response) => {
        const payload = (await response.json()) as FlashSummary | { error?: string };
        if (cancelled) return;
        if (!response.ok || !("current" in payload)) {
          setError(("error" in payload && payload.error) || "Failed to load summary.");
          setData(null);
          return;
        }
        setData(payload);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load summary.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [date, reloadKey]);

  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

  const hourly = useMemo(() => {
    if (!data) return { rows: [], max: 0, peak: null as null | { hour: number; requests: number } };
    const max = Math.max(0, ...data.hourly.map((row) => row.requests));
    const peak = max > 0 ? data.hourly.find((row) => row.requests === max) ?? null : null;
    return { rows: data.hourly, max, peak };
  }, [data]);

  const current = data?.current;
  const previous = data?.previous;
  const collectionRate =
    current && current.billed > 0 ? Math.min(100, ((current.billed - current.outstanding) / current.billed) * 100) : 0;
  const methodTotal = data?.paymentMethods.reduce((sum, row) => sum + row.amount, 0) ?? 0;
  const deptMax = Math.max(0, ...(data?.departments.map((row) => row.amount) ?? [0]));

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="flex flex-col gap-3 rounded-2xl border border-[#dfe4ef] bg-white p-4 shadow-[0_16px_32px_-26px_rgba(15,23,42,0.55)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">Daily flash summary</p>
          <h2 className="mt-1 text-lg font-bold text-zinc-900">{longDate.format(fromInputDate(date))}</h2>
          <p className="mt-0.5 text-xs text-zinc-600">
            Snapshot of billing, collections and lab activity, compared with the previous day.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <div className="flex items-center rounded-xl border border-[#dfe4ef] bg-[#f8f9fc] p-1">
            <button
              type="button"
              aria-label="Previous day"
              onClick={() => setDate((value) => shiftDate(value, -1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-700 hover:bg-white"
            >
              <svg {...iconProps}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
              </svg>
            </button>
            <input
              type="date"
              value={date}
              max={today}
              onChange={(event) => event.target.value && setDate(event.target.value)}
              className="h-8 rounded-lg border-0 bg-transparent px-2 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              aria-label="Next day"
              disabled={isToday}
              onClick={() => setDate((value) => shiftDate(value, 1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg {...iconProps}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
          {!isToday ? (
            <button
              type="button"
              onClick={() => setDate(today)}
              className="h-10 rounded-xl border border-[#dfe4ef] bg-white px-3 text-sm font-semibold text-zinc-800 hover:bg-[#f8f9fc]"
            >
              Today
            </button>
          ) : null}
          <button
            type="button"
            onClick={refresh}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dfe4ef] bg-white px-3 text-sm font-semibold text-zinc-800 hover:bg-[#f8f9fc]"
          >
            <svg {...iconProps} className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6M20 20v-6h-6M5.5 15a7 7 0 0 0 12.4 2M18.5 9A7 7 0 0 0 6.1 7" />
            </svg>
            Refresh
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <svg {...iconProps}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2M6 14h12v7H6v-7Z" />
            </svg>
            Print
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
          {error}
        </div>
      ) : null}

      {loading && !data ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl border border-[#dfe4ef] bg-white/70" />
          ))}
        </div>
      ) : null}

      {data && current && previous ? (
        <div className={`space-y-4 transition-opacity sm:space-y-5 ${loading ? "opacity-60" : ""}`}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              label="Total billed"
              value={currency.format(current.billed)}
              hint={`${current.requests} request${current.requests === 1 ? "" : "s"}`}
              accent="indigo"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21V3ZM10 8h4M10 12h4" />
                </svg>
              }
              delta={<Delta current={current.billed} previous={previous.billed} />}
            />
            <Kpi
              label="Collected"
              value={currency.format(current.collected)}
              hint={`${current.payments} payment${current.payments === 1 ? "" : "s"} received`}
              accent="emerald"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18v10H3V7Zm9 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                </svg>
              }
              delta={<Delta current={current.collected} previous={previous.collected} />}
            />
            <Kpi
              label="Outstanding"
              value={currency.format(current.outstanding)}
              hint={`${collectionRate.toFixed(0)}% of today's billing settled`}
              accent="amber"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2.5 2.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              }
              delta={<Delta current={current.outstanding} previous={previous.outstanding} invert />}
            />
            <Kpi
              label="Tests ordered"
              value={String(current.tests)}
              hint={`Avg ${current.requests > 0 ? (current.tests / current.requests).toFixed(1) : "0"} per request`}
              accent="sky"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" />
                </svg>
              }
              delta={<Delta current={current.tests} previous={previous.tests} />}
            />
            <Kpi
              label="New patients"
              value={String(current.newPatients)}
              hint="Registered on this day"
              accent="violet"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19a6 6 0 0 0-12 0M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6" />
                </svg>
              }
              delta={<Delta current={current.newPatients} previous={previous.newPatients} />}
            />
            <Kpi
              label="Appointments"
              value={String(current.appointments)}
              hint={`${data.appointmentStatus.Completed ?? 0} completed · ${data.appointmentStatus.Cancelled ?? 0} cancelled`}
              accent="rose"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v3M16 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
                </svg>
              }
              delta={<Delta current={current.appointments} previous={previous.appointments} />}
            />
            <Kpi
              label="Avg. bill value"
              value={currency.format(current.requests > 0 ? current.billed / current.requests : 0)}
              hint="Per test request"
              accent="indigo"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16M7 15V9M12 15V5M17 15v-3" />
                </svg>
              }
              delta={
                <Delta
                  current={current.requests > 0 ? current.billed / current.requests : 0}
                  previous={previous.requests > 0 ? previous.billed / previous.requests : 0}
                />
              }
            />
            <Kpi
              label="Completed requests"
              value={String(data.status.Completed ?? 0)}
              hint={`${data.status.Pending ?? 0} pending · ${data.status.InProgress ?? 0} in progress`}
              accent="emerald"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              }
              delta={
                <span className="text-[11px] font-medium text-zinc-500">
                  {current.requests > 0
                    ? `${Math.round(((data.status.Completed ?? 0) / current.requests) * 100)}% completion rate`
                    : "No requests yet"}
                </span>
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3 sm:gap-5">
            <Card
              title="Hourly activity"
              subtitle={
                hourly.peak
                  ? `Peak at ${hourLabel(hourly.peak.hour)} with ${hourly.peak.requests} request${hourly.peak.requests === 1 ? "" : "s"}`
                  : "Requests registered per hour"
              }
              className="lg:col-span-2"
            >
              {hourly.max === 0 ? (
                <EmptyState label="No requests registered on this day." />
              ) : (
                <div>
                  <div className="flex h-44 items-end gap-1">
                    {hourly.rows.map((row) => (
                      <div key={row.hour} className="group relative flex h-full flex-1 flex-col justify-end">
                        <div
                          className={`w-full rounded-t-md transition-colors ${
                            row.requests === hourly.max ? "bg-emerald-600" : "bg-emerald-200 group-hover:bg-emerald-400"
                          }`}
                          style={{ height: `${row.requests > 0 ? Math.max(6, (row.requests / hourly.max) * 100) : 2}%` }}
                        />
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-900 px-2 py-1 text-[10px] font-medium text-white shadow-lg group-hover:block">
                          {hourLabel(row.hour)} · {row.requests} req · {compactCurrency.format(row.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-1 text-[10px] font-medium text-zinc-500">
                    {hourly.rows.map((row) => (
                      <span key={row.hour} className="flex-1 text-center">
                        {row.hour % 3 === 0 ? hourLabel(row.hour) : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card title="Collections by method" subtitle={`${currency.format(methodTotal)} received`}>
              {data.paymentMethods.length === 0 ? (
                <EmptyState label="No payments received." />
              ) : (
                <ul className="space-y-3">
                  {data.paymentMethods.map((row) => {
                    const share = methodTotal > 0 ? (row.amount / methodTotal) * 100 : 0;
                    return (
                      <li key={row.method}>
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-zinc-800">{row.method}</span>
                          <span className="tabular-nums text-zinc-600">
                            {currency.format(row.amount)} · {row.count}
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
          </div>

          <div className="grid gap-4 md:grid-cols-3 sm:gap-5">
            <Card title="Request status" subtitle="Processing progress">
              <Breakdown
                rows={[
                  { label: "Completed", value: data.status.Completed ?? 0, color: "bg-emerald-500" },
                  { label: "In progress", value: data.status.InProgress ?? 0, color: "bg-sky-500" },
                  { label: "Pending", value: data.status.Pending ?? 0, color: "bg-amber-400" },
                ]}
              />
            </Card>
            <Card title="Payment status" subtitle="Settlement of today's bills">
              <Breakdown
                rows={[
                  { label: "Paid", value: data.paymentStatus.Paid ?? 0, color: "bg-emerald-500" },
                  { label: "Partial", value: data.paymentStatus.Partial ?? 0, color: "bg-amber-400" },
                  { label: "Unpaid", value: data.paymentStatus.Unpaid ?? 0, color: "bg-rose-500" },
                ]}
              />
            </Card>
            <Card title="Priority mix" subtitle="Urgency of requests">
              <Breakdown
                rows={[
                  { label: "Routine", value: data.priority.Routine ?? 0, color: "bg-zinc-400" },
                  { label: "Urgent", value: data.priority.Urgent ?? 0, color: "bg-amber-500" },
                  { label: "STAT", value: data.priority.STAT ?? 0, color: "bg-rose-600" },
                ]}
              />
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 sm:gap-5">
            <Card title="Department performance" subtitle="Tests and revenue by department">
              {data.departments.length === 0 ? (
                <EmptyState label="No tests ordered." />
              ) : (
                <div className="overflow-hidden rounded-xl border border-[#dfe4ef]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f3f5fa] text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                      <tr>
                        <th className="px-3 py-2">Department</th>
                        <th className="px-3 py-2 text-right">Tests</th>
                        <th className="px-3 py-2 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eef1f6]">
                      {data.departments.map((row) => (
                        <tr key={row.name} className="hover:bg-[#f8f9fc]">
                          <td className="px-3 py-2.5">
                            <p className="font-semibold text-zinc-800">{row.name}</p>
                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                              <div
                                className="h-full rounded-full bg-indigo-500"
                                style={{ width: `${deptMax > 0 ? (row.amount / deptMax) * 100 : 0}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700">{row.tests}</td>
                          <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-zinc-900">
                            {currency.format(row.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card title="Top tests" subtitle="Most ordered tests of the day">
              {data.topTests.length === 0 ? (
                <EmptyState label="No tests ordered." />
              ) : (
                <ol className="space-y-2">
                  {data.topTests.map((row, index) => (
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
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-zinc-800">{row.name}</span>
                      <span className="text-xs tabular-nums text-zinc-600">×{row.count}</span>
                      <span className="w-24 text-right text-xs font-semibold tabular-nums text-zinc-900">
                        {currency.format(row.amount)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3 sm:gap-5">
            <Card title="Referral sources" subtitle="Requests by referring doctor" className="lg:col-span-2">
              {data.topDoctors.length === 0 ? (
                <EmptyState label="No referrals on this day." />
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {data.topDoctors.map((row) => (
                    <div
                      key={row.name}
                      className="flex items-center gap-3 rounded-xl border border-[#eef1f6] bg-[#f8f9fc] px-3 py-2.5"
                    >
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-800">
                        {row.name
                          .replace(/^dr\.?\s*/i, "")
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((part) => part[0]?.toUpperCase() ?? "")
                          .join("")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-zinc-800">{row.name}</p>
                        <p className="text-[11px] text-zinc-600">
                          {row.requests} request{row.requests === 1 ? "" : "s"}
                        </p>
                      </div>
                      <span className="text-xs font-semibold tabular-nums text-zinc-900">
                        {compactCurrency.format(row.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Appointments" subtitle="Scheduled for this day">
              <Breakdown
                rows={[
                  { label: "Completed", value: data.appointmentStatus.Completed ?? 0, color: "bg-emerald-500" },
                  { label: "Confirmed", value: data.appointmentStatus.Confirmed ?? 0, color: "bg-sky-500" },
                  { label: "Pending", value: data.appointmentStatus.Pending ?? 0, color: "bg-amber-400" },
                  { label: "Cancelled", value: data.appointmentStatus.Cancelled ?? 0, color: "bg-rose-500" },
                ]}
              />
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
