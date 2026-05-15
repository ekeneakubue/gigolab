"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type CompanyUser = {
  id: string;
  name: string;
  initials: string;
  email: string;
  imageUrl: string | null;
  role: string;
  status: "Active" | "Trial" | "Inactive";
  accessLabel: string;
  lastSeenAt: string | null;
  createdAt: string;
};

const statusMeta: Record<string, { badge: string; dot: string }> = {
  Active: { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  Trial: { badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  Inactive: { badge: "bg-zinc-200 text-zinc-600", dot: "bg-zinc-400" },
};

const avatarColors = ["bg-indigo-600", "bg-violet-600", "bg-sky-600", "bg-teal-600", "bg-blue-600"];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

type NewUserForm = {
  image: string | null;
  name: string;
  email: string;
  password: string;
  role: string;
  status: "Active" | "Trial" | "Inactive";
};

const roleOptions = ["Staff", "Technician", "Receptionist", "Supervisor", "Lab Manager"] as const;

const emptyForm: NewUserForm = {
  image: null,
  name: "",
  email: "",
  password: "",
  role: "Staff",
  status: "Active",
};

function isCompanyUser(payload: CompanyUser | { error?: string }): payload is CompanyUser {
  return "id" in payload && typeof payload.id === "string";
}

export default function CompanyUsersPage() {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<NewUserForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [isAddingUser, setIsAddingUser] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch("/api/company/users");
        const data = (await response.json()) as CompanyUser[] | { error?: string };
        if (cancelled) return;
        if (!response.ok || !Array.isArray(data)) {
          setUsers([]);
          setError("error" in data && data.error ? data.error : "Could not load users.");
          return;
        }
        setUsers(data);
      } catch {
        if (!cancelled) {
          setUsers([]);
          setError("Could not load users. Please try again.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.name, u.email, u.role, u.status, u.accessLabel].join(" ").toLowerCase().includes(q)
    );
  }, [users, search]);

  const openAddUserModal = () => {
    setFormError("");
    setIsAddingUser(false);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const submitNewUser = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError("Name, email, and password are required.");
      return;
    }

    setIsAddingUser(true);
    try {
      const response = await fetch("/api/company/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          status: form.status,
          imageUrl: form.image,
        }),
      });

      const payload = (await response.json()) as CompanyUser | { error?: string };
      if (!response.ok || !isCompanyUser(payload)) {
        setFormError("error" in payload && payload.error ? payload.error : "Could not save user.");
        return;
      }

      setUsers((prev) => [payload, ...prev]);
      setForm(emptyForm);
      setIsModalOpen(false);
    } catch {
      setFormError("Could not save user. Please try again.");
    } finally {
      setIsAddingUser(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[#dfe4ef] bg-[#f3f5fa] px-6 py-4 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.65)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-base font-bold text-zinc-900">Users</h1>
            <p className="text-xs text-zinc-700">Staff accounts for your lab</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
              >
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="h-9 w-full rounded-lg border border-[#d7ddea] bg-white/80 pl-9 pr-3 text-sm text-zinc-800 placeholder:text-zinc-500 outline-none focus:border-[#bcc6da] focus:bg-white"
              />
            </div>
            <button
              type="button"
              onClick={openAddUserModal}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path strokeLinecap="round" d="M12 5v14M5 12h14" />
              </svg>
              Add user
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="overflow-hidden rounded-2xl border border-[#dfe4ef] bg-white shadow-[0_16px_32px_-24px_rgba(15,23,42,0.6)]">
          <div className="border-b border-[#e8ecf5] px-5 py-4">
            <h2 className="text-sm font-bold text-zinc-900">Lab team</h2>
            <p className="text-xs text-zinc-600">
              {isLoading ? "Loading users..." : `${filteredUsers.length} of ${users.length} members`}
            </p>
          </div>

          {error ? (
            <p className="px-5 py-8 text-center text-sm font-medium text-rose-700">{error}</p>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8ecf5] bg-[#f3f5fa]/80">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Access
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Last seen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8ecf5]/80">
                {isLoading
                  ? Array.from({ length: 5 }, (_, i) => (
                      <tr key={`skeleton-${i}`} className="animate-pulse">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span className="h-8 w-8 rounded-xl bg-indigo-100" />
                            <div className="space-y-1.5">
                              <span className="block h-3.5 w-28 rounded bg-zinc-100" />
                              <span className="block h-2.5 w-36 rounded bg-zinc-100" />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><span className="block h-5 w-16 rounded-full bg-zinc-100" /></td>
                        <td className="px-4 py-3"><span className="block h-5 w-14 rounded-full bg-zinc-100" /></td>
                        <td className="px-4 py-3"><span className="block h-3 w-20 rounded bg-zinc-100" /></td>
                        <td className="px-4 py-3"><span className="block h-3 w-16 rounded bg-zinc-100" /></td>
                      </tr>
                    ))
                  : filteredUsers.length === 0
                    ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-12 text-center">
                            <p className="text-sm font-medium text-zinc-700">No users found</p>
                            <p className="mt-1 text-xs text-zinc-600">
                              {users.length === 0
                                ? "No staff are linked to your lab yet."
                                : "Try a different search term."}
                            </p>
                          </td>
                        </tr>
                      )
                    : filteredUsers.map((u, i) => {
                        const status = statusMeta[u.status] ?? statusMeta.Active;
                        const avatar = avatarColors[i % avatarColors.length];
                        return (
                          <tr key={u.id} className="hover:bg-[#f3f5fa]/60 transition-colors">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3 min-w-[200px]">
                                {u.imageUrl ? (
                                  <img
                                    src={u.imageUrl}
                                    alt=""
                                    className="h-8 w-8 shrink-0 rounded-xl object-cover ring-1 ring-[#dfe4ef]"
                                  />
                                ) : (
                                  <div
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold text-white ${avatar}`}
                                  >
                                    {u.initials}
                                  </div>
                                )}
                                <div>
                                  <p className="text-[13px] font-semibold text-zinc-800 truncate">{u.name}</p>
                                  <p className="text-[11px] text-zinc-600 truncate">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-zinc-700">{u.role}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${status.badge}`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                                {u.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-zinc-600">{u.accessLabel}</td>
                            <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                              {u.lastSeenAt ? dateFormatter.format(new Date(u.lastSeenAt)) : "—"}
                            </td>
                          </tr>
                        );
                      })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-[#dfe4ef] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e8ecf5] px-5 py-4">
              <h2 className="text-sm font-bold text-zinc-900">Add New User</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-zinc-200 px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50"
              >
                Close
              </button>
            </div>
            <form onSubmit={submitNewUser} className="space-y-4 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-zinc-700">Upload image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) {
                        setForm((f) => ({ ...f, image: null }));
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        const result = typeof reader.result === "string" ? reader.result : null;
                        setForm((f) => ({ ...f, image: result }));
                      };
                      reader.onerror = () => setFormError("Could not read selected image.");
                      reader.readAsDataURL(file);
                    }}
                    className="mt-1 block w-full rounded-xl border border-[#dfe4ef] bg-white px-3 py-2 text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Full name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-xl border border-[#dfe4ef] px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-xl border border-[#dfe4ef] px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-xl border border-[#dfe4ef] px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-xl border border-[#dfe4ef] px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, status: e.target.value as NewUserForm["status"] }))
                    }
                    className="mt-1 h-10 w-full rounded-xl border border-[#dfe4ef] px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option>Active</option>
                    <option>Trial</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>
              {formError ? <p className="text-xs font-medium text-rose-700">{formError}</p> : null}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingUser}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-70 min-w-[7.5rem]"
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


