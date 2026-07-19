"use client";

import { useDemoSignup } from "@/app/components/demo-signup-context";

type GetDemoButtonProps = {
  className?: string;
  children?: React.ReactNode;
};

export default function GetDemoButton({
  className,
  children = "Get a Demo",
}: GetDemoButtonProps) {
  const { openDemoModal } = useDemoSignup();

  return (
    <button type="button" onClick={openDemoModal} className={className}>
      {children}
    </button>
  );
}
