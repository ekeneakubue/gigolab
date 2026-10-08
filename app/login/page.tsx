import { Suspense } from "react";

import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#e8ecf3] text-base text-zinc-700">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
