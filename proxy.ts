import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  COMPANY_SESSION_COOKIE,
  parseCompanySessionToken,
} from "@/lib/company-session";

const PUBLIC_COMPANY_PATHS = ["/company/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/company")) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_COMPANY_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  const session = await parseCompanySessionToken(
    request.cookies.get(COMPANY_SESSION_COOKIE)?.value
  );

  if (isPublic) {
    if (session && pathname === "/company/login") {
      return NextResponse.redirect(new URL("/company", request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/company/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/company", "/company/:path*"],
};
