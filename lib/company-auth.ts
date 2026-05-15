import { cookies } from "next/headers";

export {
  COMPANY_SESSION_COOKIE,
  clearCompanySessionCookieOptions,
  companySessionCookieOptions,
  createCompanySessionToken,
  parseCompanySessionToken,
  type CompanySession,
} from "@/lib/company-session";

import {
  COMPANY_SESSION_COOKIE,
  parseCompanySessionToken,
} from "@/lib/company-session";

export async function getCompanySession() {
  const cookieStore = await cookies();
  return parseCompanySessionToken(cookieStore.get(COMPANY_SESSION_COOKIE)?.value);
}
