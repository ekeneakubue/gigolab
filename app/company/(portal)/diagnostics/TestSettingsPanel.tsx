"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type DoneFor = "Male" | "Female" | "Both";

type SubDepartmentOption = {
  id: string;
  name: string;
};

type DepartmentOption = {
  id: string;
  name: string;
  subDepartments: SubDepartmentOption[];
};

type LabTest = {
  id: string;
  name: string;
  printAs: string;
  departmentId: string;
  subDepartmentId: string | null;
  amount: number;
  testMrp: number;
  doneFor: DoneFor;
  createdAt: string;
  department: { id: string; name: string };
  subDepartment: { id: string; name: string } | null;
};

type TestForm = {
  name: string;
  printAs: string;
  departmentId: string;
  subDepartmentId: string;
  amount: string;
  testMrp: string;
  doneFor: DoneFor;
};

const inputClass =
  "mt-1.5 h-10 w-full rounded-xl border border-emerald-200 px-3 text-base font-medium text-zinc-900 placeholder:text-zinc-600 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60";

const emptyForm = (): TestForm => ({
  name: "",
  printAs: "",
  departmentId: "",
  subDepartmentId: "",
  amount: "",
  testMrp: "",
  doneFor: "Both",
});

function isLabTest(payload: LabTest | { error?: string }): payload is LabTest {
  return "id" in payload && typeof payload.id === "string";
}

const currency = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 2,
});

export default function TestSettingsPanel() {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TestForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const csvInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const [testsRes, deptsRes] = await Promise.all([
          fetch("/api/company/masters/tests", { cache: "no-store" }),
          fetch("/api/company/masters/departments", { cache: "no-store" }),
        ]);
        const testsData = (await testsRes.json()) as LabTest[] | { error?: string };
        const deptsData = (await deptsRes.json()) as DepartmentOption[] | { error?: string };
        if (cancelled) return;

        if (!testsRes.ok || !Array.isArray(testsData)) {
          setTests([]);
          setError(
            !Array.isArray(testsData) && testsData.error
              ? testsData.error
              : "Could not load tests.",
          );
        } else {
          setTests(testsData);
        }

        setDepartments(Array.isArray(deptsData) ? deptsData : []);
      } catch {
        if (!cancelled) {
          setTests([]);
          setDepartments([]);
          setError("Could not load tests. Please try again.");
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

  const subDepartmentOptions = useMemo(() => {
    const dept = departments.find((d) => d.id === form.departmentId);
    return dept?.subDepartments ?? [];
  }, [departments, form.departmentId]);

  const filteredTests = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tests;
    return tests.filter((test) =>
      [
        test.name,
        test.printAs,
        test.department?.name,
        test.subDepartment?.name,
        test.doneFor,
        String(test.amount),
        String(test.testMrp),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [tests, search]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormError("");
    setIsSaving(false);
    setIsModalOpen(true);
  };

  const openEditModal = (test: LabTest) => {
    setEditingId(test.id);
    setForm({
      name: test.name,
      printAs: test.printAs,
      departmentId: test.departmentId,
      subDepartmentId: test.subDepartmentId ?? "",
      amount: String(test.amount),
      testMrp: String(test.testMrp),
      doneFor: test.doneFor,
    });
    setFormError("");
    setIsSaving(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    setFormError("");
  };

  const submitTest = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");

    const name = form.name.trim();
    const printAs = form.printAs.trim();
    const departmentId = form.departmentId;
    const subDepartmentId = form.subDepartmentId || null;
    const amount = Number(form.amount);
    const testMrp = Number(form.testMrp);

    if (!name) {
      setFormError("Test name is required.");
      return;
    }
    if (!printAs) {
      setFormError("Print As is required.");
      return;
    }
    if (!departmentId) {
      setFormError("Department is required.");
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      setFormError("Amount must be a non-negative number.");
      return;
    }
    if (!Number.isFinite(testMrp) || testMrp < 0) {
      setFormError("Test MRP must be a non-negative number.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        editingId
          ? `/api/company/masters/tests/${editingId}`
          : "/api/company/masters/tests",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            printAs,
            departmentId,
            subDepartmentId,
            amount,
            testMrp,
            doneFor: form.doneFor,
          }),
        },
      );
      const payload = (await response.json()) as LabTest | { error?: string };
      if (!response.ok || !isLabTest(payload)) {
        setFormError(
          "error" in payload && payload.error ? payload.error : "Could not save test.",
        );
        return;
      }

      setTests((prev) =>
        editingId
          ? prev.map((test) => (test.id === editingId ? payload : test))
          : [payload, ...prev],
      );
      closeModal();
    } catch {
      setFormError("Could not save test. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTest = async (test: LabTest) => {
    if (!window.confirm(`Delete "${test.name}"? This cannot be undone.`)) return;

    setDeletingId(test.id);
    setError("");
    try {
      const response = await fetch(`/api/company/masters/tests/${test.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setError(payload.error ?? "Could not delete test.");
        return;
      }
      setTests((prev) => prev.filter((item) => item.id !== test.id));
      if (editingId === test.id) closeModal();
    } catch {
      setError("Could not delete test. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const downloadCsvTemplate = () => {
    const header = "name,printAs,department,subDepartment,amount,testMrp,doneFor";
    const example =
      "Complete Blood Count,CBC,Haematology,Routine,25.00,30.00,Both";
    const csv = `${header}\n${example}\n`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tests-template.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleCsvSelected = async (file: File | undefined) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a .csv file.");
      return;
    }

    setIsImporting(true);
    setError("");
    setImportMessage("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/company/masters/tests/import", {
        method: "POST",
        body,
      });
      const payload = (await response.json()) as {
        error?: string;
        created?: number;
        failed?: number;
        tests?: LabTest[];
        errors?: string[];
      };

      if (!response.ok) {
        setError(payload.error ?? "Could not import CSV.");
        return;
      }

      if (Array.isArray(payload.tests) && payload.tests.length > 0) {
        setTests((prev) => [...payload.tests!, ...prev]);
      }

      const created = payload.created ?? 0;
      const failed = payload.failed ?? 0;
      if (created > 0) {
        setImportMessage(
          failed > 0
            ? `Imported ${created} test${created === 1 ? "" : "s"}; ${failed} row${failed === 1 ? "" : "s"} skipped.`
            : `Imported ${created} test${created === 1 ? "" : "s"} from CSV.`,
        );
      } else {
        setError(payload.errors?.[0] ?? "No tests were imported.");
      }
      if (failed > 0 && payload.errors?.length) {
        setError(payload.errors.slice(0, 3).join(" "));
      }
    } catch {
      setError("Could not import CSV. Please try again.");
    } finally {
      setIsImporting(false);
      if (csvInputRef.current) csvInputRef.current.value = "";
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[#dfe4ef] bg-[#f3f5fa] px-4 py-4 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.65)] sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-base font-bold text-zinc-900">Test Settings</h1>
            <p className="text-xs text-zinc-700">
              Configure diagnostic tests, pricing, and department routing
            </p>
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
                placeholder="Search tests..."
                className="h-9 w-full rounded-lg border border-[#d7ddea] bg-white/80 pl-9 pr-3 text-sm text-zinc-800 placeholder:text-zinc-500 outline-none focus:border-[#bcc6da] focus:bg-white"
              />
            </div>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => void handleCsvSelected(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={downloadCsvTemplate}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#d7ddea] bg-white px-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v12m0 0l-3-3m3 3l3-3M4 20h16"
                />
              </svg>
              CSV Template
            </button>
            <button
              type="button"
              onClick={() => csvInputRef.current?.click()}
              disabled={isImporting}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#d7ddea] bg-white px-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 12V4m0 0l-3 3m3-3l3 3"
                />
              </svg>
              {isImporting ? "Uploading…" : "Upload tests CSV"}
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-4 w-4"
              >
                <path strokeLinecap="round" d="M12 5v14M5 12h14" />
              </svg>
              Create test
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        {importMessage ? (
          <p className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {importMessage}
          </p>
        ) : null}
        {error ? (
          <p className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </p>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-[#dfe4ef] bg-white shadow-[0_16px_32px_-24px_rgba(15,23,42,0.6)]">
          <div className="border-b border-[#e8ecf5] px-5 py-4">
            <h2 className="text-sm font-bold text-zinc-900">Test catalogue</h2>
            <p className="text-xs text-zinc-600">
              {isLoading
                ? "Loading tests…"
                : `${filteredTests.length} of ${tests.length} tests`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8ecf5] bg-[#f3f5fa]/80">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Test
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    MRP
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Done for
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8ecf5]/80">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-zinc-600">
                      Loading tests…
                    </td>
                  </tr>
                ) : filteredTests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <p className="text-sm font-medium text-zinc-700">
                        {tests.length === 0 ? "No tests yet" : "No matching tests"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-600">
                        {tests.length === 0
                          ? "Click “Create test” to add one to the catalogue."
                          : "Try a different search."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredTests.map((test) => (
                    <tr key={test.id} className="transition-colors hover:bg-[#f3f5fa]/60">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-zinc-900">{test.name}</p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          Print as: {test.printAs || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {test.department?.name ?? "—"}
                        {test.subDepartment ? (
                          <span className="text-zinc-500"> / {test.subDepartment.name}</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-800">
                        {currency.format(test.amount)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {currency.format(test.testMrp)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-700">
                          {test.doneFor}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(test)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100"
                            aria-label={`Edit ${test.name}`}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              className="h-3.5 w-3.5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.232 5.232l3.536 3.536M4 20h4.586a1 1 0 00.707-.293l9.414-9.414a2 2 0 000-2.828l-2.172-2.172a2 2 0 00-2.828 0L4.293 14.707A1 1 0 004 15.414V20z"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteTest(test)}
                            disabled={deletingId === test.id}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label={`Delete ${test.name}`}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              className="h-3.5 w-3.5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 7h12M9 7V5h6v2m-7 0l1 12h6l1-12"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-emerald-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-50 px-6 py-3.5">
              <div>
                <h2 className="text-lg font-bold text-zinc-950">
                  {editingId ? "Edit Test" : "Create Test"}
                </h2>
                <p className="mt-1 text-sm font-medium text-zinc-800">
                  {editingId
                    ? "Update this diagnostic test"
                    : "Add a test to the diagnostic catalogue"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                Close
              </button>
            </div>

            <form onSubmit={submitTest} className="space-y-3 px-6 py-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-zinc-950">Test name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Complete Blood Count"
                    className={inputClass}
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-950">Print as</label>
                  <input
                    value={form.printAs}
                    onChange={(e) => setForm((prev) => ({ ...prev, printAs: e.target.value }))}
                    placeholder="Name on report"
                    className={inputClass}
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-950">Department</label>
                  <select
                    value={form.departmentId}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        departmentId: e.target.value,
                        subDepartmentId: "",
                      }))
                    }
                    className={inputClass}
                    disabled={isSaving}
                  >
                    <option value="">Select department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-950">Sub department</label>
                  <select
                    value={form.subDepartmentId}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, subDepartmentId: e.target.value }))
                    }
                    className={inputClass}
                    disabled={
                      isSaving || !form.departmentId || subDepartmentOptions.length === 0
                    }
                  >
                    <option value="">
                      {!form.departmentId
                        ? "Select department first"
                        : subDepartmentOptions.length === 0
                          ? "No sub departments"
                          : "Select sub department"}
                    </option>
                    {subDepartmentOptions.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-950">Amount</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    className={inputClass}
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-950">Test MRP</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.testMrp}
                    onChange={(e) => setForm((prev) => ({ ...prev, testMrp: e.target.value }))}
                    placeholder="0.00"
                    className={inputClass}
                    disabled={isSaving}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-bold text-zinc-950">Done for</label>
                  <div className="mt-2 flex flex-wrap gap-4">
                    {(["Male", "Female", "Both"] as const).map((option) => (
                      <label
                        key={option}
                        className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-800"
                      >
                        <input
                          type="radio"
                          name="doneFor"
                          value={option}
                          checked={form.doneFor === option}
                          onChange={() => setForm((prev) => ({ ...prev, doneFor: option }))}
                          disabled={isSaving}
                          className="h-4 w-4 border-emerald-300 text-emerald-600 focus:ring-emerald-200"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {formError ? (
                <p className="text-sm font-semibold text-red-700">{formError}</p>
              ) : null}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-base font-bold text-zinc-900 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex min-w-36 items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-100 px-4 py-2.5 text-base font-bold text-emerald-900 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSaving ? "Saving…" : editingId ? "Save changes" : "Create test"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
