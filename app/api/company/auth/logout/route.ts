import { NextResponse } from "next/server";

import { clearCompanySessionCookieOptions } from "@/lib/company-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(clearCompanySessionCookieOptions());
  return response;
}
