const filters = ["All Samples", "Collected", "In Transit", "Processing", "Awaiting Validation", "Completed"];

const sampleRows = [
  {
    id: "SP-02461",
    patient: "Yara Hamdy",
    test: "CBC + ESR",
    source: "Walk-in",
    collectedAt: "09:12",
    status: "Processing",
    priority: "Normal",
    eta: "18 min",
  },
  {
    id: "SP-02460",
    patient: "Hazem Adel",
    test: "PCR Respiratory Panel",
    source: "Home Visit",
    collectedAt: "08:54",
    status: "Awaiting Validation",
    priority: "Urgent",
    eta: "35 min",
  },
  {
    id: "SP-02459",
    patient: "Nadine Fawzy",
    test: "Liver Function",
    source: "Partner Clinic",
    collectedAt: "08:38",
    status: "In Transit",
    priority: "Normal",
    eta: "52 min",
  },
  {
    id: "SP-02458",
    patient: "Mohamed Essam",
    test: "Blood Culture",
    source: "Walk-in",
    collectedAt: "08:21",
    status: "Collected",
    priority: "Urgent",
    eta: "1h 10m",
  },
  {
    id: "SP-02457",
    patient: "Aya Karim",
    test: "Vitamin D + B12",
    source: "Corporate",
    collectedAt: "08:05",
    status: "Completed",
    priority: "Normal",
    eta: "Done",
  },
];

const laneStats = [
  { label: "Queued Samples", value: "42", helper: "6 added in last hour" },
  { label: "In Processing", value: "19", helper: "Average TAT 34 min" },
  { label: "Awaiting Validation", value: "11", helper: "3 urgent samples" },
  { label: "Completed Today", value: "156", helper: "93% within SLA" },
];

const checkpoints = [
  { stage: "Collection", count: 16, tone: "bg-zinc-700" },
  { stage: "Transport", count: 8, tone: "bg-sky-500" },
  { stage: "Lab Bench", count: 21, tone: "bg-amber-500" },
  { stage: "Validation", count: 11, tone: "bg-violet-500" },
];

const alerts = [
  {
    title: "Courier delay on east route",
    detail: "3 samples from Nasr City expected 25 minutes late.",
    level: "Attention",
  },
  {
    title: "Barcode scanner #2 unstable",
    detail: "Intermittent disconnects at reception desk.",
    level: "Check hardware",
  },
  {
    title: "Coagulation reagent low",
    detail: "Estimated 2.5 hours remaining at current pace.",
    level: "Reorder",
  },
];

function statusBadge(status: string) {
  if (status === "Completed") return "bg-zinc-200/90 text-zinc-700";
  if (status === "Awaiting Validation") return "bg-amber-100 text-amber-700";
  if (status === "Processing") return "bg-sky-100 text-sky-700";
  if (status === "In Transit") return "bg-violet-100 text-violet-700";
  return "bg-zinc-200/80 text-zinc-600";
}

function priorityBadge(priority: string) {
  if (priority === "Urgent") return "bg-rose-100 text-rose-700";
  return "bg-zinc-200/80 text-zinc-600";
}

export default function CompanySamplesPage() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[#dfe4ef] bg-[#f3f5fa] px-6 py-3.5 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.65)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-bold text-zinc-900">Samples</h1>
            <p className="text-xs text-zinc-700">Track sample flow from collection to validation.</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button className="rounded-lg border border-[#d7ddea] bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50">
              Import Batch
            </button>
            <button className="rounded-lg border border-zinc-700 bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-800">
              Register Sample
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {laneStats.map((item) => (
            <article
              key={item.label}
              className="rounded-2xl border border-[#dfe4ef] bg-[#f8f9fc] p-5 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.55)]"
            >
              <p className="text-xs font-medium text-zinc-700">{item.label}</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900 tabular-nums">{item.value}</p>
              <p className="mt-1 text-[11px] text-zinc-600">{item.helper}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2 overflow-hidden rounded-2xl border border-[#dfe4ef] bg-[#f8f9fc] shadow-[0_16px_32px_-24px_rgba(15,23,42,0.6)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8ecf5] px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-zinc-900">Sample Queue</h2>
                <p className="text-xs text-zinc-700">Live operational queue with status and timing.</p>
              </div>
              <div className="relative">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Search sample ID, patient..."
                  className="h-8 w-60 rounded-lg border border-[#d7ddea] bg-white/80 pl-9 pr-3 text-sm text-zinc-700 placeholder:text-zinc-600 outline-none transition-colors focus:border-[#bcc6da] focus:bg-white"
                />
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto border-b border-[#e8ecf5] px-5 py-3">
              {filters.map((filter, idx) => (
                <button
                  key={filter}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    idx === 0
                      ? "border border-zinc-700 bg-zinc-700 text-white"
                      : "border border-[#d7ddea] bg-white text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e8ecf5]">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Sample</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Patient</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Test</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Source</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Collected</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Priority</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Status</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">ETA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8ecf5]">
                  {sampleRows.map((row) => (
                    <tr key={row.id} className="transition-colors hover:bg-white/70">
                      <td className="px-5 py-3 text-[13px] font-semibold text-zinc-800">{row.id}</td>
                      <td className="px-4 py-3 text-[13px] text-zinc-700">{row.patient}</td>
                      <td className="px-4 py-3 text-[13px] text-zinc-600">{row.test}</td>
                      <td className="px-4 py-3 text-[13px] text-zinc-700">{row.source}</td>
                      <td className="px-4 py-3 text-[13px] text-zinc-700">{row.collectedAt}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${priorityBadge(row.priority)}`}>
                          {row.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusBadge(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-zinc-700">{row.eta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <section className="overflow-hidden rounded-2xl border border-[#dfe4ef] bg-[#f8f9fc] shadow-[0_16px_32px_-24px_rgba(15,23,42,0.6)]">
              <div className="border-b border-[#e8ecf5] px-5 py-4">
                <h2 className="text-sm font-bold text-zinc-900">Processing Lanes</h2>
                <p className="text-xs text-zinc-700">Current load per processing stage.</p>
              </div>
              <ul className="space-y-3 p-5">
                {checkpoints.map((item) => (
                  <li key={item.stage} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-700">{item.stage}</span>
                      <span className="text-xs text-zinc-700">{item.count} samples</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
                      <div className={`h-full rounded-full ${item.tone}`} style={{ width: `${Math.min(item.count * 4, 100)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="overflow-hidden rounded-2xl border border-[#dfe4ef] bg-[#f8f9fc] shadow-[0_16px_32px_-24px_rgba(15,23,42,0.6)]">
              <div className="border-b border-[#e8ecf5] px-5 py-4">
                <h2 className="text-sm font-bold text-zinc-900">Operational Alerts</h2>
                <p className="text-xs text-zinc-700">Issues requiring near-term follow-up.</p>
              </div>
              <ul className="divide-y divide-[#e8ecf5]">
                {alerts.map((alert) => (
                  <li key={alert.title} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-zinc-800">{alert.title}</p>
                        <p className="mt-0.5 text-[11px] text-zinc-700">{alert.detail}</p>
                      </div>
                      <span className="shrink-0 rounded-full border border-[#d7ddea] bg-white px-2.5 py-0.5 text-[10px] font-semibold text-zinc-600">
                        {alert.level}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
