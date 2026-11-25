import { cookies } from "next/headers";

export {
  PATIENT_SESSION_COOKIE,
  clearPatientSessionCookieOptions,
  createPatientSessionToken,
  parsePatientSessionToken,
  patientSessionCookieOptions,
  type PatientSession,
} from "@/lib/patient-session";

import {
  PATIENT_SESSION_COOKIE,
  parsePatientSessionToken,
} from "@/lib/patient-session";

export async function getPatientSession() {
  const cookieStore = await cookies();
  return parsePatientSessionToken(cookieStore.get(PATIENT_SESSION_COOKIE)?.value);
}
