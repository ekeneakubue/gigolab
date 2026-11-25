"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Breakdown,
  Card,
  Delta,
  EmptyState,
  Kpi,
  PeriodPicker,
  ReportActions,
  ReportError,
  ReportSkeleton,
  compactCurrency,
  downloadCsv,
  formatReportRange,
  iconProps,
  reportInputClass,
  useReportFetch,
  useReportRange,
} from "./report-ui";

type AppointmentStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";

type AppointmentRow = {
  id: string;
  scheduledAt: string;
  createdAt: string;
  reason: string;
  notes: string;
  status: AppointmentStatus;
  overdue: boolean;
  converted: boolean;
  patientName: string;
  patientCode: string;
  phone: string;
  email: string;
  returning: boolean;
};

type AppointmentsData = {
  range: { from: string; to: string };
  summary: {
    total: number;
    previousTotal: number;
    previousCompleted: number;
    previousCancelled: number;
    patients: number;
    returningPatients: number;
    upcoming: number;
    overdue: number;
    avgLeadHours: number | null;
    converted: number;
    conversionEligible: number;
    convertedRevenue: number;
  };
  status: Record<AppointmentStatus, number>;
  daily: ({ date: string } & Record<AppointmentStatus, number>)[];
  reasons: { reason: string; count: number; completed: number; cancelled: number }[];
  gender: { label: string; count: number }[];
  rows: AppointmentRow[];
  truncated: boolean;
};

type StatusFilter = "" | AppointmentStatus | "Overdue";

const PAGE_SIZE = 25;

const statusOrder: AppointmentStatus[] = ["Completed", "Confirmed", "Pending", "Cancelled"];

const statusColor: Record<AppointmentStatus, string> = {
  Completed: "bg-emerald-500",
  Confirmed: "bg-sky-500",
  Pending: "bg-amber-400",
  Cancelled: "bg-rose-400",
};

const statusBadge: Record<AppointmentStatus, string> = {
  Completed: "bg-emerald-100 text-emerald-800",
  Confirmed: "bg-sky-100 text-sky-800",
  Pending: "bg-amber-100 text-amber-800",
  Cancelled: "bg-rose-100 text-rose-800",
};

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const dayLabel = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });
const timeLabel = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

function hourLabel(hour: number) {
  const suffix = hour < 12 ? "a" : "p";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${suffix}`;
}

function formatLead(hours: number | null) {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export default function AppointmentsReport() {
  const { preset, range, choosePreset, setRange } = useReportRange("30d");
  const { data, loading, error, refresh } = useReportFetch<AppointmentsData>(
    "/api/company/reports/appointments",
    range,
    "summary",
  );

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, data]);

  const filteredRows = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.rows.filter((row) => {
      if (statusFilter === "Overdue" && !row.overdue) return false;
      if (statusFilter && statusFilter !== "Overdue" && row.status !== statusFilter) return false;
      if (!q) return true;
      return `${row.patientName} ${row.patientCode} ${row.phone} ${row.email} ${row.reason}`
        .toLowerCase()
        .includes(q);
    });
  }, [data, query, statusFilter]);

  const heatmap = useMemo(() => {
    const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
    for (const row of data?.rows ?? []) {
      if (row.status === "Cancelled") continue;
      const date = new Date(row.scheduledAt);
      grid[(date.getDay() + 6) % 7][date.getHours()] += 1;
    }
    let first = 23;
    let last = 0;
    let max = 0;
    grid.forEach((hours) =>
      hours.forEach((count, hour) => {
        if (count > 0) {
          first = Math.min(first, hour);
          last = Math.max(last, hour);
          max = Math.max(max, count);
        }
      }),
    );
    const start = max > 0 ? Math.min(first, 8) : 8;
    const end = max > 0 ? Math.max(last, 17) : 17;
    const hours = Array.from({ length: end - start + 1 }, (_, index) => start + index);

    let peak: { day: number; hour: number; count: number } | null = null;
    grid.forEach((row, day) =>
      row.forEach((count, hour) => {
        if (count > 0 && (!peak || count > peak.count)) peak = { day, hour, count };
      }),
    );
    return { grid, hours, max, peak: peak as { day: number; hour: number; count: number } | null };
  }, [data]);

  const exportCsv = () => {
    downloadCsv(
      `appointments-report_${range.from}_${range.to}.csv`,
      [
        "Scheduled",
        "Patient",
        "Patient code",
        "Phone",
        "Email",
        "Visit",
        "Reason",
        "Notes",
        "Status",
        "Overdue",
        "Booked at",
        "Converted to test request",
      ],
      filteredRows.map((row) => [
        new Date(row.scheduledAt).toLocaleString(),
        row.patientName,
        row.patientCode,
        row.phone,
        row.email,
        row.returning ? "Returning" : "First visit",
        row.reason,
        row.notes,
        row.status,
        row.overdue ? "Yes" : "No",
        new Date(row.createdAt).toLocaleString(),
        row.converted ? "Yes" : "No",
      ]),
    );
  };

  const summary = data?.summary;
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pageRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const dailyMax = Math.max(
    0,
    ...(data?.daily.map((day) => statusOrder.reduce((sum, key) => sum + day[key], 0)) ?? [0]),
  );
  const now = Date.now();

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="rounded-2xl border border-[#dfe4ef] bg-white p-4 shadow-[0_16px_32px_-26px_rgba(15,23,42,0.55)] sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">Appointments report</p>
            <h2 className="mt-1 text-lg font-bold text-zinc-900">{formatReportRange(range)}</h2>
            <p className="mt-0.5 text-xs text-zinc-600">
              Bookings, attendance, busiest times and how appointments convert into test requests.
            </p>
          </div>
          <ReportActions
            loading={loading}
            onRefresh={refresh}
            onExport={exportCsv}
            exportDisabled={filteredRows.length === 0}
          />
        </div>
        <div className="mt-4 border-t border-[#eef1f6] pt-4">
          <PeriodPicker preset={preset} range={range} onPreset={choosePreset} onRange={setRange} allowFuture />
        </div>
      </section>

      <ReportError message={error} />

      {loading && !data ? <ReportSkeleton /> : null}

      {data && summary ? (
        <div className={`space-y-4 transition-opacity sm:space-y-5 ${loading ? "opacity-60" : ""}`}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <Kpi
              label="Appointments"
              value={String(summary.total)}
              hint={`${summary.patients} patient${summary.patients === 1 ? "" : "s"} · avg booked ${formatLead(summary.avgLeadHours)} ahead`}
              accent="sky"
              icon={
                <svg {...iconProps}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 3v3M16 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
                  />
                </svg>
              }
              delta={<Delta current={summary.total} previous={summary.previousTotal} />}
            />
            <Kpi
              label="Completion rate"
              value={`${percent(data.status.Completed, summary.total)}%`}
              hint={`${data.status.Completed} completed`}
              accent="emerald"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              }
              delta={<Delta current={data.status.Completed} previous={summary.previousCompleted} />}
            />
            <Kpi
              label="Cancellation rate"
              value={`${percent(data.status.Cancelled, summary.total)}%`}
              hint={`${data.status.Cancelled} cancelled`}
              accent="rose"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              }
              delta={<Delta current={data.status.Cancelled} previous={summary.previousCancelled} invert />}
            />
            <Kpi
              label="Upcoming"
              value={String(summary.upcoming)}
              hint={`${data.status.Confirmed} confirmed · ${data.status.Pending} pending overall`}
              accent="indigo"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2.5 2.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              }
            />
            <Kpi
              label="Overdue / no-show risk"
              value={String(summary.overdue)}
              hint="Past time, still pending or confirmed"
              accent="amber"
              icon={
                <svg {...iconProps}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v4m0 4h.01M10.3 3.9 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
                  />
                </svg>
              }
            />
            <Kpi
              label="Converted to tests"
              value={`${percent(summary.converted, summary.conversionEligible)}%`}
              hint={`${summary.converted} visits · ${compactCurrency.format(summary.convertedRevenue)} billed`}
              accent="violet"
              icon={
                <svg {...iconProps}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"
                  />
                </svg>
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3 sm:gap-5">
            <Card title="Daily schedule" subtitle="Appointments per day by status" className="lg:col-span-2">
              {dailyMax === 0 ? (
                <EmptyState label="No appointments in this period." />
              ) : (
                <div>
                  <div className="flex h-48 items-end gap-1">
                    {data.daily.map((day) => {
                      const total = statusOrder.reduce((sum, key) => sum + day[key], 0);
                      const isPast = new Date(day.date).getTime() + 24 * 60 * 60 * 1000 <= now;
                      return (
                        <div key={day.date} className="group relative flex h-full min-w-0 flex-1 flex-col justify-end">
                          <div
                            className={`flex w-full flex-col-reverse overflow-hidden rounded-t-md ${isPast ? "" : "opacity-70"}`}
                            style={{ height: `${total > 0 ? Math.max(4, (total / dailyMax) * 100) : 1.5}%` }}
                          >
                            {total === 0 ? <div className="h-full w-full bg-zinc-200" /> : null}
                            {statusOrder.map((key) =>
                              day[key] > 0 ? (
                                <div
                                  key={key}
                                  className={statusColor[key]}
                                  style={{ height: `${(day[key] / total) * 100}%` }}
                                />
                              ) : null,
                            )}
                          </div>
                          <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-900 px-2 py-1 text-[10px] font-medium text-white shadow-lg group-hover:block">
                            {dayLabel.format(new Date(day.date))} · {total} total
                            {statusOrder
                              .filter((key) => day[key] > 0)
                              .map((key) => ` · ${day[key]} ${key.toLowerCase()}`)
                              .join("")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex gap-1 text-[10px] font-medium text-zinc-500">
                    {data.daily.map((day, index) => {
                      const step = Math.max(1, Math.ceil(data.daily.length / 8));
                      return (
                        <span key={day.date} className="min-w-0 flex-1 truncate text-center">
                          {index % step === 0 ? shortDate.format(new Date(day.date)) : ""}
                        </span>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-zinc-600">
                    {statusOrder.map((key) => (
                      <span key={key} className="inline-flex items-center gap-1.5">
                        <span className={`h-2.5 w-2.5 rounded-sm ${statusColor[key]}`} />
                        {key}
                      </span>
                    ))}
                    <span className="text-zinc-400">Faded bars are today or later</span>
                  </div>
                </div>
              )}
            </Card>

            <Card title="Status & patients" subtitle="Outcome of bookings">
              <Breakdown rows={statusOrder.map((key) => ({ label: key, value: data.status[key], color: statusColor[key] }))} />
              <div className="mt-5 grid grid-cols-2 gap-2 border-t border-[#eef1f6] pt-4">
                <div className="rounded-xl bg-[#f8f9fc] px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">First visit</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-zinc-900">
                    {summary.patients - summary.returningPatients}
                  </p>
                </div>
                <div className="rounded-xl bg-[#f8f9fc] px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Returning</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-zinc-900">{summary.returningPatients}</p>
                </div>
              </div>
              {data.gender.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {data.gender.map((row) => (
                    <span
                      key={row.label}
                      className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-700"
                    >
                      {row.label}
                      <span className="font-semibold tabular-nums text-zinc-900">{row.count}</span>
                    </span>
                  ))}
                </div>
              ) : null}
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-5 sm:gap-5">
            <Card
              title="Busiest times"
              subtitle={
                heatmap.peak
                  ? `Peak: ${weekdays[heatmap.peak.day]} at ${hourLabel(heatmap.peak.hour)} (${heatmap.peak.count})`
                  : "Booked slots by weekday and hour, excluding cancellations"
              }
              className="lg:col-span-3"
            >
              {heatmap.max === 0 ? (
                <EmptyState label="No booked slots to map." />
              ) : (
                <div className="overflow-x-auto">
                  <div
                    className="grid min-w-[520px] gap-1"
                    style={{ gridTemplateColumns: `2.5rem repeat(${heatmap.hours.length}, minmax(0, 1fr))` }}
                  >
                    <span />
                    {heatmap.hours.map((hour) => (
                      <span key={hour} className="text-center text-[10px] font-medium text-zinc-500">
                        {hourLabel(hour)}
                      </span>
                    ))}
                    {weekdays.map((day, dayIndex) => (
                      <div key={day} className="contents">
                        <span className="self-center text-[11px] font-semibold text-zinc-600">{day}</span>
                        {heatmap.hours.map((hour) => {
                          const count = heatmap.grid[dayIndex][hour];
                          const intensity = count / heatmap.max;
                          return (
                            <div
                              key={hour}
                              title={`${day} ${hourLabel(hour)}: ${count} appointment${count === 1 ? "" : "s"}`}
                              className="flex h-7 items-center justify-center rounded-md text-[10px] font-semibold tabular-nums"
                              style={{
                                backgroundColor:
                                  count === 0 ? "#f3f5fa" : `rgba(5, 150, 105, ${0.15 + intensity * 0.85})`,
                                color: intensity > 0.55 ? "#ffffff" : "#064e3b",
                              }}
                            >
                              {count > 0 ? count : ""}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card title="Top reasons" subtitle="Why patients book" className="lg:col-span-2">
              {data.reasons.length === 0 ? (
                <EmptyState label="No appointments in this period." />
              ) : (
                <ul className="space-y-2.5">
                  {data.reasons.map((row) => (
                    <li key={row.reason}>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="min-w-0 flex-1 truncate font-semibold text-zinc-800">{row.reason}</span>
                        <span className="shrink-0 font-semibold tabular-nums text-zinc-900">{row.count}</span>
                      </div>
                      <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-zinc-100">
                        <div
                          className="bg-emerald-500"
                          style={{ width: `${(row.completed / (data.reasons[0]?.count || 1)) * 100}%` }}
                        />
                        <div
                          className="bg-sky-300"
                          style={{
                            width: `${((row.count - row.completed - row.cancelled) / (data.reasons[0]?.count || 1)) * 100}%`,
                          }}
                        />
                        <div
                          className="bg-rose-300"
                          style={{ width: `${(row.cancelled / (data.reasons[0]?.count || 1)) * 100}%` }}
                        />
                      </div>
                      <p className="mt-0.5 text-[10px] text-zinc-500">
                        {percent(row.completed, row.count)}% completed · {percent(row.cancelled, row.count)}% cancelled
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card
            title="Appointment register"
            subtitle={`${filteredRows.length} appointment${filteredRows.length === 1 ? "" : "s"}${
              data.truncated ? " · showing the latest 2,000 — narrow the date range for the full list" : ""
            }`}
          >
            <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center print:hidden">
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
                  placeholder="Search patient, code, phone, email or reason"
                  className={`${reportInputClass} w-full pl-8`}
                />
              </div>
              <div className="flex flex-wrap gap-1 rounded-lg border border-[#dfe4ef] bg-[#f8f9fc] p-0.5">
                {(["", "Pending", "Confirmed", "Completed", "Cancelled", "Overdue"] as StatusFilter[]).map((value) => (
                  <button
                    key={value || "all"}
                    type="button"
                    onClick={() => setStatusFilter(value)}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ${
                      statusFilter === value
                        ? "bg-white text-emerald-800 shadow-sm ring-1 ring-[#dfe4ef]"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    {value || "All"}
                    {value === "Overdue" && summary.overdue > 0 ? (
                      <span className="ml-1 rounded-full bg-amber-100 px-1.5 text-[10px] text-amber-800">
                        {summary.overdue}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            {filteredRows.length === 0 ? (
              <EmptyState label="No appointments match these filters." />
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-[#dfe4ef]">
                  <table className="w-full min-w-[860px] text-left text-xs">
                    <thead className="bg-[#f3f5fa] text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                      <tr>
                        <th className="px-3 py-2">Scheduled</th>
                        <th className="px-3 py-2">Patient</th>
                        <th className="px-3 py-2">Contact</th>
                        <th className="px-3 py-2">Reason</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2 text-right">Booked ahead</th>
                        <th className="px-3 py-2">Tests</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eef1f6]">
                      {pageRows.map((row) => {
                        const scheduled = new Date(row.scheduledAt);
                        const leadHours = (scheduled.getTime() - new Date(row.createdAt).getTime()) / (60 * 60 * 1000);
                        return (
                          <tr key={row.id} className={`align-top hover:bg-[#f8f9fc] ${row.overdue ? "bg-amber-50/40" : ""}`}>
                            <td className="px-3 py-2.5">
                              <p className="font-semibold text-zinc-900">{dayLabel.format(scheduled)}</p>
                              <p className="mt-0.5 text-[11px] text-zinc-500">{timeLabel.format(scheduled)}</p>
                            </td>
                            <td className="px-3 py-2.5">
                              <p className="font-semibold text-zinc-800">{row.patientName}</p>
                              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-500">
                                <span className="font-mono">{row.patientCode}</span>
                                <span
                                  className={`rounded-full px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide ${
                                    row.returning ? "bg-indigo-50 text-indigo-700" : "bg-emerald-50 text-emerald-700"
                                  }`}
                                >
                                  {row.returning ? "Returning" : "New"}
                                </span>
                              </p>
                            </td>
                            <td className="px-3 py-2.5 text-[11px] text-zinc-600">
                              <p>{row.phone || "—"}</p>
                              {row.email ? <p className="mt-0.5 truncate">{row.email}</p> : null}
                            </td>
                            <td className="max-w-[16rem] px-3 py-2.5">
                              <p className="font-medium text-zinc-800">{row.reason}</p>
                              {row.notes ? <p className="mt-0.5 line-clamp-2 text-[11px] text-zinc-500">{row.notes}</p> : null}
                            </td>
                            <td className="px-3 py-2.5">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadge[row.status]}`}
                              >
                                {row.status}
                              </span>
                              {row.overdue ? (
                                <p className="mt-1 text-[10px] font-semibold text-amber-700">Overdue</p>
                              ) : null}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700">
                              {formatLead(leadHours >= 0 ? leadHours : null)}
                            </td>
                            <td className="px-3 py-2.5">
                              {row.converted ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                                  Requested
                                </span>
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

                {pageCount > 1 ? (
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-zinc-600 print:hidden">
                    <span>
                      Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredRows.length)} of{" "}
                      {filteredRows.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={page === 1}
                        onClick={() => setPage((value) => value - 1)}
                        className="h-8 rounded-lg border border-[#dfe4ef] bg-white px-3 font-semibold text-zinc-800 hover:bg-[#f8f9fc] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <span className="px-2 font-medium tabular-nums">
                        {page} / {pageCount}
                      </span>
                      <button
                        type="button"
                        disabled={page === pageCount}
                        onClick={() => setPage((value) => value + 1)}
                        className="h-8 rounded-lg border border-[#dfe4ef] bg-white px-3 font-semibold text-zinc-800 hover:bg-[#f8f9fc] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
}
