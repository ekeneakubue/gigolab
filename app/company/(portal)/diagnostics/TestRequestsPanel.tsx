"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { printTestRequestReceipt } from "@/lib/test-request-receipt";

type TestRequestStatus = "Pending" | "In progress" | "Completed";
type Priority = "Routine" | "Urgent" | "STAT";

type RequestItem = {
  amount: number;
  result?: string;
  normalRange?: string;
  test: { name: string; amount: number; printAs?: string };
};

type LabCompany = {
  name: string;
  logoUrl: string | null;
  location: string;
  phone: string | null;
  contactEmail: string;
};

type PaymentStatus = "Unpaid" | "Partial" | "Paid";
type PaymentMethod = "Cash" | "Card" | "Transfer" | "POS" | "Insurance";

type TestRequest = {
  id: string;
  requestCode: string;
  barcodeToken: string;
  patientName: string;
  patientCode?: string;
  doctorName?: string | null;
  priority: Priority;
  sampleType: string;
  clinicalNotes: string;
  tests: string;
  items: RequestItem[];
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  amountPaid?: number;
  status: TestRequestStatus;
  requestedAt: string;
};

type CreatedRequestResponse = TestRequest & {
  patient?: { name: string; patientCode: string };
  doctor?: { name: string } | null;
  company?: LabCompany;
  error?: string;
};

type PatientOption = {
  id: string;
  patientCode: string;
  name: string;
  gender: string;
  phone: string;
};

type DoctorOption = {
  id: string;
  name: string;
  specialization: string;
};

type TestOption = {
  id: string;
  name: string;
  amount: number;
  doneFor: "Male" | "Female" | "Both";
  department?: { name: string };
};

type RequestForm = {
  requestCode: string;
  patientId: string;
  doctorId: string;
  priority: Priority;
  sampleType: string;
  clinicalNotes: string;
  requestedAt: string;
  testIds: string[];
};

const inputClass =
  "mt-1.5 h-10 w-full rounded-xl border border-emerald-200 px-3 text-base font-medium text-zinc-900 placeholder:text-zinc-600 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60";

const statusMeta: Record<TestRequestStatus, { badge: string; dot: string }> = {
  Pending: { badge: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
  "In progress": { badge: "bg-sky-100 text-sky-800", dot: "bg-sky-500" },
  Completed: { badge: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
};

const priorityMeta: Record<Priority, string> = {
  Routine: "bg-zinc-100 text-zinc-700",
  Urgent: "bg-amber-100 text-amber-800",
  STAT: "bg-rose-100 text-rose-800",
};

const currency = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function todayInputValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function generateRequestCode() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `TR-${stamp}${rand}`;
}

function emptyForm(): RequestForm {
  return {
    requestCode: generateRequestCode(),
    patientId: "",
    doctorId: "",
    priority: "Routine",
    sampleType: "",
    clinicalNotes: "",
    requestedAt: todayInputValue(),
    testIds: [],
  };
}

const SAMPLE_TYPES = [
  "Blood",
  "Serum",
  "Plasma",
  "Urine",
  "Stool",
  "Swab",
  "Sputum",
  "CSF",
  "Other",
];

const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "Card", "Transfer", "POS", "Insurance"];

function formatRequestedAt(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);
  return dateFormatter.format(date);
}

function toListItem(payload: {
  id: string;
  requestCode: string;
  barcodeToken: string;
  patientName: string;
  patient?: { name: string; patientCode: string } | null;
  doctor?: { name: string } | null;
  priority?: string;
  sampleType?: string;
  clinicalNotes?: string;
  tests: string;
  items?: RequestItem[];
  totalAmount?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  amountPaid?: number;
  status: string;
  requestedAt: string | Date;
}): TestRequest {
  const status =
    payload.status === "InProgress" || payload.status === "In progress"
      ? "In progress"
      : payload.status === "Completed"
        ? "Completed"
        : "Pending";
  const priority =
    payload.priority === "Urgent" || payload.priority === "STAT"
      ? payload.priority
      : "Routine";
  const paymentStatus: PaymentStatus =
    payload.paymentStatus === "Paid" || payload.paymentStatus === "Partial"
      ? payload.paymentStatus
      : "Unpaid";
  return {
    id: payload.id,
    requestCode: payload.requestCode,
    barcodeToken: payload.barcodeToken,
    patientName: payload.patientName,
    patientCode: payload.patient?.patientCode,
    doctorName: payload.doctor?.name ?? null,
    priority,
    sampleType: payload.sampleType ?? "",
    clinicalNotes: payload.clinicalNotes ?? "",
    tests: payload.tests,
    items: payload.items ?? [],
    totalAmount: payload.totalAmount ?? 0,
    paymentStatus,
    paymentMethod: payload.paymentMethod ?? "",
    amountPaid: payload.amountPaid ?? 0,
    status,
    requestedAt: formatRequestedAt(payload.requestedAt),
  };
}

export default function TestRequestsPanel() {
  const [requests, setRequests] = useState<TestRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [listError, setListError] = useState("");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingRequest, setViewingRequest] = useState<TestRequest | null>(null);
  const [paymentRequest, setPaymentRequest] = useState<TestRequest | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [form, setForm] = useState<RequestForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [testQuery, setTestQuery] = useState("");
  const [labCompany, setLabCompany] = useState<LabCompany>({
    name: "Lab",
    logoUrl: null,
    location: "",
    phone: null,
    contactEmail: "",
  });

  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [tests, setTests] = useState<TestOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadRequests() {
      setIsLoadingRequests(true);
      setListError("");
      try {
        const [requestsRes, sessionRes] = await Promise.all([
          fetch("/api/company/diagnostics/test-requests", { cache: "no-store" }),
          fetch("/api/company/auth/session", { cache: "no-store" }),
        ]);
        const payload = (await requestsRes.json()) as
          | CreatedRequestResponse[]
          | { error?: string };
        const sessionData = (await sessionRes.json()) as {
          company?: { name?: string; logoUrl?: string | null };
        };

        if (cancelled) return;

        if (!requestsRes.ok || !Array.isArray(payload)) {
          setRequests([]);
          setListError(
            !Array.isArray(payload) && payload.error
              ? payload.error
              : "Could not load test requests.",
          );
        } else {
          setRequests(payload.map(toListItem));
        }

        if (sessionData.company) {
          setLabCompany((prev) => ({
            ...prev,
            name: sessionData.company?.name ?? prev.name,
            logoUrl: sessionData.company?.logoUrl ?? prev.logoUrl,
          }));
        }
      } catch {
        if (!cancelled) {
          setRequests([]);
          setListError("Could not load test requests. Please try again.");
        }
      } finally {
        if (!cancelled) setIsLoadingRequests(false);
      }
    }

    void loadRequests();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;

    let cancelled = false;

    async function loadOptions() {
      setIsLoadingOptions(true);
      setOptionsError("");
      try {
        const [patientsRes, doctorsRes, testsRes] = await Promise.all([
          fetch("/api/company/patients", { cache: "no-store" }),
          fetch("/api/company/masters/doctors", { cache: "no-store" }),
          fetch("/api/company/masters/tests", { cache: "no-store" }),
        ]);

        const patientsData = (await patientsRes.json()) as
          | { patients?: PatientOption[]; error?: string }
          | { error?: string };
        const doctorsData = (await doctorsRes.json()) as DoctorOption[] | { error?: string };
        const testsData = (await testsRes.json()) as TestOption[] | { error?: string };

        if (cancelled) return;

        if (!patientsRes.ok || !("patients" in patientsData) || !Array.isArray(patientsData.patients)) {
          setPatients([]);
        } else {
          setPatients(
            patientsData.patients.map((p) => ({
              id: p.id,
              patientCode: p.patientCode,
              name: p.name,
              gender: p.gender ?? "",
              phone: p.phone ?? "",
            })),
          );
        }

        setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
        setTests(Array.isArray(testsData) ? testsData : []);

        if (
          (!patientsRes.ok && !doctorsRes.ok && !testsRes.ok) ||
          (!Array.isArray(doctorsData) && !Array.isArray(testsData) && !("patients" in patientsData))
        ) {
          setOptionsError("Could not load form options. Please try again.");
        }
      } catch {
        if (!cancelled) {
          setPatients([]);
          setDoctors([]);
          setTests([]);
          setOptionsError("Could not load form options. Please try again.");
        }
      } finally {
        if (!cancelled) setIsLoadingOptions(false);
      }
    }

    void loadOptions();
    return () => {
      cancelled = true;
    };
  }, [isModalOpen]);

  useEffect(() => {
    if (!isModalOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) {
        setIsModalOpen(false);
        setFormError("");
        setTestQuery("");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isModalOpen, isSaving]);

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === form.patientId) ?? null,
    [patients, form.patientId],
  );

  const selectedTests = useMemo(
    () => tests.filter((t) => form.testIds.includes(t.id)),
    [tests, form.testIds],
  );

  const estimatedTotal = useMemo(
    () => selectedTests.reduce((sum, test) => sum + (Number.isFinite(test.amount) ? test.amount : 0), 0),
    [selectedTests],
  );

  const availableTests = useMemo(() => {
    const q = testQuery.trim().toLowerCase();
    const gender = selectedPatient?.gender ?? "";
    return tests.filter((test) => {
      if (gender === "Male" && test.doneFor === "Female") return false;
      if (gender === "Female" && test.doneFor === "Male") return false;
      if (!q) return true;
      return [test.name, test.department?.name ?? ""].join(" ").toLowerCase().includes(q);
    });
  }, [tests, testQuery, selectedPatient]);

  const filtered = requests.filter((request) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [request.requestCode, request.patientName, request.tests, request.status]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  function openModal() {
    setForm(emptyForm());
    setFormError("");
    setTestQuery("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSaving) return;
    setIsModalOpen(false);
    setFormError("");
    setTestQuery("");
  }

  async function printReceipt(request: TestRequest, company = labCompany) {
    const receiptTests =
      request.items.length > 0
        ? request.items.map((item) => ({
            name: item.test.name,
            amount: item.amount,
          }))
        : request.tests
            .split(",")
            .map((name) => name.trim())
            .filter(Boolean)
            .map((name) => ({ name, amount: 0 }));

    await printTestRequestReceipt({
      requestCode: request.requestCode,
      barcodeToken: request.barcodeToken,
      patientName: request.patientName,
      patientCode: request.patientCode,
      doctorName: request.doctorName,
      priority: request.priority,
      sampleType: request.sampleType,
      clinicalNotes: request.clinicalNotes,
      requestedAt: request.requestedAt,
      totalAmount: request.totalAmount,
      tests: receiptTests,
      company,
      resultsUrl: `${window.location.origin}/results/${request.barcodeToken}`,
    });
  }

  async function handlePrintReceipt(request: TestRequest) {
    setPrintingId(request.id);
    try {
      await printReceipt(request);
    } finally {
      window.setTimeout(() => setPrintingId(null), 400);
    }
  }

  function openPaymentModal(request: TestRequest) {
    setPaymentRequest(request);
    setPaymentMethod("Cash");
    setAmountPaid(String(request.totalAmount || 0));
    setPaymentRef("");
    setPaymentError("");
  }

  function closePaymentModal() {
    if (isPaying) return;
    setPaymentRequest(null);
    setPaymentError("");
    setAmountPaid("");
    setPaymentRef("");
  }

  async function submitPayment(event: FormEvent) {
    event.preventDefault();
    if (!paymentRequest) return;

    setPaymentError("");
    const paid = Number(amountPaid);
    if (!paymentMethod) {
      setPaymentError("Select a payment method.");
      return;
    }
    if (!Number.isFinite(paid) || paid <= 0) {
      setPaymentError("Enter a valid amount paid.");
      return;
    }
    if (paid > paymentRequest.totalAmount + 0.0001) {
      setPaymentError("Amount paid cannot exceed the request total.");
      return;
    }

    setIsPaying(true);
    try {
      const response = await fetch(
        `/api/company/diagnostics/test-requests/${paymentRequest.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentOnly: true,
            paymentMethod,
            amountPaid: paid,
            paymentRef,
          }),
        },
      );
      const payload = (await response.json()) as CreatedRequestResponse;
      if (!response.ok || !payload.id) {
        setPaymentError(payload.error ?? "Could not record payment.");
        return;
      }

      const paidRequest = toListItem(payload);
      setRequests((prev) =>
        prev.map((item) => (item.id === paidRequest.id ? paidRequest : item)),
      );
      setPaymentRequest(null);
      setPaymentError("");
      await printReceipt(paidRequest);
    } catch {
      setPaymentError("Could not record payment. Please try again.");
    } finally {
      setIsPaying(false);
    }
  }

  function toggleTest(testId: string) {
    setForm((prev) => ({
      ...prev,
      testIds: prev.testIds.includes(testId)
        ? prev.testIds.filter((id) => id !== testId)
        : [...prev.testIds, testId],
    }));
  }

  async function submitRequest(event: FormEvent) {
    event.preventDefault();
    setFormError("");

    if (!form.patientId) {
      setFormError("Select a patient.");
      return;
    }
    if (!form.sampleType.trim()) {
      setFormError("Select a sample type.");
      return;
    }
    if (!form.requestedAt) {
      setFormError("Choose a request date.");
      return;
    }
    if (form.testIds.length === 0) {
      setFormError("Add at least one test.");
      return;
    }

    const patient = patients.find((p) => p.id === form.patientId);
    if (!patient) {
      setFormError("Selected patient is no longer available.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/company/diagnostics/test-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestCode: form.requestCode,
          patientId: form.patientId,
          doctorId: form.doctorId || undefined,
          priority: form.priority,
          sampleType: form.sampleType,
          clinicalNotes: form.clinicalNotes,
          requestedAt: form.requestedAt,
          testIds: form.testIds,
        }),
      });
      const payload = (await response.json()) as CreatedRequestResponse;
      if (!response.ok || !payload.id) {
        setFormError(payload.error ?? "Could not save test request.");
        return;
      }

      const listItem = toListItem(payload);
      setRequests((prev) => [listItem, ...prev]);
      setListError("");
      setIsModalOpen(false);
      setForm(emptyForm());
      setTestQuery("");

      if (payload.company) {
        setLabCompany(payload.company);
      }

      openPaymentModal(listItem);
    } catch {
      setFormError("Could not save test request. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[#dfe4ef] bg-[#f3f5fa] px-4 py-4 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.65)] sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-base font-bold text-zinc-900">Test Requests</h1>
            <p className="text-xs text-zinc-700">Create and track diagnostic test requests</p>
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
                placeholder="Search requests..."
                className="h-9 w-full rounded-lg border border-[#d7ddea] bg-white/80 pl-9 pr-3 text-sm text-zinc-800 placeholder:text-zinc-500 outline-none focus:border-[#bcc6da] focus:bg-white"
              />
            </div>
            <button
              type="button"
              onClick={openModal}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path strokeLinecap="round" d="M12 5v14M5 12h14" />
              </svg>
              New test request
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="overflow-hidden rounded-2xl border border-[#dfe4ef] bg-white shadow-[0_16px_32px_-24px_rgba(15,23,42,0.6)]">
          <div className="border-b border-[#e8ecf5] px-5 py-4">
            <h2 className="text-sm font-bold text-zinc-900">Requests</h2>
            <p className="text-xs text-zinc-600">
              {filtered.length} of {requests.length} requests
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8ecf5] bg-[#f3f5fa]/80">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Request ID
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Patient
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Tests
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Requested
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8ecf5]/80">
                {isLoadingRequests ? (
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
                      <p className="text-sm font-medium text-zinc-700">No test requests yet</p>
                      <p className="mt-1 text-xs text-zinc-600">
                        Click &ldquo;New test request&rdquo; to create one.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((request) => {
                    const status = statusMeta[request.status];
                    return (
                      <tr key={request.id} className="transition-colors hover:bg-[#f3f5fa]/60">
                        <td className="px-5 py-3 font-mono text-[12px] font-semibold text-zinc-800">
                          {request.requestCode}
                        </td>
                        <td className="px-4 py-3 text-zinc-700">{request.patientName}</td>
                        <td className="px-4 py-3 text-zinc-600">
                          <span className="line-clamp-2">{request.tests}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.badge}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                            {request.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-zinc-600">
                          {request.requestedAt}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingRequest(request)}
                              aria-label={`View ${request.requestCode}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-100 bg-sky-50 text-sky-700 transition-colors hover:bg-sky-100"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                className="h-4 w-4"
                                aria-hidden
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
                                />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrintReceipt(request)}
                              disabled={printingId === request.id}
                              aria-label={`Print receipt ${request.requestCode}`}
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 text-[11px] font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
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
                                  d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 14h12v7H6v-7z"
                                />
                              </svg>
                              Receipt
                            </button>
                          </div>
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

      {viewingRequest ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close request details"
            className="absolute inset-0 cursor-default"
            onClick={() => setViewingRequest(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="view-test-request-title"
            className="relative flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-emerald-100 bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-2xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-emerald-50 px-5 py-3.5 sm:px-6">
              <div className="min-w-0">
                <h2 id="view-test-request-title" className="text-lg font-bold text-zinc-950">
                  Test Request
                </h2>
                <p className="mt-1 font-mono text-sm font-semibold text-emerald-800">
                  {viewingRequest.requestCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingRequest(null)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                Close
              </button>
            </div>

            <div className="space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#e8ecf5] bg-[#f8fafc] px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Patient
                  </p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900">
                    {viewingRequest.patientName}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e8ecf5] bg-[#f8fafc] px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Status
                  </p>
                  <span
                    className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusMeta[viewingRequest.status].badge}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${statusMeta[viewingRequest.status].dot}`}
                    />
                    {viewingRequest.status}
                  </span>
                </div>
                <div className="rounded-xl border border-[#e8ecf5] bg-[#f8fafc] px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Requested
                  </p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900">
                    {viewingRequest.requestedAt}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e8ecf5] bg-[#f8fafc] px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Priority
                  </p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900">
                    {viewingRequest.priority}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e8ecf5] bg-[#f8fafc] px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Sample type
                  </p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900">
                    {viewingRequest.sampleType || "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e8ecf5] bg-[#f8fafc] px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Referring doctor
                  </p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900">
                    {viewingRequest.doctorName || "—"}
                  </p>
                </div>
              </div>

              {viewingRequest.clinicalNotes ? (
                <div>
                  <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    Clinical notes
                  </h3>
                  <p className="whitespace-pre-wrap rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 text-sm text-zinc-800">
                    {viewingRequest.clinicalNotes}
                  </p>
                </div>
              ) : null}

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    Tests
                  </h3>
                  <p className="text-xs font-semibold text-zinc-600">
                    {currency.format(viewingRequest.totalAmount)}
                  </p>
                </div>
                <div className="overflow-hidden rounded-xl border border-[#e8ecf5]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#e8ecf5] bg-[#f3f5fa]">
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                          Test
                        </th>
                        <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e8ecf5]">
                      {viewingRequest.items.length > 0 ? (
                        viewingRequest.items.map((item, index) => (
                          <tr key={`${item.test.name}-${index}`}>
                            <td className="px-4 py-3 font-semibold text-zinc-900">
                              {item.test.name}
                            </td>
                            <td className="px-4 py-3 text-right text-zinc-700">
                              {currency.format(item.amount)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-4 py-3 text-zinc-700" colSpan={2}>
                            {viewingRequest.tests || "No tests listed."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 justify-end gap-3 border-t border-emerald-50 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => setViewingRequest(null)}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-bold text-zinc-900 hover:bg-zinc-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handlePrintReceipt(viewingRequest)}
                disabled={printingId === viewingRequest.id}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-100 px-4 py-2.5 text-sm font-bold text-emerald-900 hover:bg-emerald-200 disabled:opacity-60"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-4 w-4"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 14h12v7H6v-7z" />
                </svg>
                Receipt
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close new test request"
            className="absolute inset-0 cursor-default"
            onClick={closeModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-test-request-title"
            className="relative flex max-h-[100dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-emerald-100 bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-2xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-emerald-50 px-5 py-3.5 sm:px-6">
              <div className="min-w-0">
                <h2 id="new-test-request-title" className="text-lg font-bold text-zinc-950">
                  New Test Request
                </h2>
                <p className="mt-1 text-sm font-medium text-zinc-800">
                  Start a diagnostic test request for a patient
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
              >
                Close
              </button>
            </div>

            <form onSubmit={submitRequest} className="flex min-h-0 flex-1 flex-col">
              <div className="space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
                {optionsError ? (
                  <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
                    {optionsError}
                  </p>
                ) : null}

                <section className="space-y-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    Request details
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="request-code" className="text-sm font-bold text-zinc-950">
                        Request ID
                      </label>
                      <input
                        id="request-code"
                        readOnly
                        value={form.requestCode}
                        tabIndex={-1}
                        className={`${inputClass} cursor-default bg-emerald-50/60 font-mono text-sm uppercase text-zinc-700`}
                      />
                    </div>
                    <div>
                      <label htmlFor="requested-at" className="text-sm font-bold text-zinc-950">
                        Request date
                      </label>
                      <input
                        id="requested-at"
                        type="date"
                        value={form.requestedAt}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, requestedAt: e.target.value }))
                        }
                        disabled={isSaving}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="priority" className="text-sm font-bold text-zinc-950">
                        Priority
                      </label>
                      <div className="mt-1.5 flex gap-2">
                        {(["Routine", "Urgent", "STAT"] as Priority[]).map((level) => {
                          const active = form.priority === level;
                          return (
                            <button
                              key={level}
                              type="button"
                              disabled={isSaving}
                              onClick={() => setForm((prev) => ({ ...prev, priority: level }))}
                              className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                                active
                                  ? `${priorityMeta[level]} border-transparent ring-2 ring-emerald-200`
                                  : "border-emerald-200 bg-white text-zinc-700 hover:bg-emerald-50/50"
                              }`}
                            >
                              {level}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label htmlFor="sample-type" className="text-sm font-bold text-zinc-950">
                        Sample type
                      </label>
                      <select
                        id="sample-type"
                        value={form.sampleType}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, sampleType: e.target.value }))
                        }
                        disabled={isSaving}
                        className={inputClass}
                      >
                        <option value="">Select sample type</option>
                        {SAMPLE_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    Patient & referral
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label htmlFor="patient" className="text-sm font-bold text-zinc-950">
                        Patient
                      </label>
                      <select
                        id="patient"
                        value={form.patientId}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, patientId: e.target.value }))
                        }
                        disabled={isSaving || isLoadingOptions}
                        className={inputClass}
                      >
                        <option value="">
                          {isLoadingOptions ? "Loading patients…" : "Select patient"}
                        </option>
                        {patients.map((patient) => (
                          <option key={patient.id} value={patient.id}>
                            {patient.name} · {patient.patientCode}
                            {patient.phone ? ` · ${patient.phone}` : ""}
                          </option>
                        ))}
                      </select>
                      {selectedPatient ? (
                        <p className="mt-1.5 text-xs font-medium text-zinc-600">
                          {selectedPatient.gender || "Gender n/a"}
                          {selectedPatient.phone ? ` · ${selectedPatient.phone}` : ""}
                        </p>
                      ) : null}
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="doctor" className="text-sm font-bold text-zinc-950">
                        Referring doctor{" "}
                        <span className="font-medium text-zinc-500">(optional)</span>
                      </label>
                      <select
                        id="doctor"
                        value={form.doctorId}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, doctorId: e.target.value }))
                        }
                        disabled={isSaving || isLoadingOptions}
                        className={inputClass}
                      >
                        <option value="">
                          {isLoadingOptions ? "Loading doctors…" : "No referring doctor"}
                        </option>
                        {doctors.map((doctor) => (
                          <option key={doctor.id} value={doctor.id}>
                            {doctor.name}
                            {doctor.specialization ? ` · ${doctor.specialization}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="clinical-notes" className="text-sm font-bold text-zinc-950">
                        Clinical notes{" "}
                        <span className="font-medium text-zinc-500">(optional)</span>
                      </label>
                      <textarea
                        id="clinical-notes"
                        rows={3}
                        value={form.clinicalNotes}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, clinicalNotes: e.target.value }))
                        }
                        disabled={isSaving}
                        placeholder="Indication, symptoms, or special instructions…"
                        className="mt-1.5 w-full rounded-xl border border-emerald-200 px-3 py-2.5 text-base font-medium text-zinc-900 placeholder:text-zinc-600 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                      Tests
                    </h3>
                    <p className="text-xs font-semibold text-zinc-600">
                      {selectedTests.length} selected
                      {selectedTests.length > 0 ? ` · ${currency.format(estimatedTotal)}` : ""}
                    </p>
                  </div>

                  {selectedTests.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedTests.map((test) => (
                        <button
                          key={test.id}
                          type="button"
                          onClick={() => toggleTest(test.id)}
                          disabled={isSaving}
                          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
                        >
                          {test.name}
                          <span className="text-emerald-700/70" aria-hidden>
                            ×
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-[#f8faf9]">
                    <div className="border-b border-emerald-100 bg-white px-3 py-2.5">
                      <div className="relative">
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
                          value={testQuery}
                          onChange={(e) => setTestQuery(e.target.value)}
                          disabled={isSaving || isLoadingOptions}
                          placeholder="Search tests to add…"
                          className="h-9 w-full rounded-lg border border-emerald-200 bg-white pl-9 pr-3 text-sm text-zinc-800 placeholder:text-zinc-500 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                        />
                      </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                      {isLoadingOptions ? (
                        <p className="px-4 py-8 text-center text-sm text-zinc-600">Loading tests…</p>
                      ) : availableTests.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-zinc-600">
                          {tests.length === 0
                            ? "No tests in catalogue. Add tests under Test Settings first."
                            : "No tests match this search."}
                        </p>
                      ) : (
                        <ul className="divide-y divide-emerald-50">
                          {availableTests.map((test) => {
                            const checked = form.testIds.includes(test.id);
                            return (
                              <li key={test.id}>
                                <button
                                  type="button"
                                  onClick={() => toggleTest(test.id)}
                                  disabled={isSaving}
                                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-emerald-50/80 ${
                                    checked ? "bg-emerald-50/60" : "bg-transparent"
                                  }`}
                                >
                                  <span
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                      checked
                                        ? "border-emerald-500 bg-emerald-500 text-white"
                                        : "border-emerald-300 bg-white text-transparent"
                                    }`}
                                    aria-hidden
                                  >
                                    <svg
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth={3}
                                      className="h-3 w-3"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-semibold text-zinc-900">
                                      {test.name}
                                    </span>
                                    <span className="block truncate text-xs text-zinc-600">
                                      {test.department?.name ?? "General"} · {test.doneFor}
                                    </span>
                                  </span>
                                  <span className="shrink-0 text-xs font-bold text-zinc-700">
                                    {currency.format(test.amount)}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                </section>

                {formError ? (
                  <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
                    {formError}
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-emerald-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-xs font-medium text-zinc-600">
                  {selectedTests.length > 0
                    ? `Est. total ${currency.format(estimatedTotal)} · opens payment after create`
                    : "Select patient, sample type, and at least one test"}
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSaving}
                    className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-bold text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || isLoadingOptions}
                    className="inline-flex min-w-36 items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-100 px-4 py-2.5 text-sm font-bold text-emerald-900 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Creating…
                      </>
                    ) : (
                      "Create & Pay"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {paymentRequest ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-zinc-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close payment"
            className="absolute inset-0 cursor-default"
            onClick={closePaymentModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
            className="relative flex max-h-[100dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-emerald-100 bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-2xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-emerald-50 px-5 py-3.5 sm:px-6">
              <div className="min-w-0">
                <h2 id="payment-modal-title" className="text-lg font-bold text-zinc-950">
                  Collect payment
                </h2>
                <p className="mt-1 font-mono text-sm font-semibold text-emerald-800">
                  {paymentRequest.requestCode}
                </p>
                <p className="mt-1 text-sm text-zinc-700">{paymentRequest.patientName}</p>
              </div>
              <button
                type="button"
                onClick={closePaymentModal}
                disabled={isPaying}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
              >
                Close
              </button>
            </div>

            <form onSubmit={submitPayment} className="flex min-h-0 flex-1 flex-col">
              <div className="space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Amount due
                  </p>
                  <p className="mt-1 text-2xl font-bold text-emerald-950">
                    {currency.format(paymentRequest.totalAmount)}
                  </p>
                  <p className="mt-1 text-xs font-medium text-emerald-900/80">
                    {paymentRequest.items.length || paymentRequest.tests.split(",").filter(Boolean).length}{" "}
                    test(s) · {paymentRequest.sampleType || "Sample n/a"}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-sm font-bold text-zinc-950">Payment method</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {PAYMENT_METHODS.map((method) => {
                      const active = paymentMethod === method;
                      return (
                        <button
                          key={method}
                          type="button"
                          disabled={isPaying}
                          onClick={() => setPaymentMethod(method)}
                          className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                            active
                              ? "border-emerald-400 bg-emerald-100 text-emerald-900 ring-2 ring-emerald-200"
                              : "border-emerald-200 bg-white text-zinc-700 hover:bg-emerald-50/60"
                          }`}
                        >
                          {method}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="amount-paid" className="text-sm font-bold text-zinc-950">
                      Amount paid
                    </label>
                    <input
                      id="amount-paid"
                      type="number"
                      min="0"
                      step="0.01"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      disabled={isPaying}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="payment-ref" className="text-sm font-bold text-zinc-950">
                      Reference{" "}
                      <span className="font-medium text-zinc-500">(optional)</span>
                    </label>
                    <input
                      id="payment-ref"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      disabled={isPaying}
                      placeholder="Txn / POS slip #"
                      className={inputClass}
                    />
                  </div>
                </div>

                {paymentError ? (
                  <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
                    {paymentError}
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-emerald-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-xs font-medium text-zinc-600">
                  Confirming payment prints the QR receipt.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closePaymentModal}
                    disabled={isPaying}
                    className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-bold text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
                  >
                    Pay later
                  </button>
                  <button
                    type="submit"
                    disabled={isPaying}
                    className="inline-flex min-w-36 items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-100 px-4 py-2.5 text-sm font-bold text-emerald-900 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPaying ? "Processing…" : "Confirm & print"}
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
