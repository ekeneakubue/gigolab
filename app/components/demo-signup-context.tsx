"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { DemoCompanyModal } from "@/app/components/DemoCompanyModal";

type DemoSignupContextValue = {
  openDemoModal: () => void;
  closeDemoModal: () => void;
};

const DemoSignupContext = createContext<DemoSignupContextValue | null>(null);

export function DemoSignupProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openDemoModal = useCallback(() => setIsOpen(true), []);
  const closeDemoModal = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#demo") return;
    setIsOpen(true);
  }, []);

  const value = useMemo(
    () => ({ openDemoModal, closeDemoModal }),
    [openDemoModal, closeDemoModal]
  );

  return (
    <DemoSignupContext.Provider value={value}>
      {children}
      <DemoCompanyModal isOpen={isOpen} onClose={closeDemoModal} />
    </DemoSignupContext.Provider>
  );
}

export function useDemoSignup() {
  const ctx = useContext(DemoSignupContext);
  if (!ctx) {
    throw new Error("useDemoSignup must be used within DemoSignupProvider");
  }
  return ctx;
}
