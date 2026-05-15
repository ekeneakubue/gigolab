"use client";

import { useMemo, useState } from "react";

const WEEK_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** First visible Sunday grid cell through 6 weeks (42 cells). */
function formatSelectedLong(selectedKey: string): string {
  const [ys, ms, ds] = selectedKey.split("-");
  const y = parseInt(ys ?? "", 10);
  const m = parseInt(ms ?? "", 10);
  const d = parseInt(ds ?? "", 10);
  if ([y, m, d].some((n) => Number.isNaN(n))) return selectedKey;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function buildMonthCells(viewMonth: Date): { date: Date; inMonth: boolean }[] {
  const y = viewMonth.getFullYear();
  const m = viewMonth.getMonth();
  const first = new Date(y, m, 1);
  const lastDay = new Date(y, m + 1, 0).getDate();
  const startPad = first.getDay();

  const cells: { date: Date; inMonth: boolean }[] = [];

  const prevMonthLast = new Date(y, m, 0).getDate();
  for (let i = 0; i < startPad; i++) {
    const day = prevMonthLast - startPad + i + 1;
    cells.push({ date: new Date(y, m - 1, day), inMonth: false });
  }

  for (let d = 1; d <= lastDay; d++) {
    cells.push({ date: new Date(y, m, d), inMonth: true });
  }

  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({ date: new Date(y, m + 1, nextDay), inMonth: false });
    nextDay++;
  }

  return cells;
}

export default function CalendarSection() {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const todayKey = dayKey(new Date());

  const cells = useMemo(() => buildMonthCells(cursor), [cursor]);

  const title = cursor.toLocaleString(undefined, { month: "long", year: "numeric" });

  function shiftMonth(delta: number) {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  function goToday() {
    const n = new Date();
    setCursor(startOfMonth(n));
    setSelectedKey(dayKey(n));
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Calendar</p>
        <h2 className="mt-1 text-lg font-bold text-zinc-900">Month view</h2>
        <p className="mt-1 max-w-xl text-sm text-zinc-700">
          Browse months, pick a day, and spot today at a glance. Hook shifts or maintenance reminders here later.
        </p>
      </div>

      <div className="mx-auto w-full max-w-lg rounded-2xl border border-[#dfe4ef] bg-white p-4 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.55)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8ecf5] pb-4">
          <h3 className="text-lg font-bold tabular-nums text-zinc-900 sm:text-xl">{title}</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToday()}
              className="rounded-lg border border-[#d7ddea] bg-[#f8f9fc] px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-white"
            >
              Today
            </button>
            <div className="flex rounded-lg border border-[#dfe4ef] bg-[#eef1f6] p-0.5">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                aria-label="Previous month"
                className="rounded-md p-2 text-zinc-600 transition-colors hover:bg-white hover:text-zinc-900"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                aria-label="Next month"
                className="rounded-md p-2 text-zinc-600 transition-colors hover:bg-white hover:text-zinc-900"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-y-1">
          {WEEK_LABELS.map((w) => (
            <div key={w} className="pb-2 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
              {w}
            </div>
          ))}
          {cells.map(({ date, inMonth }) => {
            const key = dayKey(date);
            const isToday = key === todayKey;
            const isSelected = selectedKey === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedKey(key)}
                className={`relative mx-auto flex h-10 w-full max-w-11 items-center justify-center rounded-xl text-sm font-semibold tabular-nums transition-colors sm:h-11 ${
                  !inMonth
                    ? "text-zinc-700"
                    : isSelected
                      ? "bg-zinc-700 text-white shadow-[0_8px_18px_-12px_rgba(15,23,42,0.45)]"
                      : isToday
                        ? "bg-[#eef1f6] text-zinc-900 ring-2 ring-[#bcc6da] ring-offset-2 ring-offset-white"
                        : "text-zinc-800 hover:bg-zinc-100"
                }`}
                aria-label={date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                aria-pressed={isSelected}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>

        <p className="mt-4 border-t border-[#e8ecf5] pt-4 text-center text-xs text-zinc-600">
          {selectedKey ? (
            <>
              Selected: <span className="font-semibold text-zinc-600">{formatSelectedLong(selectedKey)}</span>
            </>
          ) : (
            <>Tap a date to select it.</>
          )}
        </p>
      </div>
    </div>
  );
}
