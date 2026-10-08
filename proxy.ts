import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  COMPANY_SESSION_COOKIE,
  parseCompanySessionToken,
} from "@/lib/company-session";

const LOGIN_PATH = "/login";
const LEGACY_COMPANY_LOGIN_PATH = "/company/login";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === LEGACY_COMPANY_LOGIN_PATH) {
    return NextResponse.redirect(new URL(`${LOGIN_PATH}${search}`, request.url));
  }

  const session = await parseCompanySessionToken(
    request.cookies.get(COMPANY_SESSION_COOKIE)?.value
  );

  if (pathname === LOGIN_PATH) {
    if (session) {
      return NextResponse.redirect(new URL("/company", request.url));
    }
    return NextResponse.next();
  }

  if (!pathname.startsWith("/company")) {
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/company", "/company/:path*"],
};
