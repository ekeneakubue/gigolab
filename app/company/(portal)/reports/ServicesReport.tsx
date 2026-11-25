"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Card,
  Delta,
  EmptyState,
  Kpi,
  PeriodPicker,
  ReportActions,
  ReportError,
  ReportSkeleton,
  compactCurrency,
  currency,
  downloadCsv,
  formatReportRange,
  iconProps,
  reportInputClass,
  useReportFetch,
  useReportRange,
} from "./report-ui";

type Service = {
  id: string;
  name: string;
  department: string;
  subDepartment: string;
  doneFor: "Male" | "Female" | "Both";
  listPrice: number;
  mrp: number;
  orders: number;
  revenue: number;
  discount: number;
  patients: number;
  avgPrice: number;
  prevOrders: number;
  prevRevenue: number;
  lastOrderedAt: string | null;
};

type ServicesData = {
  range: { from: string; to: string };
  summary: {
    catalogueSize: number;
    servicesUsed: number;
    unused: number;
    orders: number;
    prevOrders: number;
    revenue: number;
    prevRevenue: number;
    discount: number;
    patients: number;
    avgPrice: number;
    packages: number;
  };
  daily: { date: string; orders: number; revenue: number }[];
  departments: { name: string; services: number; used: number; orders: number; revenue: number }[];
  services: Service[];
  packages: { id: string; name: string; amount: number }[];
};

type SortKey = "name" | "orders" | "revenue" | "change" | "lastOrderedAt" | "listPrice";
type UsageFilter = "all" | "used" | "unused";

const PAGE_SIZE = 20;

const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const lastOrderedFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

const deptPalette = [
  "bg-emerald-500",
  "bg-sky-500",
  "bg-indigo-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-teal-500",
  "bg-orange-500",
];

const doneForLabel: Record<Service["doneFor"], string> = { Male: "Male", Female: "Female", Both: "All" };

function orderChange(service: Service) {
  if (service.prevOrders === 0) return service.orders > 0 ? Number.POSITIVE_INFINITY : 0;
  return ((service.orders - service.prevOrders) / service.prevOrders) * 100;
}

function ChangeBadge({ service }: { service: Service }) {
  if (service.orders === 0 && service.prevOrders === 0) {
    return <span className="text-[11px] text-zinc-400">—</span>;
  }
  if (service.prevOrders === 0) {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
        New
      </span>
    );
  }
  const change = orderChange(service);
  const up = change >= 0;
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums ${
        Math.abs(change) < 0.05
          ? "bg-zinc-100 text-zinc-600"
          : up
            ? "bg-emerald-50 text-emerald-700"
            : "bg-rose-50 text-rose-700"
      }`}
    >
      {up ? "+" : "−"}
      {Math.abs(change).toFixed(0)}%
    </span>
  );
}

function SortHeader({
  label,
  column,
  sort,
  onSort,
  align = "left",
}: {
  label: string;
  column: SortKey;
  sort: { key: SortKey; dir: "asc" | "desc" };
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sort.key === column;
  return (
    <th className={`px-3 py-2 ${align === "right" ? "text-right" : ""}`}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={`inline-flex items-center gap-1 uppercase tracking-wider hover:text-zinc-900 ${
          active ? "text-zinc-900" : ""
        }`}
      >
        {label}
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-3 w-3 ${active ? "opacity-100" : "opacity-30"} ${active && sort.dir === "asc" ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M10 14l-5-6h10l-5 6Z" />
        </svg>
      </button>
    </th>
  );
}

export default function ServicesReport() {
  const { preset, range, choosePreset, setRange } = useReportRange("30d");
  const { data, loading, error, refresh } = useReportFetch<ServicesData>(
    "/api/company/reports/services",
    range,
    "summary",
  );

  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("");
  const [usage, setUsage] = useState<UsageFilter>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "revenue", dir: "desc" });
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [query, department, usage, sort, data]);

  const onSort = (key: SortKey) =>
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "name" ? "asc" : "desc" },
    );

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const rows = data.services.filter((service) => {
      if (department && service.department !== department) return false;
      if (usage === "used" && service.orders === 0) return false;
      if (usage === "unused" && service.orders > 0) return false;
      if (!q) return true;
      return `${service.name} ${service.department} ${service.subDepartment}`.toLowerCase().includes(q);
    });

    const dir = sort.dir === "asc" ? 1 : -1;
    const value = (service: Service): number | string => {
      switch (sort.key) {
        case "name":
          return service.name.toLowerCase();
        case "orders":
          return service.orders;
        case "revenue":
          return service.revenue;
        case "listPrice":
          return service.listPrice;
        case "change": {
          const change = orderChange(service);
          return Number.isFinite(change) ? change : 1e9;
        }
        case "lastOrderedAt":
          return service.lastOrderedAt ? new Date(service.lastOrderedAt).getTime() : 0;
      }
    };
    return [...rows].sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return a.name.localeCompare(b.name);
    });
  }, [data, query, department, usage, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const topByRevenue = useMemo(
    () => (data ? data.services.filter((s) => s.revenue > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 8) : []),
    [data],
  );

  const movers = useMemo(() => {
    if (!data) return { rising: [] as Service[], falling: [] as Service[] };
    const withHistory = data.services.filter((s) => s.prevOrders > 0 || s.orders > 0);
    const rising = withHistory
      .filter((s) => s.orders > s.prevOrders)
      .sort((a, b) => b.orders - b.prevOrders - (a.orders - a.prevOrders))
      .slice(0, 4);
    const falling = withHistory
      .filter((s) => s.orders < s.prevOrders)
      .sort((a, b) => a.orders - a.prevOrders - (b.orders - b.prevOrders))
      .slice(0, 4);
    return { rising, falling };
  }, [data]);

  const exportCsv = () => {
    downloadCsv(
      `services-report_${range.from}_${range.to}.csv`,
      [
        "Service",
        "Department",
        "Sub-department",
        "For",
        "List price",
        "MRP",
        "Orders",
        "Previous orders",
        "Revenue",
        "Avg charged",
        "Discount given",
        "Patients",
        "Last ordered",
      ],
      filtered.map((service) => [
        service.name,
        service.department,
        service.subDepartment,
        doneForLabel[service.doneFor],
        service.listPrice.toFixed(2),
        service.mrp.toFixed(2),
        service.orders,
        service.prevOrders,
        service.revenue.toFixed(2),
        service.avgPrice.toFixed(2),
        service.discount.toFixed(2),
        service.patients,
        service.lastOrderedAt ? new Date(service.lastOrderedAt).toLocaleDateString() : "Never",
      ]),
    );
  };

  const summary = data?.summary;
  const dailyMax = Math.max(0, ...(data?.daily.map((day) => day.revenue) ?? [0]));
  const deptRevenueTotal = data?.departments.reduce((sum, row) => sum + row.revenue, 0) ?? 0;
  const utilisation =
    summary && summary.catalogueSize > 0 ? Math.round((summary.servicesUsed / summary.catalogueSize) * 100) : 0;

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="rounded-2xl border border-[#dfe4ef] bg-white p-4 shadow-[0_16px_32px_-26px_rgba(15,23,42,0.55)] sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">Services report</p>
            <h2 className="mt-1 text-lg font-bold text-zinc-900">{formatReportRange(range)}</h2>
            <p className="mt-0.5 text-xs text-zinc-600">
              Demand, revenue and pricing for every service in your catalogue, compared with the previous period.
            </p>
          </div>
          <ReportActions
            loading={loading}
            onRefresh={refresh}
            onExport={exportCsv}
            exportDisabled={filtered.length === 0}
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
              label="Service revenue"
              value={currency.format(summary.revenue)}
              hint={`${summary.patients} patient${summary.patients === 1 ? "" : "s"} served`}
              accent="emerald"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18v10H3V7Zm9 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                </svg>
              }
              delta={<Delta current={summary.revenue} previous={summary.prevRevenue} />}
            />
            <Kpi
              label="Services ordered"
              value={String(summary.orders)}
              hint="Billed service lines"
              accent="sky"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21V3ZM10 8h4M10 12h4" />
                </svg>
              }
              delta={<Delta current={summary.orders} previous={summary.prevOrders} />}
            />
            <Kpi
              label="Catalogue utilisation"
              value={`${utilisation}%`}
              hint={`${summary.servicesUsed} of ${summary.catalogueSize} services used`}
              accent="indigo"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" />
                </svg>
              }
            />
            <Kpi
              label="Avg. charged price"
              value={currency.format(summary.avgPrice)}
              hint="Per service ordered"
              accent="violet"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16M7 15V9M12 15V5M17 15v-3" />
                </svg>
              }
            />
            <Kpi
              label="Discounts given"
              value={currency.format(summary.discount)}
              hint={
                summary.revenue + summary.discount > 0
                  ? `${((summary.discount / (summary.revenue + summary.discount)) * 100).toFixed(1)}% below list price`
                  : "Charged vs catalogue price"
              }
              accent="amber"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15l6-6M9.5 9.5h.01M14.5 14.5h.01M4 12l8-8h8v8l-8 8-8-8Z" />
                </svg>
              }
            />
            <Kpi
              label="Unused services"
              value={String(summary.unused)}
              hint="No orders in this period"
              accent="rose"
              icon={
                <svg {...iconProps}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3 sm:gap-5">
            <Card title="Revenue trend" subtitle="Service revenue per day" className="lg:col-span-2">
              {dailyMax === 0 ? (
                <EmptyState label="No services billed in this period." />
              ) : (
                <div>
                  <div className="flex h-48 items-end gap-1">
                    {data.daily.map((day) => (
                      <div key={day.date} className="group relative flex h-full min-w-0 flex-1 flex-col justify-end">
                        <div
                          className="w-full rounded-t-md bg-linear-to-t from-emerald-600 to-emerald-400 opacity-80 transition-opacity group-hover:opacity-100"
                          style={{ height: `${day.revenue > 0 ? Math.max(4, (day.revenue / dailyMax) * 100) : 1.5}%` }}
                        />
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-900 px-2 py-1 text-[10px] font-medium text-white shadow-lg group-hover:block">
                          {shortDate.format(new Date(day.date))} · {currency.format(day.revenue)} · {day.orders} services
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

            <Card title="Revenue by department" subtitle={`${compactCurrency.format(deptRevenueTotal)} total`}>
              {data.departments.length === 0 ? (
                <EmptyState label="No services in the catalogue." />
              ) : (
                <div>
                  <div className="flex h-3 overflow-hidden rounded-full bg-zinc-100">
                    {deptRevenueTotal > 0
                      ? data.departments.map((row, index) =>
                          row.revenue > 0 ? (
                            <div
                              key={row.name}
                              className={deptPalette[index % deptPalette.length]}
                              style={{ width: `${(row.revenue / deptRevenueTotal) * 100}%` }}
                              title={`${row.name}: ${currency.format(row.revenue)}`}
                            />
                          ) : null,
                        )
                      : null}
                  </div>
                  <ul className="mt-4 space-y-2.5">
                    {data.departments.map((row, index) => (
                      <li key={row.name} className="flex items-center gap-2 text-xs">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${deptPalette[index % deptPalette.length]}`} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-zinc-800">{row.name}</p>
                          <p className="text-[11px] text-zinc-500">
                            {row.used}/{row.services} services used · {row.orders} orders
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold tabular-nums text-zinc-900">{compactCurrency.format(row.revenue)}</p>
                          <p className="text-[11px] tabular-nums text-zinc-500">
                            {deptRevenueTotal > 0 ? Math.round((row.revenue / deptRevenueTotal) * 100) : 0}%
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3 sm:gap-5">
            <Card title="Top earning services" subtitle="Ranked by revenue">
              {topByRevenue.length === 0 ? (
                <EmptyState label="No services billed in this period." />
              ) : (
                <ol className="space-y-2.5">
                  {topByRevenue.map((service, index) => (
                    <li key={service.id}>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-4 shrink-0 text-right font-bold tabular-nums text-zinc-400">{index + 1}</span>
                        <span className="min-w-0 flex-1 truncate font-semibold text-zinc-800">{service.name}</span>
                        <span className="shrink-0 font-semibold tabular-nums text-zinc-900">
                          {compactCurrency.format(service.revenue)}
                        </span>
                      </div>
                      <div className="ml-6 mt-1 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${(service.revenue / (topByRevenue[0]?.revenue || 1)) * 100}%` }}
                          />
                        </div>
                        <span className="w-14 text-right text-[10px] tabular-nums text-zinc-500">×{service.orders}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>

            <Card title="Demand movers" subtitle="Biggest change in orders vs previous period">
              {movers.rising.length === 0 && movers.falling.length === 0 ? (
                <EmptyState label="No change in demand to show." />
              ) : (
                <div className="space-y-4">
                  {[
                    { title: "Rising", rows: movers.rising, tone: "text-emerald-700", bar: "bg-emerald-50" },
                    { title: "Falling", rows: movers.falling, tone: "text-rose-700", bar: "bg-rose-50" },
                  ].map((group) =>
                    group.rows.length > 0 ? (
                      <div key={group.title}>
                        <p className={`mb-2 text-[10px] font-semibold uppercase tracking-wider ${group.tone}`}>
                          {group.title}
                        </p>
                        <ul className="space-y-1.5">
                          {group.rows.map((service) => (
                            <li
                              key={service.id}
                              className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ${group.bar}`}
                            >
                              <span className="min-w-0 flex-1 truncate font-semibold text-zinc-800">{service.name}</span>
                              <span className="tabular-nums text-zinc-600">
                                {service.prevOrders} → {service.orders}
                              </span>
                              <ChangeBadge service={service} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null,
                  )}
                </div>
              )}
            </Card>

            <Card title="Packages" subtitle={`${data.packages.length} bundled offer${data.packages.length === 1 ? "" : "s"}`}>
              {data.packages.length === 0 ? (
                <EmptyState label="No packages configured." />
              ) : (
                <ul className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
                  {data.packages.map((pkg) => (
                    <li
                      key={pkg.id}
                      className="flex items-center gap-3 rounded-xl border border-[#eef1f6] bg-[#f8f9fc] px-3 py-2"
                    >
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                        <svg {...iconProps} className="h-3.5 w-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l9-5 9 5-9 5-9-5Zm0 0v8l9 5 9-5V8" />
                        </svg>
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-zinc-800">{pkg.name}</span>
                      <span className="text-xs font-semibold tabular-nums text-zinc-900">{currency.format(pkg.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card
            title="Service catalogue performance"
            subtitle={`${filtered.length} of ${data.services.length} services`}
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
                  placeholder="Search service or department"
                  className={`${reportInputClass} w-full pl-8`}
                />
              </div>
              <select
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                className={reportInputClass}
              >
                <option value="">All departments</option>
                {data.departments.map((row) => (
                  <option key={row.name} value={row.name}>
                    {row.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-1 rounded-lg border border-[#dfe4ef] bg-[#f8f9fc] p-0.5">
                {(["all", "used", "unused"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setUsage(value)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize ${
                      usage === value ? "bg-white text-emerald-800 shadow-sm ring-1 ring-[#dfe4ef]" : "text-zinc-600"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <EmptyState label="No services match these filters." />
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-[#dfe4ef]">
                  <table className="w-full min-w-[900px] text-left text-xs">
                    <thead className="bg-[#f3f5fa] text-[10px] font-semibold text-zinc-600">
                      <tr>
                        <SortHeader label="Service" column="name" sort={sort} onSort={onSort} />
                        <SortHeader label="List price" column="listPrice" sort={sort} onSort={onSort} align="right" />
                        <SortHeader label="Orders" column="orders" sort={sort} onSort={onSort} align="right" />
                        <SortHeader label="Change" column="change" sort={sort} onSort={onSort} align="right" />
                        <SortHeader label="Revenue" column="revenue" sort={sort} onSort={onSort} align="right" />
                        <th className="px-3 py-2 text-right uppercase tracking-wider">Avg charged</th>
                        <th className="px-3 py-2 text-right uppercase tracking-wider">Patients</th>
                        <SortHeader label="Last ordered" column="lastOrderedAt" sort={sort} onSort={onSort} align="right" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eef1f6]">
                      {pageRows.map((service) => (
                        <tr key={service.id} className={`hover:bg-[#f8f9fc] ${service.orders === 0 ? "text-zinc-500" : ""}`}>
                          <td className="px-3 py-2.5">
                            <p className={`font-semibold ${service.orders === 0 ? "text-zinc-600" : "text-zinc-800"}`}>
                              {service.name}
                            </p>
                            <p className="mt-0.5 text-[11px] text-zinc-500">
                              {service.department}
                              {service.subDepartment ? ` › ${service.subDepartment}` : ""} · {doneForLabel[service.doneFor]}
                            </p>
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums">
                            <p className="text-zinc-800">{currency.format(service.listPrice)}</p>
                            {service.mrp > service.listPrice ? (
                              <p className="text-[10px] text-zinc-400 line-through">{currency.format(service.mrp)}</p>
                            ) : null}
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-zinc-800">{service.orders}</td>
                          <td className="px-3 py-2.5 text-right">
                            <ChangeBadge service={service} />
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-zinc-900">
                            {currency.format(service.revenue)}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums">
                            {service.orders > 0 ? (
                              <>
                                <p className="text-zinc-800">{currency.format(service.avgPrice)}</p>
                                {service.discount > 0 ? (
                                  <p className="text-[10px] font-medium text-amber-700">
                                    −{compactCurrency.format(service.discount)} disc.
                                  </p>
                                ) : null}
                              </>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700">{service.patients || "—"}</td>
                          <td className="px-3 py-2.5 text-right text-zinc-600">
                            {service.lastOrderedAt ? (
                              lastOrderedFormat.format(new Date(service.lastOrderedAt))
                            ) : (
                              <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                                Never
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {pageCount > 1 ? (
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-zinc-600 print:hidden">
                    <span>
                      Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
                      {filtered.length}
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
