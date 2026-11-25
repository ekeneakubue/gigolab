"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type RequestStatus = "Pending" | "In progress" | "Completed";
type Priority = "Routine" | "Urgent" | "STAT";

type ResultItem = {
  id: string;
  amount: number;
  result: string;
  normalRange: string;
  test: { id: string; name: string; printAs: string; amount: number };
};

type PrepareRequest = {
  id: string;
  requestCode: string;
  barcodeToken: string;
  patientName: string;
  doctorName: string | null;
  priority: Priority;
  sampleType: string;
  clinicalNotes: string;
  status: RequestStatus;
  requestedAt: string;
  tests: string;
  items: ResultItem[];
};

type ApiRequest = {
  id: string;
  requestCode: string;
  barcodeToken: string;
  patientName: string;
  doctor?: { name: string } | null;
  priority?: string;
  sampleType?: string;
  clinicalNotes?: string;
  status: string;
  requestedAt: string | Date;
  tests: string;
  items?: ResultItem[];
  error?: string;
};

const inputClass =
  "mt-1.5 h-10 w-full rounded-xl border border-emerald-200 px-3 text-base font-medium text-zinc-900 placeholder:text-zinc-600 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60";

const statusMeta: Record<RequestStatus, { badge: string; dot: string }> = {
  Pending: { badge: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
  "In progress": { badge: "bg-sky-100 text-sky-800", dot: "bg-sky-500" },
  Completed: { badge: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
};

const priorityMeta: Record<Priority, string> = {
  Routine: "bg-zinc-100 text-zinc-700",
  Urgent: "bg-amber-100 text-amber-800",
  STAT: "bg-rose-100 text-rose-800",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatRequestedAt(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);
  return dateFormatter.format(date);
}

function mapRequest(payload: ApiRequest): PrepareRequest {
  const status: RequestStatus =
    payload.status === "InProgress" || payload.status === "In progress"
      ? "In progress"
      : payload.status === "Completed"
        ? "Completed"
        : "Pending";
  const priority: Priority =
    payload.priority === "Urgent" || payload.priority === "STAT"
      ? payload.priority
      : "Routine";

  return {
    id: payload.id,
    requestCode: payload.requestCode,
    barcodeToken: payload.barcodeToken,
    patientName: payload.patientName,
    doctorName: payload.doctor?.name ?? null,
    priority,
    sampleType: payload.sampleType ?? "",
    clinicalNotes: payload.clinicalNotes ?? "",
    status,
    requestedAt: formatRequestedAt(payload.requestedAt),
    tests: payload.tests,
    items: (payload.items ?? []).map((item) => ({
      id: item.id,
      amount: item.amount,
      result: item.result ?? "",
      normalRange: item.normalRange ?? "",
      test: item.test,
    })),
  };
}

function filledCount(items: { result: string }[]) {
  return items.filter((item) => item.result.trim()).length;
}

export default function PrepareTestResultPanel() {
  const [requests, setRequests] = useState<PrepareRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"queue" | "all" | RequestStatus>("queue");

  const [editing, setEditing] = useState<PrepareRequest | null>(null);
  const [draftItems, setDraftItems] = useState<ResultItem[]>([]);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMode, setSaveMode] = useState<"draft" | "complete" | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setListError("");
      try {
        const response = await fetch("/api/company/diagnostics/test-requests", {
          cache: "no-store",
        });
        const payload = (await response.json()) as ApiRequest[] | { error?: string };
        if (cancelled) return;
        if (!response.ok || !Array.isArray(payload)) {
          setRequests([]);
          setListError(
            !Array.isArray(payload) && payload.error
              ? payload.error
              : "Could not load test requests.",
          );
          return;
        }
        setRequests(payload.map(mapRequest));
      } catch {
        if (!cancelled) {
          setRequests([]);
          setListError("Could not load test requests. Please try again.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!editing) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) {
        setEditing(null);
        setDraftItems([]);
        setFormError("");
        setSaveMode(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editing, isSaving]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((request) => {
      if (statusFilter === "queue") {
        if (request.status === "Completed") return false;
      } else if (statusFilter !== "all" && request.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return [
        request.requestCode,
        request.patientName,
        request.tests,
        request.status,
        request.sampleType,
        request.doctorName ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [requests, search, statusFilter]);

  const queueCount = requests.filter((r) => r.status !== "Completed").length;

  function openEditor(request: PrepareRequest) {
    setEditing(request);
    setDraftItems(request.items.map((item) => ({ ...item })));
    setFormError("");
    setSaveMode(null);
  }

  function closeEditor() {
    if (isSaving) return;
    setEditing(null);
    setDraftItems([]);
    setFormError("");
    setSaveMode(null);
  }

  function updateDraft(id: string, field: "result" | "normalRange", value: string) {
    setDraftItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  }

  async function saveResults(event: FormEvent, mode: "draft" | "complete") {
    event.preventDefault();
    if (!editing) return;

    setFormError("");
    if (mode === "complete" && draftItems.some((item) => !item.result.trim())) {
      setFormError("Enter a result for every test before completing.");
      return;
    }

    setIsSaving(true);
    setSaveMode(mode);
    try {
      const response = await fetch(`/api/company/diagnostics/test-requests/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: mode === "complete" ? "Completed" : "In progress",
          items: draftItems.map((item) => ({
            id: item.id,
            result: item.result,
            normalRange: item.normalRange,
          })),
        }),
      });
      const payload = (await response.json()) as ApiRequest;
      if (!response.ok || !payload.id) {
        setFormError(payload.error ?? "Could not save results.");
        return;
      }

      const mapped = mapRequest(payload);
      setRequests((prev) => prev.map((item) => (item.id === mapped.id ? mapped : item)));
      setEditing(null);
      setDraftItems([]);
      setFormError("");
    } catch {
      setFormError("Could not save results. Please try again.");
    } finally {
      setIsSaving(false);
      setSaveMode(null);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[#dfe4ef] bg-[#f3f5fa] px-4 py-4 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.65)] sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-base font-bold text-zinc-900">Prepare Test Result</h1>
            <p className="text-xs text-zinc-700">
              Enter results for pending and in-progress diagnostic requests
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
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
                placeholder="Search request or patient..."
                className="h-9 w-full rounded-lg border border-[#d7ddea] bg-white/80 pl-9 pr-3 text-sm text-zinc-800 placeholder:text-zinc-500 outline-none focus:border-[#bcc6da] focus:bg-white"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { key: "queue", label: `Queue (${queueCount})` },
                  { key: "Pending", label: "Pending" },
                  { key: "In progress", label: "In progress" },
                  { key: "Completed", label: "Completed" },
                  { key: "all", label: "All" },
                ] as const
              ).map((option) => {
                const active = statusFilter === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setStatusFilter(option.key)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                        : "border-[#d7ddea] bg-white text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="overflow-hidden rounded-2xl border border-[#dfe4ef] bg-white shadow-[0_16px_32px_-24px_rgba(15,23,42,0.6)]">
          <div className="border-b border-[#e8ecf5] px-5 py-4">
            <h2 className="text-sm font-bold text-zinc-900">Requests to prepare</h2>
            <p className="text-xs text-zinc-600">
              {filtered.length} shown · select a request to enter results
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8ecf5] bg-[#f3f5fa]/80">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Request
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Patient
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Progress
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8ecf5]/80">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-zinc-600">
                      Loading requests…
                    </td>
                  </tr>
                ) : listError ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <p className="text-sm font-medium text-rose-700">{listError}</p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <p className="text-sm font-medium text-zinc-700">No requests in this view</p>
                      <p className="mt-1 text-xs text-zinc-600">
                        Create a test request first, or switch the status filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((request) => {
                    const status = statusMeta[request.status];
                    const done = filledCount(request.items);
                    const total = request.items.length || 1;
                    const pct = Math.round((done / total) * 100);
                    return (
                      <tr key={request.id} className="transition-colors hover:bg-[#f3f5fa]/60">
                        <td className="px-5 py-3">
                          <p className="font-mono text-[12px] font-semibold text-zinc-800">
                            {request.requestCode}
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-500">
                            {request.sampleType || "Sample n/a"} · {request.requestedAt}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-zinc-800">{request.patientName}</p>
                          <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">
                            {request.tests || "No tests"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${priorityMeta[request.priority]}`}
                          >
                            {request.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="min-w-[7rem]">
                            <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-zinc-600">
                              <span>
                                {done}/{request.items.length} results
                              </span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                              <div
                                className="h-full rounded-full bg-emerald-500 transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.badge}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                            {request.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openEditor(request)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-[11px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              className="h-3.5 w-3.5"
                              aria-hidden
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"
                              />
                            </svg>
                            {request.status === "Completed" ? "Edit results" : "Prepare"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close prepare results"
            className="absolute inset-0 cursor-default"
            onClick={closeEditor}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="prepare-result-title"
            className="relative flex max-h-[100dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-emerald-100 bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-2xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-emerald-50 px-5 py-3.5 sm:px-6">
              <div className="min-w-0">
                <h2 id="prepare-result-title" className="text-lg font-bold text-zinc-950">
                  Prepare results
                </h2>
                <p className="mt-1 font-mono text-sm font-semibold text-emerald-800">
                  {editing.requestCode}
                </p>
                <p className="mt-1 text-sm text-zinc-700">
                  {editing.patientName}
                  {editing.sampleType ? ` · ${editing.sampleType}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                disabled={isSaving}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
              >
                Close
              </button>
            </div>

            <form
              onSubmit={(event) => void saveResults(event, "draft")}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-[#e8ecf5] bg-[#f8fafc] px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Priority
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${priorityMeta[editing.priority]}`}
                    >
                      {editing.priority}
                    </span>
                  </div>
                  <div className="rounded-xl border border-[#e8ecf5] bg-[#f8fafc] px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Referring doctor
                    </p>
                    <p className="mt-1 text-sm font-semibold text-zinc-900">
                      {editing.doctorName || "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#e8ecf5] bg-[#f8fafc] px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Progress
                    </p>
                    <p className="mt-1 text-sm font-semibold text-zinc-900">
                      {filledCount(draftItems)}/{draftItems.length} filled
                    </p>
                  </div>
                </div>

                {editing.clinicalNotes ? (
                  <div className="rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                      Clinical notes
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-amber-950">
                      {editing.clinicalNotes}
                    </p>
                  </div>
                ) : null}

                <div className="space-y-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    Test results
                  </h3>
                  {draftItems.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-8 text-center text-sm text-zinc-600">
                      This request has no tests to prepare.
                    </p>
                  ) : (
                    draftItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-emerald-100 bg-[#f8faf9] p-4"
                      >
                        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-zinc-900">
                              {index + 1}. {item.test.printAs || item.test.name}
                            </p>
                            {item.test.printAs && item.test.printAs !== item.test.name ? (
                              <p className="text-xs text-zinc-500">{item.test.name}</p>
                            ) : null}
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              item.result.trim()
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {item.result.trim() ? "Entered" : "Awaiting"}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor={`result-${item.id}`}
                              className="text-sm font-bold text-zinc-950"
                            >
                              Result
                            </label>
                            <input
                              id={`result-${item.id}`}
                              value={item.result}
                              onChange={(e) => updateDraft(item.id, "result", e.target.value)}
                              disabled={isSaving}
                              placeholder="Enter measured value…"
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor={`range-${item.id}`}
                              className="text-sm font-bold text-zinc-950"
                            >
                              Normal range{" "}
                              <span className="font-medium text-zinc-500">(optional)</span>
                            </label>
                            <input
                              id={`range-${item.id}`}
                              value={item.normalRange}
                              onChange={(e) => updateDraft(item.id, "normalRange", e.target.value)}
                              disabled={isSaving}
                              placeholder="e.g. 3.5 – 5.5"
                              className={inputClass}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {formError ? (
                  <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
                    {formError}
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-emerald-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-xs font-medium text-zinc-600">
                  Save draft keeps the request in progress. Complete releases results for lookup.
                </p>
                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeEditor}
                    disabled={isSaving}
                    className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-bold text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || draftItems.length === 0}
                    className="inline-flex min-w-32 items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-bold text-sky-900 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving && saveMode === "draft" ? "Saving…" : "Save draft"}
                  </button>
                  <button
                    type="button"
                    disabled={isSaving || draftItems.length === 0}
                    onClick={(event) => void saveResults(event, "complete")}
                    className="inline-flex min-w-40 items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-100 px-4 py-2.5 text-sm font-bold text-emerald-900 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving && saveMode === "complete" ? "Completing…" : "Mark completed"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
