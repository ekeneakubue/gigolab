import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  parseAdminSessionToken,
} from "@/lib/admin-session";
import {
  COMPANY_SESSION_COOKIE,
  parseCompanySessionToken,
} from "@/lib/company-session";
import {
  PATIENT_SESSION_COOKIE,
  parsePatientSessionToken,
} from "@/lib/patient-session";

const LOGIN_PATH = "/login";
const PATIENT_LOGIN_PATH = "/patients/login";
const LEGACY_COMPANY_LOGIN_PATH = "/company/login";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === LEGACY_COMPANY_LOGIN_PATH) {
    return NextResponse.redirect(new URL(`${LOGIN_PATH}${search}`, request.url));
  }

  const adminSession = await parseAdminSessionToken(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
  );
  const companySession = await parseCompanySessionToken(
    request.cookies.get(COMPANY_SESSION_COOKIE)?.value,
  );
  const patientSession = await parsePatientSessionToken(
    request.cookies.get(PATIENT_SESSION_COOKIE)?.value,
  );

  if (pathname === LOGIN_PATH) {
    if (adminSession) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (companySession) {
      return NextResponse.redirect(
        new URL(companySession.dashboardRoute || "/company", request.url),
      );
    }
    return NextResponse.next();
  }

  if (pathname === PATIENT_LOGIN_PATH || pathname.startsWith(`${PATIENT_LOGIN_PATH}/`)) {
    if (patientSession) {
      return NextResponse.redirect(new URL("/patients", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/patients")) {
    if (!patientSession) {
      const loginUrl = new URL(PATIENT_LOGIN_PATH, request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!adminSession) {
      const loginUrl = new URL(LOGIN_PATH, request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (!pathname.startsWith("/company")) {
    return NextResponse.next();
  }

  if (!companySession) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/company/dashboards/")) {
    const allowedRoute = companySession.dashboardRoute;
    const isOwnDashboard =
      Boolean(allowedRoute) &&
      (pathname === allowedRoute || pathname.startsWith(`${allowedRoute}/`));
    if (!isOwnDashboard) {
      return NextResponse.redirect(
        new URL(allowedRoute || "/company", request.url),
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/company",
    "/company/:path*",
    "/admin",
    "/admin/:path*",
    "/patients",
    "/patients/:path*",
  ],
};
