import { NextResponse } from "next/server";

import { clearPatientSessionCookieOptions } from "@/lib/patient-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(clearPatientSessionCookieOptions());
  return response;
}
