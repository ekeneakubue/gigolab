"use client";

import { useState } from "react";

type MasterTab = "lab" | "accounting";

const tabs: { id: MasterTab; label: string; description: string }[] = [
  {
    id: "lab",
    label: "Lab Management Master",
    description: "Tests, profiles, instruments, and lab configuration.",
  },
  {
    id: "accounting",
    label: "Accounting System Master",
    description: "Tariffs, billing codes, payers, and financial setup.",
  },
];

export default function CompanyMastersPage() {
  const [active, setActive] = useState<MasterTab>("lab");

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[#dfe4ef] bg-[#f3f5fa] px-6 py-4 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.65)]">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-base font-bold text-zinc-900">Masters</h1>
            <p className="text-xs text-zinc-700">Choose a master domain to configure reference data.</p>
          </div>

          <div
            className="flex flex-wrap gap-2 rounded-xl border border-[#dfe4ef] bg-[#eef1f6] p-1.5 shadow-[inset_0_2px_8px_rgba(15,23,42,0.06)]"
            role="tablist"
            aria-label="Master type"
          >
            {tabs.map((tab) => {
              const isSelected = active === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActive(tab.id)}
                  className={`min-h-[44px] flex-1 rounded-lg px-4 py-2.5 text-left transition-all duration-150 sm:min-w-[200px] sm:flex-none ${
                    isSelected
                      ? "bg-white text-zinc-900 shadow-[0_12px_26px_-18px_rgba(15,23,42,0.65)] ring-1 ring-[#dfe4ef]"
                      : "text-zinc-600 hover:bg-white/70 hover:text-zinc-900"
                  }`}
                >
                  <span className="block text-sm font-semibold leading-snug">{tab.label}</span>
                  <span className={`mt-0.5 block text-[11px] leading-snug ${isSelected ? "text-zinc-700" : "text-zinc-600"}`}>
                    {tab.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <section className="overflow-hidden rounded-2xl border border-[#dfe4ef] bg-[#f8f9fc] p-8 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.6)]">
          {active === "lab" ? (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Lab Management Master</p>
              <h2 className="text-lg font-bold text-zinc-900">Reference data for laboratory operations</h2>
              <p className="max-w-xl text-sm text-zinc-700">
                Configure departments, tests, specimen types, instruments, and QC rules. Tables and forms for each entity will
                appear here as you build them out.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {["Tests & panels", "Specimens & containers", "Instruments & interfaces"].map((card) => (
                  <div
                    key={card}
                    className="rounded-xl border border-[#e8ecf5] bg-white/80 px-4 py-3 text-sm font-medium text-zinc-700 shadow-[0_8px_20px_-16px_rgba(15,23,42,0.45)]"
                  >
                    {card}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Accounting System Master</p>
              <h2 className="text-lg font-bold text-zinc-900">Reference data for billing and finance</h2>
              <p className="max-w-xl text-sm text-zinc-700">
                Manage price lists, service codes, insurance contracts, tax profiles, and payment terms. Detailed grids will
                plug into this section later.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {["Tariffs & packages", "Payers & contracts", "Tax & rounding rules"].map((card) => (
                  <div
                    key={card}
                    className="rounded-xl border border-[#e8ecf5] bg-white/80 px-4 py-3 text-sm font-medium text-zinc-700 shadow-[0_8px_20px_-16px_rgba(15,23,42,0.45)]"
                  >
                    {card}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
