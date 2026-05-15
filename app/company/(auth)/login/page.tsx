import { Suspense } from "react";

import CompanyLoginForm from "./company-login-form";

export default function CompanyLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#e8ecf3] text-base text-zinc-700">
          Loading…
        </div>
      }
    >
      <CompanyLoginForm />
    </Suspense>
  );
}
