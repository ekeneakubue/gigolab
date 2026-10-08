"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type DoctorOption = { id: string; name: string };
type TestOption = { id: string; name: string };

type TestRow = {
  key: string;
  testId: string;
  result: string;
  normalRange: string;
};

export type RegistrationRecord = {
  id: string;
  sampleCode: string;
  sampleName: string;
  category: string;
  age: string;
  doctorId: string;
  doctor: { id: string; name: string };
  patientId: string;
  sampleType: string;
  collectionDate: string;
  registeredAt: string;
  tests: {
    id: string;
    testId: string;
    result: string;
    normalRange: string;
    test: { id: string; name: string };
  }[];
};

type RegistrationForm = {
  sampleCode: string;
  sampleName: string;
  category: string;
  age: string;
  doctorId: string;
  patientId: string;
  sampleType: string;
  collectionDate: string;
  registeredAt: string;
  tests: TestRow[];
};

const inputClass =
  "h-10 w-full rounded-xl border border-[#d7ddea] bg-white px-3 text-sm text-zinc-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60";

const labelClass = "mb-1.5 block text-xs font-semibold text-zinc-700";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function displayDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value || "—";
  return new Date(`${value}T00:00:00.000Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function printSampleSlip(html: string) {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) {
    frame.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  const images = Array.from(doc.images);
  const ready = Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );
  void ready.then(() => {
    win.focus();
    win.print();
    window.setTimeout(() => frame.remove(), 1000);
  });
}

function todayInputValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function emptyTestRow(): TestRow {
  return { key: crypto.randomUUID(), testId: "", result: "", normalRange: "" };
}

function dateInputValue(value: string) {
  return value.slice(0, 10);
}

function formFromRegistration(registration: RegistrationRecord): RegistrationForm {
  const tests = registration.tests.map((row) => ({
    key: row.id,
    testId: row.testId || row.test.id,
    result: row.result,
    normalRange: row.normalRange,
  }));
  return {
    sampleCode: registration.sampleCode,
    sampleName: registration.sampleName,
    category: registration.category,
    age: registration.age,
    doctorId: registration.doctorId || registration.doctor.id,
    patientId: registration.patientId,
    sampleType: registration.sampleType,
    collectionDate: dateInputValue(registration.collectionDate),
    registeredAt: dateInputValue(registration.registeredAt),
    tests: tests.length > 0 ? tests : [emptyTestRow()],
  };
}

function emptyForm(): RegistrationForm {
  const today = todayInputValue();
  return {
    sampleCode: "",
    sampleName: "",
    category: "",
    age: "",
    doctorId: "",
    patientId: "",
    sampleType: "",
    collectionDate: today,
    registeredAt: today,
    tests: [emptyTestRow()],
  };
}

export default function RegistrationModal({
  mode,
  registration,
  onClose,
  onSaved,
}: {
  mode: "create" | "view" | "edit";
  registration?: RegistrationRecord | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const readOnly = mode === "view";
  const [form, setForm] = useState<RegistrationForm>(() =>
    registration ? formFromRegistration(registration) : emptyForm(),
  );
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [tests, setTests] = useState<TestOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [labName, setLabName] = useState("");
  const [labLogoUrl, setLabLogoUrl] = useState<string | null>(null);
  const locked = isSaving || readOnly;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSaving, onClose]);

  useEffect(() => {
    setForm((current) => {
      if (current.tests?.length) return current;
      return { ...current, tests: [emptyTestRow()] };
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadOptions() {
      setIsLoadingOptions(true);
      try {
        const [doctorsResponse, testsResponse] = await Promise.all([
          fetch("/api/company/masters/doctors"),
          fetch("/api/company/masters/tests"),
        ]);
        if (!doctorsResponse.ok || !testsResponse.ok) {
          if (!cancelled) setError("Could not load doctors and tests.");
          return;
        }
        const doctorData = (await doctorsResponse.json()) as DoctorOption[];
        const testData = (await testsResponse.json()) as TestOption[];
        if (!cancelled) {
          setDoctors(doctorData.map((doctor) => ({ id: doctor.id, name: doctor.name })));
          setTests(testData.map((test) => ({ id: test.id, name: test.name })));
        }
      } catch {
        if (!cancelled) setError("Could not load doctors and tests.");
      } finally {
        if (!cancelled) setIsLoadingOptions(false);
      }
    }
    async function loadLabName() {
      try {
        const response = await fetch("/api/company/auth/session");
        if (!response.ok) return;
        const payload = (await response.json()) as {
          company?: { name?: string; logoUrl?: string | null } | null;
        };
        if (!cancelled) {
          setLabName(payload.company?.name?.trim() ?? "");
          setLabLogoUrl(payload.company?.logoUrl ?? null);
        }
      } catch {
        if (!cancelled) {
          setLabName("");
          setLabLogoUrl(null);
        }
      }
    }
    void loadOptions();
    void loadLabName();
    return () => {
      cancelled = true;
    };
  }, []);

  const setField = (key: keyof Omit<RegistrationForm, "tests">, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const setTestField = (key: string, field: keyof Omit<TestRow, "key">, value: string) => {
    setForm((current) => ({
      ...current,
      tests: (current.tests ?? []).map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    }));
  };

  const addTestRow = () => {
    setForm((current) => ({ ...current, tests: [...(current.tests ?? []), emptyTestRow()] }));
  };

  const removeTestRow = (key: string) => {
    setForm((current) => {
      const rows = current.tests ?? [];
      return {
        ...current,
        tests: rows.length === 1 ? rows : rows.filter((row) => row.key !== key),
      };
    });
  };

  const testRows = useMemo(
    () => (form.tests?.length ? form.tests : [emptyTestRow()]),
    [form.tests],
  );

  const doctorChoices = useMemo(() => {
    const current = registration?.doctor;
    if (current && !doctors.some((doctor) => doctor.id === current.id)) {
      return [current, ...doctors];
    }
    return doctors;
  }, [doctors, registration]);

  const testChoices = useMemo(() => {
    const extras = (registration?.tests ?? [])
      .map((row) => row.test)
      .filter((test) => !tests.some((option) => option.id === test.id));
    return [...extras, ...tests];
  }, [registration, tests]);

  const printSample = () => {
    const doctorName = doctorChoices.find((doctor) => doctor.id === form.doctorId)?.name ?? "";
    const rows = testRows.filter((row) => row.testId || row.result.trim() || row.normalRange.trim());
    const testMarkup = rows.length
      ? rows
          .map((row) => {
            const name = testChoices.find((test) => test.id === row.testId)?.name ?? "";
            return `<tr><td>${escapeHtml(name || "—")}</td><td>${escapeHtml(row.result.trim() || "—")}</td><td>${escapeHtml(row.normalRange.trim() || "—")}</td></tr>`;
          })
          .join("")
      : `<tr><td colspan="3">No tests added.</td></tr>`;
    const field = (label: string, value: string) =>
      `<div class="field"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value.trim() || "—")}</dd></div>`;

    printSampleSlip(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Sample ${escapeHtml(form.sampleCode.trim() || "registration")}</title>
  <style>
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: Georgia, "Times New Roman", serif; color: #18181b; margin: 32px; }
    .letterhead { text-align: center; }
    .letterhead img {
      display: inline-block;
      max-width: 100%;
      max-height: 120px;
      width: auto;
      height: auto;
      object-fit: contain;
    }
    .letterhead h1 {
      margin: 12px 0 0;
      font-family: "Segoe UI", Arial, sans-serif;
      font-size: 30px;
      font-weight: 800;
      line-height: 1.15;
      color: #047857;
    }
    .letterhead-rule {
      margin: 14px 0 22px;
      border: 0;
      border-top: 3px solid #059669;
      height: 0;
    }
    h2.doc-title {
      margin: 0 0 16px;
      text-align: center;
      font-family: "Segoe UI", Arial, sans-serif;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #047857;
    }
    dl { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; margin: 0; }
    dt { font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: #71717a; }
    dd { margin: 2px 0 0; font-size: 15px; }
    h2.section { font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; margin: 22px 0 8px; color: #047857; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #a7f3d0; padding: 8px 10px; text-align: left; font-size: 14px; }
    th { background: #ecfdf5; color: #047857; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; }
  </style>
</head>
<body>
  <header class="letterhead">
    ${labLogoUrl ? `<img src="${escapeHtml(labLogoUrl)}" alt="" />` : ""}
    <h1>${escapeHtml(labName || "Your lab")}</h1>
  </header>
  <hr class="letterhead-rule" />
  <h2 class="doc-title">Sample</h2>
  <dl>
    ${field("Sample ID", form.sampleCode)}
    ${field("Sample Name", form.sampleName)}
    ${field("Category", form.category)}
    ${field("Age", form.age)}
    ${field("Patient ID", form.patientId)}
    ${field("Sample Type", form.sampleType)}
    ${field("Ref. Doctor", doctorName)}
    ${field("Collection Date", displayDate(form.collectionDate))}
    ${field("Reg. Date", displayDate(form.registeredAt))}
  </dl>
  <h2 class="section">Tests</h2>
  <table>
    <thead><tr><th>Test</th><th>Result</th><th>Normal Range</th></tr></thead>
    <tbody>${testMarkup}</tbody>
  </table>
</body>
</html>`);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (readOnly) return;
    setError("");
    if (
      !form.sampleCode.trim() ||
      !form.sampleName.trim() ||
      !form.category.trim() ||
      !form.age.trim() ||
      !form.patientId.trim() ||
      !form.sampleType.trim() ||
      !form.collectionDate ||
      !form.registeredAt
    ) {
      setError("Fill in every sample detail.");
      return;
    }
    if (!form.doctorId) {
      setError("Select a referring doctor.");
      return;
    }
    if (testRows.some((row) => !row.testId)) {
      setError("Select a test for every row.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        mode === "edit" && registration
          ? `/api/company/transactions/registrations/${registration.id}`
          : "/api/company/transactions/registrations",
        {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tests: testRows.map(({ testId, result, normalRange }) => ({ testId, result, normalRange })),
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Could not save registration.");
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError("Could not save registration. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-zinc-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close registration form"
        className="absolute inset-0 cursor-default"
        onClick={() => {
          if (!isSaving) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-registration-title"
        className="relative flex max-h-[100dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-[#dfe4ef] bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#e8ecf5] px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id="new-registration-title" className="text-lg font-bold text-zinc-900">
              {mode === "view" ? "Registration" : mode === "edit" ? "Edit Registration" : "New Registration"}
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              {mode === "view"
                ? "Sample and test details for this registration."
                : mode === "edit"
                  ? "Update this sample and its tests."
                  : "Record a sample and the tests to run."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
          >
            Close
          </button>
        </div>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-6 overflow-y-auto px-4 py-5 sm:px-6">
            <section className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-800">Sample Details</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="sample-id" className={labelClass}>Sample ID</label>
                  <input
                    id="sample-id"
                    value={form.sampleCode}
                    onChange={(event) => setField("sampleCode", event.target.value)}
                    className={inputClass}
                    disabled={locked}
                  />
                </div>
                <div>
                  <label htmlFor="sample-name" className={labelClass}>Sample Name</label>
                  <input
                    id="sample-name"
                    value={form.sampleName}
                    onChange={(event) => setField("sampleName", event.target.value)}
                    className={inputClass}
                    disabled={locked}
                  />
                </div>
                <div>
                  <label htmlFor="sample-category" className={labelClass}>Category</label>
                  <input
                    id="sample-category"
                    value={form.category}
                    onChange={(event) => setField("category", event.target.value)}
                    className={inputClass}
                    disabled={locked}
                  />
                </div>
                <div>
                  <label htmlFor="sample-age" className={labelClass}>Age</label>
                  <input
                    id="sample-age"
                    value={form.age}
                    onChange={(event) => setField("age", event.target.value)}
                    className={inputClass}
                    disabled={locked}
                  />
                </div>
                <div>
                  <label htmlFor="ref-doctor" className={labelClass}>Ref. Doctor</label>
                  <select
                    id="ref-doctor"
                    value={form.doctorId}
                    onChange={(event) => setField("doctorId", event.target.value)}
                    className={inputClass}
                    disabled={locked || isLoadingOptions}
                  >
                    <option value="">{isLoadingOptions ? "Loading doctors…" : "Select Ref. Doctor"}</option>
                    {doctorChoices.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="patient-id" className={labelClass}>Patient ID</label>
                  <input
                    id="patient-id"
                    value={form.patientId}
                    onChange={(event) => setField("patientId", event.target.value)}
                    className={inputClass}
                    disabled={locked}
                  />
                </div>
                <div>
                  <label htmlFor="sample-type" className={labelClass}>Sample Type</label>
                  <input
                    id="sample-type"
                    value={form.sampleType}
                    onChange={(event) => setField("sampleType", event.target.value)}
                    className={inputClass}
                    disabled={locked}
                  />
                </div>
                <div>
                  <label htmlFor="collection-date" className={labelClass}>Collection Date</label>
                  <input
                    id="collection-date"
                    type="date"
                    value={form.collectionDate}
                    onChange={(event) => setField("collectionDate", event.target.value)}
                    className={inputClass}
                    disabled={locked}
                  />
                </div>
                <div>
                  <label htmlFor="reg-date" className={labelClass}>Reg. Date</label>
                  <input
                    id="reg-date"
                    type="date"
                    value={form.registeredAt}
                    onChange={(event) => setField("registeredAt", event.target.value)}
                    className={inputClass}
                    disabled={locked}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-800">Test Details</h3>
              <div className="space-y-2 overflow-x-auto">
                {testRows.map((row, index) => (
                  <div
                    key={row.key}
                    className={`grid items-end gap-2 ${readOnly ? "min-w-[28rem] grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]" : "min-w-[36rem] grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"}`}
                  >
                    <div className="min-w-0">
                      {index === 0 ? (
                        <label htmlFor={`select-test-${row.key}`} className={labelClass}>Select Test</label>
                      ) : null}
                      <select
                        id={`select-test-${row.key}`}
                        aria-label="Select Test"
                        value={row.testId}
                        onChange={(event) => setTestField(row.key, "testId", event.target.value)}
                        className={inputClass}
                        disabled={locked || isLoadingOptions}
                      >
                        <option value="">{isLoadingOptions ? "Loading tests…" : "Select Test"}</option>
                        {testChoices.map((test) => (
                          <option key={test.id} value={test.id}>
                            {test.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="min-w-0">
                      {index === 0 ? (
                        <label htmlFor={`test-result-${row.key}`} className={labelClass}>Result</label>
                      ) : null}
                      <input
                        id={`test-result-${row.key}`}
                        aria-label="Result"
                        value={row.result}
                        onChange={(event) => setTestField(row.key, "result", event.target.value)}
                        className={inputClass}
                        disabled={locked}
                      />
                    </div>
                    <div className="min-w-0">
                      {index === 0 ? (
                        <label htmlFor={`normal-range-${row.key}`} className={labelClass}>Normal Range</label>
                      ) : null}
                      <input
                        id={`normal-range-${row.key}`}
                        aria-label="Normal Range"
                        value={row.normalRange}
                        onChange={(event) => setTestField(row.key, "normalRange", event.target.value)}
                        className={inputClass}
                        disabled={locked}
                      />
                    </div>
                    {readOnly ? null : (
                    <div className="flex gap-1">
                      {testRows.length > 1 ? (
                        <button
                          type="button"
                          aria-label="Remove test"
                          onClick={() => removeTestRow(row.key)}
                          disabled={locked}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden>
                            <path strokeLinecap="round" d="M5 12h14" />
                          </svg>
                        </button>
                      ) : null}
                      {index === testRows.length - 1 ? (
                        <button
                          type="button"
                          aria-label="Add test"
                          onClick={addTestRow}
                          disabled={locked}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden>
                            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                          </svg>
                        </button>
                      ) : null}
                    </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {error ? (
              <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col gap-2 border-t border-[#e8ecf5] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <button
              type="button"
              onClick={printSample}
              disabled={isSaving}
              className="order-last inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 sm:order-none sm:w-auto"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V4h12v5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 14h12v6H6z" />
              </svg>
              Print Sample
            </button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 sm:w-auto"
              >
                {readOnly ? "Close" : "Cancel"}
              </button>
              {readOnly ? null : (
              <button
                type="submit"
                disabled={isSaving || isLoadingOptions}
                className="inline-flex w-full items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60 sm:w-auto"
              >
                {isSaving ? "Saving…" : mode === "edit" ? "Save changes" : "Save registration"}
              </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
