"use client";

import { useEffect, useMemo, useState } from "react";

type RequestStatus = "Pending" | "In progress" | "Completed";
type Priority = "Routine" | "Urgent" | "STAT";

type ResultItem = {
  id: string;
  amount: number;
  result: string;
  normalRange: string;
  test: { id: string; name: string; printAs: string; amount: number };
};

type CheckRequest = {
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
  resultsReleased: boolean;
  verifiedAt: string | null;
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
  resultsReleased?: boolean;
  verifiedAt?: string | Date | null;
  error?: string;
};

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

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);
  return dateFormatter.format(date);
}

function mapRequest(payload: ApiRequest): CheckRequest {
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
    requestedAt: formatDate(payload.requestedAt),
    tests: payload.tests,
    items: (payload.items ?? []).map((item) => ({
      id: item.id,
      amount: item.amount,
      result: item.result ?? "",
      normalRange: item.normalRange ?? "",
      test: item.test,
    })),
    resultsReleased: Boolean(payload.resultsReleased),
    verifiedAt: payload.verifiedAt ? formatDate(payload.verifiedAt) : null,
  };
}

export default function CheckTestResultPanel() {
  const [requests, setRequests] = useState<CheckRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"awaiting" | "released" | "all">("awaiting");

  const [viewing, setViewing] = useState<CheckRequest | null>(null);
  const [actionError, setActionError] = useState("");
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
    if (!viewing) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !releasingId) {
        setViewing(null);
        setActionError("");
        setCopied(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [viewing, releasingId]);

  const completedRequests = useMemo(
    () => requests.filter((request) => request.status === "Completed"),
    [requests],
  );

  const awaitingCount = completedRequests.filter((r) => !r.resultsReleased).length;
  const releasedCount = completedRequests.filter((r) => r.resultsReleased).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return completedRequests.filter((request) => {
      if (filter === "awaiting" && request.resultsReleased) return false;
      if (filter === "released" && !request.resultsReleased) return false;
      if (!q) return true;
      return [
        request.requestCode,
        request.barcodeToken,
        request.patientName,
        request.tests,
        request.sampleType,
        request.doctorName ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [completedRequests, filter, search]);

  function openViewer(request: CheckRequest) {
    setViewing(request);
    setActionError("");
    setCopied(false);
  }

  function closeViewer() {
    if (releasingId) return;
    setViewing(null);
    setActionError("");
    setCopied(false);
  }

  async function setRelease(request: CheckRequest, release: boolean) {
    setActionError("");
    setReleasingId(request.id);
    try {
      const response = await fetch(`/api/company/diagnostics/test-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          releaseOnly: true,
          resultsReleased: release,
        }),
      });
      const payload = (await response.json()) as ApiRequest;
      if (!response.ok || !payload.id) {
        setActionError(payload.error ?? "Could not update release status.");
        return;
      }
      const mapped = mapRequest(payload);
      setRequests((prev) => prev.map((item) => (item.id === mapped.id ? mapped : item)));
      setViewing(mapped);
    } catch {
      setActionError("Could not update release status. Please try again.");
    } finally {
      setReleasingId(null);
    }
  }

  async function copyResultsLink(token: string) {
    const url = `${window.location.origin}/results/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setActionError("Could not copy link. Copy it manually from the address below.");
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[#dfe4ef] bg-[#f3f5fa] px-4 py-4 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.65)] sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-base font-bold text-zinc-900">Check Test Result</h1>
            <p className="text-xs text-zinc-700">
              Review prepared results and release them for patient QR lookup
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
            <div className="relative w-full sm:w-72">
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
                placeholder="Search code, token, or patient..."
                className="h-9 w-full rounded-lg border border-[#d7ddea] bg-white/80 pl-9 pr-3 text-sm text-zinc-800 placeholder:text-zinc-500 outline-none focus:border-[#bcc6da] focus:bg-white"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { key: "awaiting", label: `Awaiting (${awaitingCount})` },
                  { key: "released", label: `Released (${releasedCount})` },
                  { key: "all", label: "All completed" },
                ] as const
              ).map((option) => {
                const active = filter === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setFilter(option.key)}
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
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#dfe4ef] bg-white px-4 py-4 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.45)]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Awaiting release
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{awaitingCount}</p>
          </div>
          <div className="rounded-2xl border border-[#dfe4ef] bg-white px-4 py-4 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.45)]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Released
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{releasedCount}</p>
          </div>
          <div className="rounded-2xl border border-[#dfe4ef] bg-white px-4 py-4 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.45)]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Completed total
            </p>
            <p className="mt-1 text-2xl font-bold text-zinc-900">{completedRequests.length}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#dfe4ef] bg-white shadow-[0_16px_32px_-24px_rgba(15,23,42,0.6)]">
          <div className="border-b border-[#e8ecf5] px-5 py-4">
            <h2 className="text-sm font-bold text-zinc-900">Results to check</h2>
            <p className="text-xs text-zinc-600">
              {filtered.length} shown · release after reviewing every result line
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
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Release
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
                      Loading results…
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
                      <p className="text-sm font-medium text-zinc-700">No completed results here</p>
                      <p className="mt-1 text-xs text-zinc-600">
                        Mark results completed in Prepare Test Result first, or change the filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((request) => {
                    const status = statusMeta[request.status];
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
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.badge}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                            {request.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {request.resultsReleased ? (
                            <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                              Released
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                              Awaiting
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openViewer(request)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-sky-100 bg-sky-50 px-3 text-[11px] font-semibold text-sky-700 transition-colors hover:bg-sky-100"
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
                                d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
                              />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            Review
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

      {viewing ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close check results"
            className="absolute inset-0 cursor-default"
            onClick={closeViewer}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="check-result-title"
            className="relative flex max-h-[100dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-emerald-100 bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-2xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-emerald-50 px-5 py-3.5 sm:px-6">
              <div className="min-w-0">
                <h2 id="check-result-title" className="text-lg font-bold text-zinc-950">
                  Check results
                </h2>
                <p className="mt-1 font-mono text-sm font-semibold text-emerald-800">
                  {viewing.requestCode}
                </p>
                <p className="mt-1 text-sm text-zinc-700">
                  {viewing.patientName}
                  {viewing.sampleType ? ` · ${viewing.sampleType}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={closeViewer}
                disabled={Boolean(releasingId)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
              >
                Close
              </button>
            </div>

            <div className="space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[#e8ecf5] bg-[#f8fafc] px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Priority
                  </p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${priorityMeta[viewing.priority]}`}
                  >
                    {viewing.priority}
                  </span>
                </div>
                <div className="rounded-xl border border-[#e8ecf5] bg-[#f8fafc] px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Referring doctor
                  </p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900">
                    {viewing.doctorName || "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e8ecf5] bg-[#f8fafc] px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Release state
                  </p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900">
                    {viewing.resultsReleased
                      ? `Released${viewing.verifiedAt ? ` · ${viewing.verifiedAt}` : ""}`
                      : "Awaiting review"}
                  </p>
                </div>
              </div>

              {viewing.clinicalNotes ? (
                <div className="rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    Clinical notes
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-amber-950">
                    {viewing.clinicalNotes}
                  </p>
                </div>
              ) : null}

              <div>
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Result lines
                </h3>
                <div className="overflow-hidden rounded-xl border border-[#e8ecf5]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#e8ecf5] bg-[#f3f5fa]">
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                          Test
                        </th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                          Result
                        </th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                          Normal range
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e8ecf5]">
                      {viewing.items.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-sm text-zinc-600">
                            No test lines on this request.
                          </td>
                        </tr>
                      ) : (
                        viewing.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3 font-semibold text-zinc-900">
                              {item.test.printAs || item.test.name}
                            </td>
                            <td className="px-4 py-3 text-zinc-800">
                              {item.result.trim() || (
                                <span className="text-amber-700">Missing</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-zinc-600">
                              {item.normalRange.trim() || "—"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Patient lookup link
                </p>
                <p className="mt-1 break-all font-mono text-xs text-emerald-950">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/results/${viewing.barcodeToken}`
                    : `/results/${viewing.barcodeToken}`}
                </p>
                <button
                  type="button"
                  onClick={() => void copyResultsLink(viewing.barcodeToken)}
                  className="mt-2 inline-flex rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
                >
                  {copied ? "Copied" : "Copy link"}
                </button>
              </div>

              {actionError ? (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
                  {actionError}
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-emerald-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-xs font-medium text-zinc-600">
                Released results become visible when patients scan their receipt QR.
              </p>
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={closeViewer}
                  disabled={Boolean(releasingId)}
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-bold text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
                >
                  Close
                </button>
                {viewing.resultsReleased ? (
                  <button
                    type="button"
                    disabled={releasingId === viewing.id}
                    onClick={() => void setRelease(viewing, false)}
                    className="inline-flex min-w-36 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-900 hover:bg-amber-100 disabled:opacity-60"
                  >
                    {releasingId === viewing.id ? "Updating…" : "Unrelease"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={releasingId === viewing.id}
                    onClick={() => void setRelease(viewing, true)}
                    className="inline-flex min-w-40 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-100 px-4 py-2.5 text-sm font-bold text-emerald-900 hover:bg-emerald-200 disabled:opacity-60"
                  >
                    {releasingId === viewing.id ? "Releasing…" : "Release results"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
