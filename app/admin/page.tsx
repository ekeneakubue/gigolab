const stats = [
  {
    label: "Total Companies",
    value: "48",
    change: "+4 this month",
    up: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
      </svg>
    ),
    accent: "bg-emerald-100 text-emerald-700",
    bar: "bg-emerald-500",
  },
  {
    label: "Active Users",
    value: "1,284",
    change: "+112 this month",
    up: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    accent: "bg-teal-100 text-teal-700",
    bar: "bg-teal-500",
  },
  {
    label: "Samples Tracked",
    value: "58,340",
    change: "+2,100 this week",
    up: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="1" width="6" height="4" rx="1" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h4" />
      </svg>
    ),
    accent: "bg-green-100 text-green-700",
    bar: "bg-green-500",
  },
  {
    label: "System Uptime",
    value: "99.9%",
    change: "Last 30 days",
    up: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    accent: "bg-emerald-100 text-emerald-700",
    bar: "bg-emerald-400",
  },
];

const companies = [
  { name: "Cairo Diagnostics Lab",   plan: "Pinnacle",  users: 42,  status: "Active",   joined: "Jan 2026" },
  { name: "NileHealth Analytics",    plan: "Summit",    users: 28,  status: "Active",   joined: "Feb 2026" },
  { name: "AlexMed Center",          plan: "Ascent",    users: 15,  status: "Active",   joined: "Feb 2026" },
  { name: "Giza BioLab",             plan: "Base",      users: 8,   status: "Trial",    joined: "Mar 2026" },
  { name: "Delta Clinical Services", plan: "Summit",    users: 33,  status: "Active",   joined: "Dec 2025" },
  { name: "Suez Medical Labs",        plan: "Ascent",    users: 19,  status: "Inactive", joined: "Nov 2025" },
];

const recentUsers = [
  { name: "Dr. Amira Hassan",    email: "a.hassan@cairodx.com",    role: "Lab Manager",  company: "Cairo Diagnostics Lab", time: "2m ago"  },
  { name: "Mohamed El-Sayed",   email: "m.elsayed@nileh.com",     role: "Technician",   company: "NileHealth Analytics",  time: "18m ago" },
  { name: "Sara Khalil",        email: "s.khalil@alexmed.eg",     role: "Receptionist", company: "AlexMed Center",        time: "1h ago"  },
  { name: "Youssef Abdel-Aziz", email: "y.abdelaziz@gizabio.com", role: "Admin",        company: "Giza BioLab",           time: "3h ago"  },
  { name: "Nadia Mahmoud",      email: "n.mahmoud@delta-cs.com",  role: "Lab Manager",  company: "Delta Clinical Services", time: "5h ago" },
];

const activity = [
  { event: "New company registered",    detail: "Giza BioLab started a free trial",        time: "2m ago",  type: "company" },
  { event: "User role updated",         detail: "Mohamed El-Sayed promoted to Supervisor",  time: "34m ago", type: "user"    },
  { event: "Backup completed",          detail: "Nightly database backup succeeded",        time: "1h ago",  type: "system"  },
  { event: "Subscription upgraded",     detail: "AlexMed Center moved to Ascent plan",      time: "3h ago",  type: "billing" },
  { event: "New company registered",    detail: "Delta Clinical Services renewed contract", time: "6h ago",  type: "company" },
  { event: "System health check",       detail: "All services reporting nominal",           time: "8h ago",  type: "system"  },
];

const planBadge: Record<string, string> = {
  Pinnacle: "bg-violet-100 text-violet-700",
  Summit:   "bg-blue-100 text-blue-700",
  Ascent:   "bg-sky-100 text-sky-700",
  Base:     "bg-zinc-100 text-zinc-600",
};

const statusBadge: Record<string, string> = {
  Active:   "bg-emerald-100 text-emerald-700",
  Trial:    "bg-amber-100 text-amber-700",
  Inactive: "bg-zinc-100 text-zinc-500",
};

const activityIcon: Record<string, { bg: string; icon: React.ReactNode }> = {
  company: {
    bg: "bg-emerald-100",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-emerald-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11" />
      </svg>
    ),
  },
  user: {
    bg: "bg-teal-100",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-teal-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  system: {
    bg: "bg-blue-100",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-blue-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="1" width="6" height="4" rx="1" />
      </svg>
    ),
  },
  billing: {
    bg: "bg-amber-100",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-amber-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
};

export default function AdminDashboard() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Top bar ── */}
      <header className="shrink-0 flex items-center justify-between gap-4 bg-white border-b border-emerald-100 px-6 py-3.5 shadow-sm">
        <div>
          <h1 className="text-base font-bold text-zinc-900">Dashboard</h1>
          <p className="text-xs text-zinc-400">Welcome back, Super Admin</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden md:block">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search…"
              className="h-8 w-52 rounded-lg border border-emerald-100 bg-emerald-50/50 pl-9 pr-3 text-sm text-zinc-700 placeholder:text-zinc-400 outline-none focus:border-emerald-300 focus:bg-white transition-colors"
            />
          </div>
          {/* Bell */}
          <button className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-100 bg-white text-zinc-500 hover:border-emerald-200 hover:text-emerald-600 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500" />
          </button>
          {/* Avatar */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold shadow-sm">
            SA
          </div>
        </div>
      </header>

      {/* ── Scrollable body ── */}
      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-5 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className={`absolute top-0 left-0 right-0 h-0.5 ${s.bar}`} />
              <div className="flex items-start justify-between mb-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.accent}`}>
                  {s.icon}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${s.up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                  {s.up ? "↑" : "↓"} {s.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-zinc-900 tabular-nums">{s.value}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Companies + Activity ── */}
        <div className="grid xl:grid-cols-3 gap-4">

          {/* Companies table */}
          <div className="xl:col-span-2 rounded-2xl border border-emerald-100 bg-white shadow-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-50">
              <div>
                <h2 className="text-sm font-bold text-zinc-900">Companies</h2>
                <p className="text-xs text-zinc-400">All registered labs</p>
              </div>
              <button className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors">
                + Add company
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-emerald-50">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Company</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Plan</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Users</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50/80">
                  {companies.map((c) => (
                    <tr key={c.name} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 text-[11px] font-bold">
                            {c.name[0]}
                          </div>
                          <span className="font-medium text-zinc-800 text-[13px]">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${planBadge[c.plan]}`}>
                          {c.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-600 text-[13px]">{c.users}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusBadge[c.status]}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${c.status === "Active" ? "bg-emerald-500" : c.status === "Trial" ? "bg-amber-500" : "bg-zinc-400"}`} />
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-[13px]">{c.joined}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity feed */}
          <div className="rounded-2xl border border-emerald-100 bg-white shadow-md overflow-hidden">
            <div className="px-5 py-4 border-b border-emerald-50">
              <h2 className="text-sm font-bold text-zinc-900">Recent Activity</h2>
              <p className="text-xs text-zinc-400">System-wide events</p>
            </div>
            <ul className="divide-y divide-emerald-50/80">
              {activity.map((a, i) => {
                const style = activityIcon[a.type];
                return (
                  <li key={i} className="flex gap-3 px-5 py-3.5 hover:bg-emerald-50/40 transition-colors">
                    <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${style.bg}`}>
                      {style.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-800 leading-snug">{a.event}</p>
                      <p className="text-[11px] text-zinc-400 leading-snug mt-0.5 truncate">{a.detail}</p>
                    </div>
                    <span className="ml-auto shrink-0 text-[11px] text-zinc-400 pt-0.5">{a.time}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* ── Recent Users ── */}
        <div className="rounded-2xl border border-emerald-100 bg-white shadow-md overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-50">
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Recent Users</h2>
              <p className="text-xs text-zinc-400">Latest sign-ins across all companies</p>
            </div>
            <button className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors">
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-emerald-50">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Company</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Last seen</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50/80">
                {recentUsers.map((u) => (
                  <tr key={u.email} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                          {u.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-zinc-800">{u.name}</p>
                          <p className="text-[11px] text-zinc-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] text-zinc-600 bg-zinc-100 rounded-full px-2.5 py-0.5 font-medium">{u.role}</span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-zinc-600">{u.company}</td>
                    <td className="px-4 py-3 text-[13px] text-zinc-400">{u.time}</td>
                    <td className="px-4 py-3">
                      <button className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 transition-colors">
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
