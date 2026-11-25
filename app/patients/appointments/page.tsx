"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import PatientShell from "../components/PatientShell";

type AppointmentStatus = "Pending" | "Confirmed" | "Cancelled" | "Completed";

type Appointment = {
  id: string;
  scheduledAt: string;
  reason: string;
  notes: string;
  status: AppointmentStatus;
  createdAt: string;
};

const inputClass =
  "mt-1.5 h-10 w-full rounded-xl border border-emerald-200 px-3 text-base font-medium text-zinc-900 placeholder:text-zinc-600 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60";

const statusMeta: Record<AppointmentStatus, string> = {
  Pending: "bg-amber-100 text-amber-800",
  Confirmed: "bg-sky-100 text-sky-800",
  Cancelled: "bg-zinc-200 text-zinc-700",
  Completed: "bg-emerald-100 text-emerald-800",
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function toLocalInputValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(toLocalInputValue());
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function loadAppointments() {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/patients/appointments", { cache: "no-store" });
      const payload = (await response.json()) as {
        appointments?: Appointment[];
        error?: string;
      };
      if (!response.ok || !Array.isArray(payload.appointments)) {
        setAppointments([]);
        setError(payload.error ?? "Could not load appointments.");
        return;
      }
      setAppointments(payload.appointments);
    } catch {
      setAppointments([]);
      setError("Could not load appointments. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadAppointments();
  }, []);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return appointments
      .filter(
        (item) =>
          new Date(item.scheduledAt).getTime() >= now &&
          (item.status === "Pending" || item.status === "Confirmed"),
      )
      .sort(
        (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      );
  }, [appointments]);

  const past = useMemo(() => {
    const upcomingIds = new Set(upcoming.map((item) => item.id));
    return appointments
      .filter((item) => !upcomingIds.has(item.id))
      .sort(
        (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
      );
  }, [appointments, upcoming]);

  function openModal() {
    setScheduledAt(toLocalInputValue(new Date(Date.now() + 60 * 60 * 1000)));
    setReason("");
    setNotes("");
    setFormError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSaving) return;
    setIsModalOpen(false);
    setFormError("");
  }

  async function submitAppointment(event: FormEvent) {
    event.preventDefault();
    setFormError("");

    if (!scheduledAt) {
      setFormError("Choose a date and time.");
      return;
    }
    if (!reason.trim()) {
      setFormError("Enter a reason for the visit.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/patients/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledAt: new Date(scheduledAt).toISOString(),
          reason,
          notes,
        }),
      });
      const payload = (await response.json()) as {
        appointment?: Appointment;
        error?: string;
      };
      if (!response.ok || !payload.appointment) {
        setFormError(payload.error ?? "Could not book appointment.");
        return;
      }
      setAppointments((prev) => [...prev, payload.appointment!]);
      setIsModalOpen(false);
    } catch {
      setFormError("Could not book appointment. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PatientShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Appointments</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Request a visit with your lab. New bookings start as Pending.
            </p>
          </div>
          <button
            type="button"
            onClick={openModal}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-emerald-300 bg-emerald-100 px-4 text-sm font-bold text-emerald-900 hover:bg-emerald-200"
          >
            Book appointment
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-zinc-600">Loading appointments…</p>
        ) : error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
            {error}
          </p>
        ) : (
          <>
            <AppointmentSection title="Upcoming" items={upcoming} empty="No upcoming appointments." />
            <AppointmentSection title="History" items={past} empty="No past appointments yet." />
          </>
        )}
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close booking form"
            className="absolute inset-0 cursor-default"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-t-2xl border border-emerald-100 bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-emerald-50 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-950">Book appointment</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Send a booking request to your lab.
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

            <form onSubmit={submitAppointment} className="space-y-4 px-5 py-5">
              <div>
                <label htmlFor="scheduled-at" className="text-sm font-bold text-zinc-950">
                  Date & time
                </label>
                <input
                  id="scheduled-at"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  disabled={isSaving}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="reason" className="text-sm font-bold text-zinc-950">
                  Reason
                </label>
                <input
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={isSaving}
                  placeholder="e.g. Sample collection, follow-up"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="notes" className="text-sm font-bold text-zinc-950">
                  Notes <span className="font-medium text-zinc-500">(optional)</span>
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isSaving}
                  placeholder="Anything the lab should know…"
                  className="mt-1.5 w-full rounded-xl border border-emerald-200 px-3 py-2.5 text-base font-medium text-zinc-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
                />
              </div>

              {formError ? (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
                  {formError}
                </p>
              ) : null}

              <div className="flex justify-end gap-3 pt-2">
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
                  disabled={isSaving}
                  className="inline-flex min-w-32 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-100 px-4 py-2.5 text-sm font-bold text-emerald-900 hover:bg-emerald-200 disabled:opacity-60"
                >
                  {isSaving ? "Booking…" : "Submit request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </PatientShell>
  );
}

function AppointmentSection({
  title,
  items,
  empty,
}: {
  title: string;
  items: Appointment[];
  empty: string;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#dfe4ef] bg-white shadow-[0_16px_32px_-24px_rgba(15,23,42,0.45)]">
      <div className="border-b border-[#e8ecf5] px-5 py-4">
        <h2 className="text-sm font-bold text-zinc-900">{title}</h2>
        <p className="text-xs text-zinc-600">{items.length} appointment(s)</p>
      </div>
      {items.length === 0 ? (
        <p className="px-5 py-8 text-sm text-zinc-600">{empty}</p>
      ) : (
        <ul className="divide-y divide-[#e8ecf5]">
          {items.map((appointment) => (
            <li key={appointment.id} className="px-5 py-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{appointment.reason}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {dateTimeFormatter.format(new Date(appointment.scheduledAt))}
                  </p>
                  {appointment.notes ? (
                    <p className="mt-2 text-sm text-zinc-600">{appointment.notes}</p>
                  ) : null}
                </div>
                <span
                  className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusMeta[appointment.status]}`}
                >
                  {appointment.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
