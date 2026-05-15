const kpis = [
  { label: "Samples Today", value: "186", helper: "+24 vs yesterday" },
  { label: "Pending Validation", value: "17", helper: "6 urgent samples" },
  { label: "Reports Released", value: "94", helper: "91% on-time delivery" },
  { label: "Home Visits", value: "8", helper: "3 still in progress" },
];

const quickActions = [
  { label: "Register New Patient", hint: "Create intake and assign tests" },
  { label: "Add Sample Batch", hint: "Scan barcodes and queue processing" },
  { label: "Create Home Visit", hint: "Schedule collection with field team" },
  { label: "Generate Invoice", hint: "Finalize billing for completed reports" },
];

const sampleQueue = [
  { sampleId: "SP-02441", patient: "Omar Khaled", test: "CBC + CRP", priority: "Urgent", status: "Processing", eta: "20 min" },
  { sampleId: "SP-02440", patient: "Nada Saleh", test: "Blood Culture", priority: "Normal", status: "Awaiting Validation", eta: "45 min" },
  { sampleId: "SP-02439", patient: "Mona Fathy", test: "Lipid Profile", priority: "Normal", status: "Result Ready", eta: "Now" },
  { sampleId: "SP-02438", patient: "Hussein Adel", test: "PCR Panel", priority: "Urgent", status: "Collected", eta: "1h 10m" },
];

const activity = [
  { event: "Report released for SP-02439", detail: "Dr. Eman reviewed and approved the report", time: "4 min ago" },
  { event: "New home visit request", detail: "Patient: Reem Ayman - Nasr City district", time: "18 min ago" },
  { event: "Stock alert: EDTA tubes", detail: "Inventory reached reorder threshold", time: "41 min ago" },
  { event: "Invoice #INV-3021 paid", detail: "Corporate account - Delta Clinical", time: "1h ago" },
];

const teamBoard = [
  { name: "Dr. Eman", role: "Reviewer", task: "Validating microbiology reports", progress: 82 },
  { name: "Nour Ahmed", role: "Reception", task: "Handling walk-in registrations", progress: 64 },
  { name: "Hady Ali", role: "Technician", task: "Running PCR panel batch #P22", progress: 53 },
];

function badgeForPriority(priority: string) {
  if (priority === "Urgent") return "bg-rose-100 text-rose-700";
  return "bg-zinc-200/80 text-zinc-600";
}

function badgeForStatus(status: string) {
  if (status === "Result Ready") return "bg-zinc-200/80 text-zinc-700";
  if (status === "Awaiting Validation") return "bg-amber-100 text-amber-700";
  if (status === "Processing") return "bg-sky-100 text-sky-700";
  return "bg-zinc-200/80 text-zinc-600";
}

export default function CompanyDashboardPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="shrink-0 flex items-center justify-between gap-4 border-b border-[#dfe4ef] bg-[#f3f5fa] px-6 py-3.5 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.65)]">
        <div>
          <h1 className="text-base font-bold text-zinc-900">Company Dashboard</h1>
          <p className="text-xs text-zinc-600">Daily operations workspace for your lab team</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search patient, sample, report..."
              className="h-8 w-64 rounded-lg border border-[#d7ddea] bg-white/80 pl-9 pr-3 text-sm text-zinc-700 placeholder:text-zinc-600 outline-none transition-colors focus:border-[#bcc6da] focus:bg-white"
            />
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg border border-[#d7ddea] bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50">
            Start new task
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map((item) => (
            <article key={item.label} className="rounded-2xl border border-[#dfe4ef] bg-[#f8f9fc] p-5 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.55)]">
              <p className="text-xs font-medium text-zinc-700">{item.label}</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900 tabular-nums">{item.value}</p>
              <p className="mt-1 text-[11px] text-zinc-600">{item.helper}</p>
            </article>
          ))}
        </section>

        <section className="grid xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 overflow-hidden rounded-2xl border border-[#dfe4ef] bg-[#f8f9fc] shadow-[0_16px_32px_-24px_rgba(15,23,42,0.6)]">
            <div className="flex items-center justify-between border-b border-[#e8ecf5] px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-zinc-900">Sample Queue</h2>
                <p className="text-xs text-zinc-600">Live processing status and priorities</p>
              </div>
              <button className="rounded-lg border border-[#d7ddea] bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50">
                View all samples
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e8ecf5]">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Sample ID</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Patient</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Test</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Priority</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">ETA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8ecf5]">
                  {sampleQueue.map((row) => (
                    <tr key={row.sampleId} className="transition-colors hover:bg-white/70">
                      <td className="px-5 py-3 text-[13px] font-semibold text-zinc-800">{row.sampleId}</td>
                      <td className="px-4 py-3 text-[13px] text-zinc-700">{row.patient}</td>
                      <td className="px-4 py-3 text-[13px] text-zinc-600">{row.test}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badgeForPriority(row.priority)}`}>
                          {row.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badgeForStatus(row.status)}`}>
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

          <div className="overflow-hidden rounded-2xl border border-[#dfe4ef] bg-[#f8f9fc] shadow-[0_16px_32px_-24px_rgba(15,23,42,0.6)]">
            <div className="border-b border-[#e8ecf5] px-5 py-4">
              <h2 className="text-sm font-bold text-zinc-900">Quick Actions</h2>
              <p className="text-xs text-zinc-600">Common tasks for front desk and lab team</p>
            </div>
            <ul className="p-4 space-y-2">
              {quickActions.map((item) => (
                <li key={item.label}>
                  <button className="w-full rounded-xl border border-[#dfe4ef] bg-white/70 px-3.5 py-3 text-left transition-colors hover:bg-white">
                    <p className="text-[13px] font-semibold text-zinc-800">{item.label}</p>
                    <p className="text-[11px] text-zinc-700 mt-0.5">{item.hint}</p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="grid xl:grid-cols-2 gap-4">
          <div className="overflow-hidden rounded-2xl border border-[#dfe4ef] bg-[#f8f9fc] shadow-[0_16px_32px_-24px_rgba(15,23,42,0.6)]">
            <div className="border-b border-[#e8ecf5] px-5 py-4">
              <h2 className="text-sm font-bold text-zinc-900">Team Progress</h2>
              <p className="text-xs text-zinc-600">Current activities across active staff</p>
            </div>
            <ul className="p-5 space-y-4">
              {teamBoard.map((member) => (
                <li key={member.name} className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-800">{member.name}</p>
                      <p className="text-xs text-zinc-600">{member.role}</p>
                    </div>
                    <span className="text-xs font-semibold text-zinc-700">{member.progress}%</span>
                  </div>
                  <p className="text-xs text-zinc-700">{member.task}</p>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
                    <div className="h-full rounded-full bg-zinc-700" style={{ width: `${member.progress}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#dfe4ef] bg-[#f8f9fc] shadow-[0_16px_32px_-24px_rgba(15,23,42,0.6)]">
            <div className="border-b border-[#e8ecf5] px-5 py-4">
              <h2 className="text-sm font-bold text-zinc-900">Recent Activity</h2>
              <p className="text-xs text-zinc-600">Latest updates from operations and billing</p>
            </div>
            <ul className="divide-y divide-[#e8ecf5]">
              {activity.map((item) => (
                <li key={item.event} className="px-5 py-3.5 transition-colors hover:bg-white/70">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-zinc-800">{item.event}</p>
                      <p className="text-[11px] text-zinc-700 mt-0.5">{item.detail}</p>
                    </div>
                    <span className="text-[11px] text-zinc-600 shrink-0">{item.time}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
