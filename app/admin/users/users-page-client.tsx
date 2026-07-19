"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { readImageFile } from "@/lib/read-image-file";

const userInputClass =
  "mt-1.5 h-10 w-full rounded-xl border border-emerald-200 px-3 text-base font-medium text-zinc-900 placeholder:text-zinc-600 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

type UserRow = {
  id: string;
  name: string;
  initials: string;
  email: string;
  imageUrl?: string | null;
  role: string;
  company: string;
  status: "Active" | "Trial" | "Inactive";
  lastSeen: string;
  access: string;
  created: string;
};

type NewUserForm = {
  image: string | null;
  name: string;
  email: string;
  password: string;
  role: string;
  status: "Active" | "Trial" | "Inactive";
};

type ApiUser = {
  id: string;
  name: string;
  initials: string;
  email: string;
  imageUrl: string | null;
  role: string;
  status: "Active" | "Trial" | "Inactive";
  accessLabel: string;
  createdAt: string;
  lastSeenAt: string | null;
  company: { id: string; name: string } | null;
};

const statusMeta: Record<string, { badge: string; dot: string }> = {
  Active: { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  Trial: { badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  Inactive: { badge: "bg-zinc-100 text-zinc-500", dot: "bg-zinc-400" },
};

const rolePills: Record<string, string> = {
  "Lab Manager": "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  Supervisor: "bg-teal-50 text-teal-700 ring-1 ring-teal-100",
  Receptionist: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  Admin: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
  Technician: "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200",
};

const avatarColors = ["bg-emerald-600", "bg-teal-600", "bg-blue-600", "bg-violet-600", "bg-sky-600", "bg-cyan-600"];

function isApiUser(payload: ApiUser | { error?: string }): payload is ApiUser {
  return "id" in payload && typeof payload.id === "string";
}

const roleOptions = ["Admin", "Manager", "Staff"] as const;

const emptyForm: NewUserForm = {
  image: null,
  name: "",
  email: "",
  password: "",
  role: "Staff",
  status: "Active",
};

export default function UsersPageClient() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<NewUserForm>(emptyForm);
  const [error, setError] = useState("");
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const openAddUserModal = () => {
    setError("");
    setIsAddingUser(false);
    setShowPassword(false);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });

  const mapApiUserToRow = (user: ApiUser): UserRow => ({
    id: user.id,
    name: user.name,
    initials: user.initials,
    email: user.email,
    imageUrl: user.imageUrl,
    role: user.role,
    company: user.company?.name ?? "Unassigned",
    status: user.status,
    lastSeen: user.lastSeenAt ? formatDate(user.lastSeenAt) : "just now",
    access: user.accessLabel,
    created: formatDate(user.createdAt),
  });

  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await fetch("/api/users");
        if (!response.ok) {
          setUsers([]);
          return;
        }
        const data = (await response.json()) as ApiUser[];
        setUsers(data.map(mapApiUserToRow));
      } catch {
        setUsers([]);
      }
    }

    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.name, u.email, u.role, u.company, u.status].join(" ").toLowerCase().includes(q)
    );
  }, [users, search]);

  const overviewStats = useMemo(
    () => [
      { label: "Total", value: filteredUsers.length },
      { label: "Active", value: filteredUsers.filter((u) => u.status === "Active").length },
      { label: "Trial", value: filteredUsers.filter((u) => u.status === "Trial").length },
      { label: "Inactive", value: filteredUsers.filter((u) => u.status === "Inactive").length },
    ],
    [filteredUsers]
  );

  const submitNewUser = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Name, email, and password are required.");
      return;
    }

    setIsAddingUser(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          status: form.status,
          imageUrl: form.image,
        }),
      });

      const payload = (await response.json()) as ApiUser | { error?: string };
      if (!response.ok || !isApiUser(payload)) {
        setError("error" in payload && payload.error ? payload.error : "Could not save user.");
        return;
      }

      setUsers((prev) => [mapApiUserToRow(payload), ...prev]);
      setForm(emptyForm);
      setIsModalOpen(false);
    } finally {
      setIsAddingUser(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="shrink-0 flex items-center justify-between gap-4 bg-white border-b border-emerald-100 px-6 py-3.5 shadow-sm">
        <div>
          <h1 className="text-base font-bold text-zinc-900">Users</h1>
          <p className="text-xs text-zinc-400">Manage roles, access and user activity</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users…"
              className="h-8 w-56 rounded-lg border border-emerald-100 bg-emerald-50/50 pl-9 pr-3 text-sm text-zinc-700 placeholder:text-zinc-400 outline-none focus:border-emerald-300 focus:bg-white transition-colors"
            />
          </div>

          <button
            onClick={openAddUserModal}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
            Add user
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        <div className="flex flex-wrap gap-3">
          {overviewStats.map((s) => (
            <div key={s.label} className="flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-white px-4 py-2.5 shadow-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 text-sm font-bold">{s.value}</span>
              <span className="text-xs font-medium text-zinc-500">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="md:hidden grid grid-cols-1 gap-4">
          {filteredUsers.map((u, i) => {
            const status = statusMeta[u.status] ?? statusMeta.Active;
            const pill = rolePills[u.role] ?? rolePills.Technician;
            const avatar = avatarColors[i % avatarColors.length];
            return (
              <article key={u.id} className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-5 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
                <div className="absolute top-0 inset-x-0 h-0.5 bg-linear-to-r from-emerald-400 via-teal-400 to-emerald-300" />
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {u.imageUrl ? (
                      <img
                        src={u.imageUrl}
                        alt={u.name}
                        className="h-10 w-10 shrink-0 rounded-xl object-cover shadow-sm"
                      />
                    ) : (
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-sm font-bold shadow-sm ${avatar}`}>{u.initials}</div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-zinc-900 truncate">{u.name}</p>
                      <p className="text-[11px] text-zinc-400 truncate">{u.email}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${status.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                    {u.status}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${pill}`}>{u.role}</span>
                  <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200">{u.company}</span>
                </div>
              </article>
            );
          })}
        </div>

        <div className="hidden md:block">
          <div className="rounded-2xl border border-emerald-100 bg-white shadow-md overflow-hidden">
            <div className="px-5 py-4 border-b border-emerald-50 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-zinc-900">All users</h2>
                <p className="text-xs text-zinc-400">Roles and access by company</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-emerald-50">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Company</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Last seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50/80">
                  {filteredUsers.map((u, i) => {
                    const status = statusMeta[u.status] ?? statusMeta.Active;
                    const pill = rolePills[u.role] ?? rolePills.Technician;
                    const avatar = avatarColors[i % avatarColors.length];
                    return (
                      <tr key={u.id} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            {u.imageUrl ? (
                              <img
                                src={u.imageUrl}
                                alt={u.name}
                                className="h-8 w-8 rounded-xl object-cover"
                              />
                            ) : (
                              <div className={`flex h-8 w-8 items-center justify-center rounded-xl text-white text-[11px] font-bold ${avatar}`}>{u.initials}</div>
                            )}
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-zinc-800 truncate">{u.name}</p>
                              <p className="text-[11px] text-zinc-400 truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${pill}`}>{u.role}</span>
                        </td>
                        <td className="px-4 py-3 text-zinc-700">{u.company}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${status.badge}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-500">{u.lastSeen}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-5xl rounded-2xl border border-emerald-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-emerald-50">
              <div>
                <h2 className="text-lg font-bold text-zinc-950">Add New User</h2>
                <p className="text-sm font-medium text-zinc-800 mt-1">Create a platform user account</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                Close
              </button>
            </div>
            <form onSubmit={submitNewUser} className="px-6 py-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
                <div className="sm:col-span-1 flex flex-col items-center text-center">
                  <p className="text-sm font-bold text-zinc-950">Upload image</p>
                  <label
                    className="group relative mx-auto mt-2 flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm transition-colors hover:border-emerald-400 hover:bg-emerald-100 focus-within:ring-2 focus-within:ring-emerald-200 focus-within:ring-offset-2"
                    aria-label="Upload image"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) {
                          setForm((f) => ({ ...f, image: null }));
                          return;
                        }
                        try {
                          const dataUrl = await readImageFile(file);
                          setForm((f) => ({ ...f, image: dataUrl }));
                        } catch {
                          setError("Could not read selected image.");
                        }
                      }}
                    />
                    {form.image ? (
                      <>
                        <img src={form.image} alt="" className="h-full w-full object-cover" />
                        <span className="absolute inset-0 flex items-center justify-center bg-zinc-900/0 text-white opacity-0 transition-opacity group-hover:bg-zinc-900/40 group-hover:opacity-100">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-6 w-6">
                            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                          </svg>
                        </span>
                      </>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-7 w-7" aria-hidden>
                        <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                      </svg>
                    )}
                  </label>
                </div>
                <div className="sm:col-span-1 lg:col-span-2">
                  <label className="text-sm font-bold text-zinc-950">Full name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className={userInputClass}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-950">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className={userInputClass}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-950">Password</label>
                  <div className="relative mt-1.5">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      autoComplete="new-password"
                      className={`${userInputClass} mt-0 pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 hover:bg-emerald-50 hover:text-zinc-800"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029M6.223 6.223A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411M15 12a3 3 0 11-6 0 3 3 0 016 0zM3 3l18 18" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-950">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    className={userInputClass}
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-950">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as NewUserForm["status"] }))}
                    className={userInputClass}
                  >
                    <option>Active</option>
                    <option>Trial</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>
              {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isAddingUser}
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-base font-bold text-zinc-900 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingUser}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-100 px-4 py-2.5 text-base font-bold text-emerald-900 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-70 min-w-36"
                >
                  {isAddingUser ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Adding...
                    </>
                  ) : (
                    "Add user"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

