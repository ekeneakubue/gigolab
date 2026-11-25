"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Breakdown,
  Card,
  EmptyState,
  Kpi,
  PeriodPicker,
  ReportActions,
  ReportError,
  ReportSkeleton,
  currency,
  downloadCsv,
  formatReportRange,
  iconProps,
  reportInputClass,
  useReportFetch,
  useReportRange,
} from "./report-ui";

type DiagnosticsRow = {
  id: string;
  requestId: string;
  requestCode: string;
  requestedAt: string;
  patientName: string;
  patientCode: string;
  doctorName: string;
  testName: string;
  department: string;
  sampleType: string;
  priority: "Routine" | "Urgent" | "STAT";
  status: "Pending" | "InProgress" | "Completed";
  hasResult: boolean;
  released: boolean;
  amount: number;
  tatHours: number | null;
};

type DiagnosticsData = {
  range: { from: string; to: string };
  summary: {
    requests: number;
    tests: number;
    withResult: number;
    released: number;
    revenue: number;
    avgTatHours: number | null;
    tatMeasured: number;
    tatBreaches: number;
  };
  status: Record<string, number>;
  priority: Record<string, number>;
  daily: { date: string; tests: number; completed: number }[];
  departments: { name: string; tests: number; completed: number; withResult: number; amount: number }[];
  topTests: { name: string; department: string; count: number; amount: number }[];
  rows: DiagnosticsRow[];
  truncated: boolean;
};

const statusLabel: Record<DiagnosticsRow["status"], string> = {
  Pending: "Pending",
  InProgress: "In progress",
  Completed: "Completed",
};

const statusBadge: Record<DiagnosticsRow["status"], string> = {
  Pending: "bg-amber-100 text-amber-800",
  InProgress: "bg-sky-100 text-sky-800",
  Completed: "bg-emerald-100 text-emerald-800",
};

const priorityBadge: Record<DiagnosticsRow["priority"], string> = {
  Routine: "bg-zinc-100 text-zinc-700",
  Urgent: "bg-amber-100 text-amber-800",
  STAT: "bg-rose-100 text-rose-800",
};

const dateTime = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

function formatHours(hours: number | null) {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
  if (hours < 48) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

const PAGE_SIZE = 25;

export default function DiagnosticsReport() {
  const { preset, range, choosePreset, setRange } = useReportRange("7d");
  const { data, loading, error, refresh } = useReportFetch<DiagnosticsData>(
    "/api/company/reports/diagnostics",
    range,
    "summary",
  );

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | DiagnosticsRow["status"]>("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"" | DiagnosticsRow["priority"]>("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, departmentFilter, priorityFilter, data]);

  const filteredRows = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.rows.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false;
      if (departmentFilter && row.department !== departmentFilter) return false;
      if (priorityFilter && row.priority !== priorityFilter) return false;
      if (!q) return true;
      return [row.requestCode, row.patientName, row.patientCode, row.testName, row.doctorName]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [data, query, statusFilter, departmentFilter, priorityFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pageRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const dailyMax = Math.max(0, ...(data?.daily.map((day) => day.tests) ?? [0]));
  const isSingleDay = range.from === range.to;

  const exportCsv = () => {
    const header = [
      "Request",
      "Requested at",
      "Patient",
      "Patient code",
      "Referred by",
      "Test",
      "Department",
      "Sample",
      "Priority",
      "Status",
      "Result entered",
      "Released",
      "Amount",
      "TAT (hours)",
    ];
    const lines = filteredRows.map((row) => [
        row.requestCode,
        new Date(row.requestedAt).toLocaleString(),
        row.patientName,
        row.patientCode,
        row.doctorName,
        row.testName,
        row.department,
        row.sampleType,
        row.priority,
        statusLabel[row.status],
        row.hasResult ? "Yes" : "No",
        row.released ? "Yes" : "No",
        row.amount.toFixed(2),
        row.tatHours === null ? "" : row.tatHours.toFixed(2),
    ]);
    downloadCsv(`diagnostics-report_${range.from}_${range.to}.csv`, header, lines);
  };

  const summary = data?.summary;
  const inputClass = reportInputClass;

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="rounded-2xl border border-[#dfe4ef] bg-white p-4 shadow-[0_16px_32px_-26px_rgba(15,23,42,0.55)] sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">Diagnostics report</p>
            <h2 className="mt-1 text-lg font-bold text-zinc-900">{formatReportRange(range)}</h2>
            <p className="mt-0.5 text-xs text-zinc-600">
              Test volume, processing progress, turnaround and department workload for the selected period.
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
          <PeriodPicker preset={preset} range={range} onPreset={choosePreset} onRange={setRange} />
        </div>
      </section>

      <ReportError message={error} />

      {loading && !data ? <ReportSkeleton /> : null}

      {data && summary ? (
        <div className={`space-y-4 transition-opacity sm:space-y-5 ${loading ? "opacity-60" : ""}`}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <Kpi
              label="Tests performed"
              value={String(summary.tests)}
              hint={`Across ${summary.requests} request${summary.requests === 1 ? "" : "s"}`}
              accent="sky"
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
            <Kpi
              label="Completed requests"
              value={String(data.status.Completed ?? 0)}
              hint={`${percent(data.status.Completed ?? 0, summary.requests)}% completion rate`}
              accent="emerald"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              }
            />
            <Kpi
              label="Results entered"
              value={`${percent(summary.withResult, summary.tests)}%`}
              hint={`${summary.withResult} of ${summary.tests} tests`}
              accent="indigo"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5h6M9 3h6v4H9V3ZM6 5H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1M8 13l2.5 2.5L16 10" />
                </svg>
              }
            />
            <Kpi
              label="Results released"
              value={String(summary.released)}
              hint={`${percent(summary.released, summary.requests)}% of requests verified`}
              accent="violet"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3Zm-3 9l2 2 4-4" />
                </svg>
              }
            />
            <Kpi
              label="Avg. turnaround"
              value={formatHours(summary.avgTatHours)}
              hint={
                summary.tatMeasured > 0
                  ? `Request to verification · ${summary.tatMeasured} verified`
                  : "No verified requests yet"
              }
              accent="amber"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2.5 2.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              }
            />
            <Kpi
              label="TAT breaches"
              value={String(summary.tatBreaches)}
              hint="Over target: STAT 2h · Urgent 6h · Routine 24h"
              accent="rose"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.9 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                </svg>
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3 sm:gap-5">
            <Card
              title={isSingleDay ? "Processing pipeline" : "Daily test volume"}
              subtitle={
                isSingleDay
                  ? "Where today's requests currently sit"
                  : "Tests ordered per day · darker segment is completed"
              }
              className="lg:col-span-2"
            >
              {isSingleDay ? (
                <div className="grid gap-3 sm:grid-cols-4">
                  {[
                    { label: "Pending", value: data.status.Pending ?? 0, tone: "border-amber-200 bg-amber-50 text-amber-900" },
                    { label: "In progress", value: data.status.InProgress ?? 0, tone: "border-sky-200 bg-sky-50 text-sky-900" },
                    { label: "Completed", value: data.status.Completed ?? 0, tone: "border-emerald-200 bg-emerald-50 text-emerald-900" },
                    { label: "Released", value: summary.released, tone: "border-violet-200 bg-violet-50 text-violet-900" },
                  ].map((stage, index, all) => (
                    <div key={stage.label} className="relative">
                      <div className={`rounded-xl border px-4 py-4 ${stage.tone}`}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{stage.label}</p>
                        <p className="mt-1 text-2xl font-bold tabular-nums">{stage.value}</p>
                        <p className="mt-0.5 text-[11px] opacity-70">{percent(stage.value, summary.requests)}% of requests</p>
                      </div>
                      {index < all.length - 1 ? (
                        <svg
                          {...iconProps}
                          className="absolute -right-3 top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 text-zinc-400 sm:block"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
                        </svg>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : dailyMax === 0 ? (
                <EmptyState label="No tests ordered in this period." />
              ) : (
                <div>
                  <div className="flex h-48 items-end gap-1">
                    {data.daily.map((day) => (
                      <div key={day.date} className="group relative flex h-full min-w-0 flex-1 flex-col justify-end">
                        <div
                          className="flex w-full flex-col justify-end overflow-hidden rounded-t-md bg-emerald-200 transition-colors group-hover:bg-emerald-300"
                          style={{ height: `${day.tests > 0 ? Math.max(4, (day.tests / dailyMax) * 100) : 1.5}%` }}
                        >
                          <div
                            className="w-full bg-emerald-600"
                            style={{ height: `${day.tests > 0 ? (day.completed / day.tests) * 100 : 0}%` }}
                          />
                        </div>
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-900 px-2 py-1 text-[10px] font-medium text-white shadow-lg group-hover:block">
                          {shortDate.format(new Date(day.date))} · {day.tests} tests · {day.completed} completed
                        </div>
                      </div>
                    ))}
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
                </div>
              )}
            </Card>

            <Card title="Priority mix" subtitle="Urgency of requests">
              <Breakdown
                rows={[
                  { label: "Routine", value: data.priority.Routine ?? 0, color: "bg-zinc-400" },
                  { label: "Urgent", value: data.priority.Urgent ?? 0, color: "bg-amber-500" },
                  { label: "STAT", value: data.priority.STAT ?? 0, color: "bg-rose-600" },
                ]}
              />
              <div className="mt-5 border-t border-[#eef1f6] pt-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Request status</p>
                <Breakdown
                  rows={[
                    { label: "Completed", value: data.status.Completed ?? 0, color: "bg-emerald-500" },
                    { label: "In progress", value: data.status.InProgress ?? 0, color: "bg-sky-500" },
                    { label: "Pending", value: data.status.Pending ?? 0, color: "bg-amber-400" },
                  ]}
                />
              </div>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-5 sm:gap-5">
            <Card title="Department workload" subtitle="Tests, completion and result entry" className="lg:col-span-3">
              {data.departments.length === 0 ? (
                <EmptyState label="No tests ordered in this period." />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#dfe4ef]">
                  <table className="w-full min-w-[480px] text-left text-xs">
                    <thead className="bg-[#f3f5fa] text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                      <tr>
                        <th className="px-3 py-2">Department</th>
                        <th className="px-3 py-2 text-right">Tests</th>
                        <th className="px-3 py-2">Completion</th>
                        <th className="px-3 py-2 text-right">Results</th>
                        <th className="px-3 py-2 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eef1f6]">
                      {data.departments.map((row) => {
                        const done = percent(row.completed, row.tests);
                        return (
                          <tr key={row.name} className="hover:bg-[#f8f9fc]">
                            <td className="px-3 py-2.5 font-semibold text-zinc-800">{row.name}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700">{row.tests}</td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${done}%` }} />
                                </div>
                                <span className="w-9 text-right tabular-nums text-zinc-600">{done}%</span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700">
                              {row.withResult}/{row.tests}
                            </td>
                            <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-zinc-900">
                              {currency.format(row.amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card title="Most requested tests" subtitle="Top 10 by volume" className="lg:col-span-2">
              {data.topTests.length === 0 ? (
                <EmptyState label="No tests ordered in this period." />
              ) : (
                <ol className="space-y-2.5">
                  {data.topTests.map((row, index) => (
                    <li key={`${row.name}-${index}`}>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-4 shrink-0 text-right font-bold tabular-nums text-zinc-400">{index + 1}</span>
                        <span className="min-w-0 flex-1 truncate font-semibold text-zinc-800">{row.name}</span>
                        <span className="shrink-0 tabular-nums text-zinc-600">×{row.count}</span>
                      </div>
                      <div className="ml-6 mt-1 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className="h-full rounded-full bg-sky-500"
                            style={{ width: `${(row.count / (data.topTests[0]?.count || 1)) * 100}%` }}
                          />
                        </div>
                        <span className="w-24 truncate text-right text-[10px] text-zinc-500">{row.department}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>

          <Card
            title="Test register"
            subtitle={`${filteredRows.length} test${filteredRows.length === 1 ? "" : "s"}${
              data.truncated ? " · showing the latest 1,000 — narrow the date range for the full list" : ""
            }`}
          >
            <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center print:hidden">
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
                  placeholder="Search request, patient, test or doctor"
                  className={`${inputClass} w-full pl-8`}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                className={inputClass}
              >
                <option value="">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="InProgress">In progress</option>
                <option value="Completed">Completed</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value as typeof priorityFilter)}
                className={inputClass}
              >
                <option value="">All priorities</option>
                <option value="Routine">Routine</option>
                <option value="Urgent">Urgent</option>
                <option value="STAT">STAT</option>
              </select>
              <select
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
                className={inputClass}
              >
                <option value="">All departments</option>
                {data.departments.map((dept) => (
                  <option key={dept.name} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {filteredRows.length === 0 ? (
              <EmptyState label="No tests match these filters." />
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-[#dfe4ef]">
                  <table className="w-full min-w-[920px] text-left text-xs">
                    <thead className="bg-[#f3f5fa] text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                      <tr>
                        <th className="px-3 py-2">Request</th>
                        <th className="px-3 py-2">Patient</th>
                        <th className="px-3 py-2">Test</th>
                        <th className="px-3 py-2">Priority</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Result</th>
                        <th className="px-3 py-2 text-right">TAT</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eef1f6]">
                      {pageRows.map((row) => (
                        <tr key={row.id} className="align-top hover:bg-[#f8f9fc]">
                          <td className="px-3 py-2.5">
                            <p className="font-mono text-[11px] font-semibold text-zinc-900">{row.requestCode}</p>
                            <p className="mt-0.5 text-[11px] text-zinc-500">{dateTime.format(new Date(row.requestedAt))}</p>
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="font-semibold text-zinc-800">{row.patientName}</p>
                            <p className="mt-0.5 font-mono text-[11px] text-zinc-500">{row.patientCode}</p>
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="font-semibold text-zinc-800">{row.testName}</p>
                            <p className="mt-0.5 text-[11px] text-zinc-500">
                              {row.department}
                              {row.sampleType ? ` · ${row.sampleType}` : ""}
                            </p>
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityBadge[row.priority]}`}
                            >
                              {row.priority}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadge[row.status]}`}
                            >
                              {statusLabel[row.status]}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            {row.released ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                                Released
                              </span>
                            ) : row.hasResult ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Entered
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                                Awaiting
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700">
                            {formatHours(row.tatHours)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-zinc-900">
                            {currency.format(row.amount)}
                          </td>
                        </tr>
                      ))}
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
