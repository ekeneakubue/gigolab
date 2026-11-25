"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
  shiftDate,
  toInputDate,
} from "./report-ui";

type PaymentStatus = "Paid" | "Partial" | "Unpaid";

type PaymentRow = {
  id: string;
  requestCode: string;
  patientName: string;
  patientCode: string;
  doctorName: string;
  billedAt: string;
  paidAt: string;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  paymentRef: string;
  sameDay: boolean;
};

type DueRow = {
  id: string;
  requestCode: string;
  patientName: string;
  patientCode: string;
  doctorName: string;
  billedAt: string;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
};

type AccountData = {
  range: { from: string; to: string };
  summary: {
    bills: number;
    billed: number;
    collected: number;
    payments: number;
    outstanding: number;
    paidAgainstToday: number;
    sameDayCollections: number;
    arrearsCollections: number;
    openingDues: number;
    openingDueBills: number;
    cashCollected: number;
    nonCashCollected: number;
    collectionRate: number;
    prevBilled: number;
    prevCollected: number;
    prevOutstanding: number;
    prevBills: number;
    prevPayments: number;
  };
  paymentStatus: Record<PaymentStatus, number>;
  methods: { method: string; count: number; amount: number; sameDay: number; arrears: number }[];
  hourly: { hour: number; billed: number; collected: number }[];
  doctors: { name: string; bills: number; billed: number; collected: number; outstanding: number }[];
  payments: PaymentRow[];
  dues: DueRow[];
};

type RegisterTab = "payments" | "dues";

const longDate = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

const timeLabel = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

const statusBadge: Record<PaymentStatus, string> = {
  Paid: "bg-emerald-100 text-emerald-800",
  Partial: "bg-amber-100 text-amber-800",
  Unpaid: "bg-rose-100 text-rose-800",
};

const methodTone: Record<string, string> = {
  Cash: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  Card: "bg-sky-50 text-sky-800 ring-sky-100",
  Transfer: "bg-indigo-50 text-indigo-800 ring-indigo-100",
  POS: "bg-violet-50 text-violet-800 ring-violet-100",
  Insurance: "bg-amber-50 text-amber-800 ring-amber-100",
};

function hourLabel(hour: number) {
  const suffix = hour < 12 ? "a" : "p";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${suffix}`;
}

function methodClass(method: string) {
  return methodTone[method] ?? "bg-zinc-100 text-zinc-700 ring-zinc-200";
}

export default function DailyAccountSummary() {
  const [date, setDate] = useState(() => toInputDate(new Date()));
  const [data, setData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [register, setRegister] = useState<RegisterTab>("payments");
  const [query, setQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("");

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
      `/api/company/reports/daily-account-summary?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
    )
      .then(async (response) => {
        const payload = (await response.json()) as AccountData | { error?: string };
        if (cancelled) return;
        if (!response.ok || !("summary" in payload)) {
          setError(("error" in payload && payload.error) || "Failed to load daily account summary.");
          setData(null);
          return;
        }
        setData(payload);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load daily account summary.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [date, reloadKey]);

  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

  const filteredPayments = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.payments.filter((row) => {
      if (methodFilter && row.paymentMethod !== methodFilter) return false;
      if (!q) return true;
      return `${row.requestCode} ${row.patientName} ${row.patientCode} ${row.paymentRef} ${row.doctorName}`
        .toLowerCase()
        .includes(q);
    });
  }, [data, query, methodFilter]);

  const filteredDues = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.dues.filter((row) => {
      if (!q) return true;
      return `${row.requestCode} ${row.patientName} ${row.patientCode} ${row.doctorName}`.toLowerCase().includes(q);
    });
  }, [data, query]);

  const exportCsv = () => {
    if (register === "payments") {
      downloadCsv(
        `daily-account-payments_${date}.csv`,
        [
          "Paid at",
          "Request",
          "Patient",
          "Patient code",
          "Referred by",
          "Bill amount",
          "Amount paid",
          "Balance",
          "Method",
          "Reference",
          "Status",
          "Same-day bill",
        ],
        filteredPayments.map((row) => [
          new Date(row.paidAt).toLocaleString(),
          row.requestCode,
          row.patientName,
          row.patientCode,
          row.doctorName,
          row.totalAmount.toFixed(2),
          row.amountPaid.toFixed(2),
          row.balance.toFixed(2),
          row.paymentMethod,
          row.paymentRef,
          row.paymentStatus,
          row.sameDay ? "Yes" : "No",
        ]),
      );
      return;
    }
    downloadCsv(
      `daily-account-dues_${date}.csv`,
      [
        "Billed at",
        "Request",
        "Patient",
        "Patient code",
        "Referred by",
        "Bill amount",
        "Amount paid",
        "Balance",
        "Status",
        "Method",
      ],
      filteredDues.map((row) => [
        new Date(row.billedAt).toLocaleString(),
        row.requestCode,
        row.patientName,
        row.patientCode,
        row.doctorName,
        row.totalAmount.toFixed(2),
        row.amountPaid.toFixed(2),
        row.balance.toFixed(2),
        row.paymentStatus,
        row.paymentMethod,
      ]),
    );
  };

  const summary = data?.summary;
  const hourlyMax = Math.max(0, ...(data?.hourly.flatMap((row) => [row.billed, row.collected]) ?? [0]));
  const methodTotal = data?.methods.reduce((sum, row) => sum + row.amount, 0) ?? 0;
  const closingDues = summary ? summary.openingDues + summary.billed - summary.paidAgainstToday : 0;

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="flex flex-col gap-3 rounded-2xl border border-[#dfe4ef] bg-white p-4 shadow-[0_16px_32px_-26px_rgba(15,23,42,0.55)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">Daily account summary</p>
          <h2 className="mt-1 text-lg font-bold text-zinc-900">{longDate.format(fromInputDate(date))}</h2>
          <p className="mt-0.5 text-xs text-zinc-600">
            Day-end billing, collections by method and outstanding dues for cash-up and reconciliation.
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
          <ReportActions
            loading={loading}
            onRefresh={refresh}
            onExport={exportCsv}
            exportDisabled={register === "payments" ? filteredPayments.length === 0 : filteredDues.length === 0}
          />
        </div>
      </section>

      <ReportError message={error} />

      {loading && !data ? <ReportSkeleton count={8} /> : null}

      {data && summary ? (
        <div className={`space-y-4 transition-opacity sm:space-y-5 ${loading ? "opacity-60" : ""}`}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              label="Billed today"
              value={currency.format(summary.billed)}
              hint={`${summary.bills} bill${summary.bills === 1 ? "" : "s"} raised`}
              accent="indigo"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21V3ZM10 8h4M10 12h4" />
                </svg>
              }
              delta={<Delta current={summary.billed} previous={summary.prevBilled} label="prev. day" />}
            />
            <Kpi
              label="Collected today"
              value={currency.format(summary.collected)}
              hint={`${summary.payments} receipt${summary.payments === 1 ? "" : "s"}`}
              accent="emerald"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18v10H3V7Zm9 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                </svg>
              }
              delta={<Delta current={summary.collected} previous={summary.prevCollected} label="prev. day" />}
            />
            <Kpi
              label="Outstanding on today's bills"
              value={currency.format(summary.outstanding)}
              hint={`${summary.collectionRate.toFixed(0)}% of today's billing settled`}
              accent="amber"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2.5 2.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              }
              delta={<Delta current={summary.outstanding} previous={summary.prevOutstanding} invert label="prev. day" />}
            />
            <Kpi
              label="Cash in hand"
              value={currency.format(summary.cashCollected)}
              hint={`${currency.format(summary.nonCashCollected)} via card / transfer / POS / insurance`}
              accent="violet"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16v8H4V8Zm4 4h.01M12 12h4" />
                </svg>
              }
            />
          </div>

          <Card title="Account movement" subtitle="Opening dues → today's activity → closing position">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {[
                {
                  label: "Opening dues",
                  value: summary.openingDues,
                  hint: `${summary.openingDueBills} open bill${summary.openingDueBills === 1 ? "" : "s"} before today`,
                  tone: "border-amber-200 bg-amber-50 text-amber-950",
                },
                {
                  label: "+ Billed today",
                  value: summary.billed,
                  hint: `${summary.bills} new bill${summary.bills === 1 ? "" : "s"}`,
                  tone: "border-indigo-200 bg-indigo-50 text-indigo-950",
                },
                {
                  label: "− Settled on today's bills",
                  value: summary.paidAgainstToday,
                  hint: "Paid amount on bills raised today",
                  tone: "border-emerald-200 bg-emerald-50 text-emerald-950",
                },
                {
                  label: "Arrears collected",
                  value: summary.arrearsCollections,
                  hint: "Payments against older bills",
                  tone: "border-sky-200 bg-sky-50 text-sky-950",
                },
                {
                  label: "Closing dues (today's bills)",
                  value: Math.max(0, summary.outstanding),
                  hint: `Ledger check ${compactCurrency.format(closingDues)} incl. opening`,
                  tone: "border-rose-200 bg-rose-50 text-rose-950",
                },
              ].map((item) => (
                <div key={item.label} className={`rounded-xl border px-3 py-3 ${item.tone}`}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{item.label}</p>
                  <p className="mt-1 truncate text-lg font-bold tabular-nums" title={currency.format(item.value)}>
                    {currency.format(item.value)}
                  </p>
                  <p className="mt-0.5 text-[11px] opacity-70">{item.hint}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3 border-t border-[#eef1f6] pt-4 sm:grid-cols-2">
              <div className="rounded-xl bg-[#f8f9fc] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Same-day collections</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-zinc-900">
                  {currency.format(summary.sameDayCollections)}
                </p>
                <p className="mt-0.5 text-xs text-zinc-600">Paid on bills raised today</p>
              </div>
              <div className="rounded-xl bg-[#f8f9fc] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Collection mix</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  {compactCurrency.format(summary.sameDayCollections)} same-day ·{" "}
                  {compactCurrency.format(summary.arrearsCollections)} arrears
                </p>
                <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-zinc-200">
                  {summary.collected > 0 ? (
                    <>
                      <div
                        className="bg-emerald-500"
                        style={{ width: `${(summary.sameDayCollections / summary.collected) * 100}%` }}
                      />
                      <div
                        className="bg-sky-500"
                        style={{ width: `${(summary.arrearsCollections / summary.collected) * 100}%` }}
                      />
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3 sm:gap-5">
            <Card title="Collections by method" subtitle={`${currency.format(methodTotal)} received`} className="lg:col-span-2">
              {data.methods.length === 0 ? (
                <EmptyState label="No payments received on this day." />
              ) : (
                <div className="space-y-4">
                  <div className="flex h-3 overflow-hidden rounded-full bg-zinc-100">
                    {data.methods.map((row, index) => {
                      const colors = ["bg-emerald-500", "bg-sky-500", "bg-indigo-500", "bg-violet-500", "bg-amber-500", "bg-rose-400"];
                      return row.amount > 0 ? (
                        <div
                          key={row.method}
                          className={colors[index % colors.length]}
                          style={{ width: `${(row.amount / methodTotal) * 100}%` }}
                          title={`${row.method}: ${currency.format(row.amount)}`}
                        />
                      ) : null;
                    })}
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-[#dfe4ef]">
                    <table className="w-full min-w-[520px] text-left text-xs">
                      <thead className="bg-[#f3f5fa] text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                        <tr>
                          <th className="px-3 py-2">Method</th>
                          <th className="px-3 py-2 text-right">Receipts</th>
                          <th className="px-3 py-2 text-right">Same-day</th>
                          <th className="px-3 py-2 text-right">Arrears</th>
                          <th className="px-3 py-2 text-right">Total</th>
                          <th className="px-3 py-2 text-right">Share</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eef1f6]">
                        {data.methods.map((row) => (
                          <tr key={row.method} className="hover:bg-[#f8f9fc]">
                            <td className="px-3 py-2.5">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${methodClass(row.method)}`}
                              >
                                {row.method}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700">{row.count}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700">
                              {currency.format(row.sameDay)}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700">
                              {currency.format(row.arrears)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-zinc-900">
                              {currency.format(row.amount)}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-zinc-600">
                              {methodTotal > 0 ? `${Math.round((row.amount / methodTotal) * 100)}%` : "0%"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>

            <Card title="Today's bill settlement" subtitle="Payment status of bills raised today">
              <Breakdown
                rows={[
                  { label: "Paid", value: data.paymentStatus.Paid, color: "bg-emerald-500" },
                  { label: "Partial", value: data.paymentStatus.Partial, color: "bg-amber-400" },
                  { label: "Unpaid", value: data.paymentStatus.Unpaid, color: "bg-rose-500" },
                ]}
              />
              <div className="mt-5 rounded-xl border border-[#eef1f6] bg-[#f8f9fc] px-3 py-3 text-xs text-zinc-600">
                <p>
                  <span className="font-semibold text-zinc-900">{data.dues.length}</span> bill
                  {data.dues.length === 1 ? "" : "s"} still open for a total of{" "}
                  <span className="font-semibold text-zinc-900">{currency.format(summary.outstanding)}</span>
                </p>
              </div>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-5 sm:gap-5">
            <Card title="Hourly cash flow" subtitle="Billed vs collected by hour" className="lg:col-span-3">
              {hourlyMax === 0 ? (
                <EmptyState label="No billing or collections on this day." />
              ) : (
                <div>
                  <div className="flex h-44 items-end gap-1">
                    {data.hourly.map((row) => (
                      <div key={row.hour} className="group relative flex h-full flex-1 flex-col justify-end gap-0.5">
                        <div
                          className="w-full rounded-t-sm bg-indigo-300"
                          style={{
                            height: `${row.billed > 0 ? Math.max(3, (row.billed / hourlyMax) * 100) : 1}%`,
                          }}
                        />
                        <div
                          className="w-full rounded-t-sm bg-emerald-500"
                          style={{
                            height: `${row.collected > 0 ? Math.max(3, (row.collected / hourlyMax) * 100) : 1}%`,
                          }}
                        />
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-900 px-2 py-1 text-[10px] font-medium text-white shadow-lg group-hover:block">
                          {hourLabel(row.hour)} · billed {compactCurrency.format(row.billed)} · collected{" "}
                          {compactCurrency.format(row.collected)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-1 text-[10px] font-medium text-zinc-500">
                    {data.hourly.map((row) => (
                      <span key={row.hour} className="flex-1 text-center">
                        {row.hour % 3 === 0 ? hourLabel(row.hour) : ""}
                      </span>
                    ))}
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

            <Card title="Referral billing" subtitle="Top sources for today's bills" className="lg:col-span-2">
              {data.doctors.length === 0 ? (
                <EmptyState label="No bills raised today." />
              ) : (
                <ul className="space-y-2.5">
                  {data.doctors.map((row) => (
                    <li key={row.name} className="rounded-xl border border-[#eef1f6] bg-[#f8f9fc] px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-semibold text-zinc-800">{row.name}</p>
                        <p className="shrink-0 text-xs font-semibold tabular-nums text-zinc-900">
                          {compactCurrency.format(row.billed)}
                        </p>
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-500">
                        {row.bills} bill{row.bills === 1 ? "" : "s"} · collected {compactCurrency.format(row.collected)} ·
                        due {compactCurrency.format(row.outstanding)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card
            title="Account register"
            subtitle={
              register === "payments"
                ? `${filteredPayments.length} payment receipt${filteredPayments.length === 1 ? "" : "s"}`
                : `${filteredDues.length} open bill${filteredDues.length === 1 ? "" : "s"} from today`
            }
          >
            <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center print:hidden">
              <div className="flex gap-1 rounded-lg border border-[#dfe4ef] bg-[#f8f9fc] p-0.5">
                {(
                  [
                    { id: "payments" as const, label: "Payments", count: data.payments.length },
                    { id: "dues" as const, label: "Open dues", count: data.dues.length },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRegister(tab.id)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                      register === tab.id
                        ? "bg-white text-emerald-800 shadow-sm ring-1 ring-[#dfe4ef]"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    {tab.label}
                    <span className="ml-1 tabular-nums text-zinc-500">{tab.count}</span>
                  </button>
                ))}
              </div>
              <div className="relative flex-1">
                <svg
                  {...iconProps}
                  className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                >
                  <path strokeLinecap="round" d="M21 21l-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z" />
                </svg>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search request, patient, doctor or payment ref"
                  className={`${reportInputClass} w-full pl-8`}
                />
              </div>
              {register === "payments" ? (
                <select
                  value={methodFilter}
                  onChange={(event) => setMethodFilter(event.target.value)}
                  className={reportInputClass}
                >
                  <option value="">All methods</option>
                  {data.methods.map((row) => (
                    <option key={row.method} value={row.method}>
                      {row.method}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>

            {register === "payments" ? (
              filteredPayments.length === 0 ? (
                <EmptyState label="No payments match these filters." />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#dfe4ef]">
                  <table className="w-full min-w-[900px] text-left text-xs">
                    <thead className="bg-[#f3f5fa] text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                      <tr>
                        <th className="px-3 py-2">Paid</th>
                        <th className="px-3 py-2">Request / patient</th>
                        <th className="px-3 py-2">Method</th>
                        <th className="px-3 py-2 text-right">Bill</th>
                        <th className="px-3 py-2 text-right">Paid</th>
                        <th className="px-3 py-2 text-right">Balance</th>
                        <th className="px-3 py-2">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eef1f6]">
                      {filteredPayments.map((row) => (
                        <tr key={row.id} className="align-top hover:bg-[#f8f9fc]">
                          <td className="px-3 py-2.5">
                            <p className="font-semibold text-zinc-900">{timeLabel.format(new Date(row.paidAt))}</p>
                            <p className="mt-0.5 text-[11px] text-zinc-500">
                              Billed {timeLabel.format(new Date(row.billedAt))}
                            </p>
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="font-mono text-[11px] font-semibold text-zinc-900">{row.requestCode}</p>
                            <p className="mt-0.5 font-semibold text-zinc-800">{row.patientName}</p>
                            <p className="mt-0.5 font-mono text-[11px] text-zinc-500">{row.patientCode}</p>
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${methodClass(row.paymentMethod)}`}
                            >
                              {row.paymentMethod}
                            </span>
                            {row.paymentRef ? (
                              <p className="mt-1 font-mono text-[10px] text-zinc-500">{row.paymentRef}</p>
                            ) : null}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700">
                            {currency.format(row.totalAmount)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-emerald-700">
                            {currency.format(row.amountPaid)}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700">
                            {currency.format(row.balance)}
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                row.sameDay ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700"
                              }`}
                            >
                              {row.sameDay ? "Same-day" : "Arrears"}
                            </span>
                            <span
                              className={`ml-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadge[row.paymentStatus]}`}
                            >
                              {row.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : filteredDues.length === 0 ? (
              <EmptyState label="No open dues for today's bills." />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#dfe4ef]">
                <table className="w-full min-w-[820px] text-left text-xs">
                  <thead className="bg-[#f3f5fa] text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    <tr>
                      <th className="px-3 py-2">Billed</th>
                      <th className="px-3 py-2">Request / patient</th>
                      <th className="px-3 py-2">Referred by</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">Bill</th>
                      <th className="px-3 py-2 text-right">Paid</th>
                      <th className="px-3 py-2 text-right">Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eef1f6]">
                    {filteredDues.map((row) => (
                      <tr key={row.id} className="align-top hover:bg-[#f8f9fc]">
                        <td className="px-3 py-2.5">
                          <p className="font-semibold text-zinc-900">{timeLabel.format(new Date(row.billedAt))}</p>
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-mono text-[11px] font-semibold text-zinc-900">{row.requestCode}</p>
                          <p className="mt-0.5 font-semibold text-zinc-800">{row.patientName}</p>
                          <p className="mt-0.5 font-mono text-[11px] text-zinc-500">{row.patientCode}</p>
                        </td>
                        <td className="px-3 py-2.5 text-zinc-700">{row.doctorName || "—"}</td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadge[row.paymentStatus]}`}
                          >
                            {row.paymentStatus}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700">
                          {currency.format(row.totalAmount)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700">
                          {currency.format(row.amountPaid)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-rose-700">
                          {currency.format(row.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
}
