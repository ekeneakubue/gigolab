"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type ResultPayload = {
  requestCode: string;
  barcodeToken: string;
  status: string;
  priority: string;
  sampleType: string;
  requestedAt: string;
  patient: { name: string; patientCode: string; gender: string };
  doctorName: string | null;
  company: {
    name: string;
    logoUrl: string | null;
    location: string;
    phone: string | null;
  };
  resultsReady: boolean;
  resultsReleased?: boolean;
  items: {
    name: string;
    result: string;
    normalRange: string;
    pending: boolean;
  }[];
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default function CheckResultsPage() {
  const params = useParams<{ token: string }>();
  const token = typeof params.token === "string" ? params.token : "";
  const [data, setData] = useState<ResultPayload | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError("Missing result code.");
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/results/${encodeURIComponent(token)}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as ResultPayload | { error?: string };
        if (cancelled) return;
        if (!response.ok || !("requestCode" in payload)) {
          setData(null);
          setError(
            "error" in payload && payload.error
              ? payload.error
              : "Could not find results for this code.",
          );
          return;
        }
        setData(payload);
      } catch {
        if (!cancelled) {
          setData(null);
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
  }, [token]);

  return (
    <div className="min-h-screen bg-[#f3f5fa] px-4 py-10">
      <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-[#dfe4ef] bg-white shadow-[0_16px_32px_-24px_rgba(15,23,42,0.6)]">
        <div className="border-b border-emerald-50 bg-emerald-50/40 px-6 py-5 text-center">
          {data?.company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.company.logoUrl}
              alt=""
              className="mx-auto mb-3 h-14 w-auto object-contain"
            />
          ) : null}
          <h1 className="text-xl font-bold text-emerald-900">
            {data?.company.name ?? "Lab results"}
          </h1>
          <p className="mt-1 text-sm font-medium text-zinc-700">
            Scan receipt QR code to check your test results
          </p>
        </div>

        <div className="px-6 py-6">
          {isLoading ? (
            <p className="py-10 text-center text-sm font-medium text-zinc-600">Loading results…</p>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-center">
              <p className="text-sm font-semibold text-rose-800">{error}</p>
              <p className="mt-2 text-xs text-rose-700">
                Check the QR code on your receipt and try again.
              </p>
            </div>
          ) : data ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Info label="Request ID" value={data.requestCode} mono />
                <Info
                  label="Status"
                  value={data.status}
                  badge={
                    data.resultsReady
                      ? "bg-emerald-100 text-emerald-800"
                      : data.status === "In progress"
                        ? "bg-sky-100 text-sky-800"
                        : "bg-amber-100 text-amber-800"
                  }
                />
                <Info label="Patient" value={`${data.patient.name} (${data.patient.patientCode})`} />
                <Info
                  label="Requested"
                  value={dateFormatter.format(new Date(data.requestedAt))}
                />
                <Info label="Sample type" value={data.sampleType} />
                <Info label="Priority" value={data.priority} />
                {data.doctorName ? <Info label="Referring doctor" value={data.doctorName} /> : null}
              </div>

              {!data.resultsReady ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-medium text-amber-900">
                  {data.status === "Completed" && !data.resultsReleased
                    ? "Results are prepared and awaiting lab release. Please check again shortly."
                    : <>
                        Results are not ready yet. Your request is <strong>{data.status}</strong>.
                        Keep this page or scan the receipt QR code again later.
                      </>}
                </div>
              ) : null}

              <div>
                <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Tests
                </h2>
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
                      {data.items.map((item) => (
                        <tr key={item.name}>
                          <td className="px-4 py-3 font-semibold text-zinc-900">{item.name}</td>
                          <td className="px-4 py-3 text-zinc-700">
                            {item.pending ? (
                              <span className="text-amber-700">Pending</span>
                            ) : (
                              item.result || "—"
                            )}
                          </td>
                          <td className="px-4 py-3 text-zinc-600">
                            {item.pending ? "—" : item.normalRange || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {(data.company.location || data.company.phone) && (
                <p className="text-center text-xs text-zinc-500">
                  {[data.company.location, data.company.phone].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  mono,
  badge,
}: {
  label: string;
  value: string;
  mono?: boolean;
  badge?: string;
}) {
  return (
    <div className="rounded-xl border border-[#e8ecf5] bg-[#f8fafc] px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
      {badge ? (
        <span
          className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge}`}
        >
          {value}
        </span>
      ) : (
        <p className={`mt-1 text-sm font-semibold text-zinc-900 ${mono ? "font-mono" : ""}`}>
          {value}
        </p>
      )}
    </div>
  );
}
