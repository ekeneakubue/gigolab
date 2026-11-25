"use client";

import { useEffect, useMemo, useState } from "react";

import PatientShell from "../components/PatientShell";

type ResultItem = {
  id: string;
  name: string;
  result: string;
  normalRange: string;
};

type PatientResult = {
  id: string;
  requestCode: string;
  barcodeToken: string;
  sampleType: string;
  priority: string;
  requestedAt: string;
  verifiedAt: string | null;
  doctorName: string | null;
  tests: string;
  items: ResultItem[];
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default function PatientResultsPage() {
  const [results, setResults] = useState<PatientResult[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewing, setViewing] = useState<PatientResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch("/api/patients/results", { cache: "no-store" });
        const payload = (await response.json()) as
          | { results?: PatientResult[]; error?: string };
        if (cancelled) return;
        if (!response.ok || !Array.isArray(payload.results)) {
          setResults([]);
          setError(payload.error ?? "Could not load results.");
          return;
        }
        setResults(payload.results);
      } catch {
        if (!cancelled) {
          setResults([]);
          setError("Could not load results. Please try again.");
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return results;
    return results.filter((result) =>
      [result.requestCode, result.tests, result.sampleType, result.doctorName ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [results, search]);

  return (
    <PatientShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Test results</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Released results from your lab. Pending or unreleased tests stay hidden.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search request or test..."
              className="h-10 w-full rounded-xl border border-[#d7ddea] bg-white px-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#dfe4ef] bg-white shadow-[0_16px_32px_-24px_rgba(15,23,42,0.45)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8ecf5] bg-[#f3f5fa]/80">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Request
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Tests
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8ecf5]/80">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-sm text-zinc-600">
                      Loading results…
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-sm font-medium text-rose-700">
                      {error}
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center">
                      <p className="text-sm font-medium text-zinc-700">No released results yet</p>
                      <p className="mt-1 text-xs text-zinc-600">
                        When your lab releases results, they will appear here.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((result) => (
                    <tr key={result.id} className="hover:bg-[#f3f5fa]/60">
                      <td className="px-5 py-3">
                        <p className="font-mono text-xs font-semibold text-zinc-800">
                          {result.requestCode}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {result.sampleType || "Sample n/a"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        <span className="line-clamp-2">{result.tests || "—"}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-zinc-600">
                        {dateFormatter.format(new Date(result.requestedAt))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setViewing(result)}
                          className="inline-flex h-8 items-center rounded-lg border border-sky-100 bg-sky-50 px-3 text-[11px] font-semibold text-sky-700 hover:bg-sky-100"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {viewing ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close result details"
            className="absolute inset-0 cursor-default"
            onClick={() => setViewing(null)}
          />
          <div className="relative max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-emerald-100 bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-emerald-50 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-950">Result details</h2>
                <p className="mt-1 font-mono text-sm font-semibold text-emerald-800">
                  {viewing.requestCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                Close
              </button>
            </div>
            <div className="space-y-4 px-5 py-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Info label="Sample type" value={viewing.sampleType || "—"} />
                <Info label="Priority" value={viewing.priority} />
                <Info
                  label="Requested"
                  value={dateFormatter.format(new Date(viewing.requestedAt))}
                />
                <Info label="Doctor" value={viewing.doctorName || "—"} />
              </div>
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
                    {viewing.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 font-semibold text-zinc-900">{item.name}</td>
                        <td className="px-4 py-3 text-zinc-800">{item.result || "—"}</td>
                        <td className="px-4 py-3 text-zinc-600">{item.normalRange || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </PatientShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#e8ecf5] bg-[#f8fafc] px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-900">{value}</p>
    </div>
  );
}
