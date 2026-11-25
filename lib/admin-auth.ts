import { cookies } from "next/headers";

export {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  clearAdminSessionCookieOptions,
  createAdminSessionToken,
  parseAdminSessionToken,
  type AdminSession,
} from "@/lib/admin-session";

import {
  ADMIN_SESSION_COOKIE,
  parseAdminSessionToken,
} from "@/lib/admin-session";

export async function getAdminSession() {
  const cookieStore = await cookies();
  return parseAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}
