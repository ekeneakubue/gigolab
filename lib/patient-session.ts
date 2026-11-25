export const PATIENT_SESSION_COOKIE = "gigolab_patient_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type PatientSession = {
  patientId: string;
  companyId: string;
  companyName: string;
  companyLogoUrl: string | null;
  name: string;
  email: string;
  patientCode: string;
};

type SignedSessionPayload = PatientSession & {
  exp: number;
};

function getSessionSecret() {
  return (
    process.env.PATIENT_SESSION_SECRET ??
    process.env.COMPANY_SESSION_SECRET ??
    process.env.DATABASE_URL ??
    "gigolab-dev-patient-session-secret"
  );
}

function encodeBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBase64UrlBytes(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function timingSafeEqualStrings(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function signPayload(encodedPayload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(encodedPayload),
  );

  return encodeBase64UrlBytes(new Uint8Array(signature));
}

export async function createPatientSessionToken(session: PatientSession) {
  const payload: SignedSessionPayload = {
    ...session,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = await signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function parsePatientSessionToken(token: string | undefined | null) {
  if (!token) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = await signPayload(encodedPayload);
  if (!timingSafeEqualStrings(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as SignedSessionPayload;

    if (
      !payload.patientId ||
      !payload.companyId ||
      !payload.name ||
      !payload.email ||
      !payload.patientCode ||
      !payload.exp
    ) {
      return null;
    }
    if (Date.now() > payload.exp) return null;

    return {
      patientId: payload.patientId,
      companyId: payload.companyId,
      companyName: payload.companyName ?? "Lab",
      companyLogoUrl:
        typeof payload.companyLogoUrl === "string" ? payload.companyLogoUrl : null,
      name: payload.name,
      email: payload.email,
      patientCode: payload.patientCode,
    };
  } catch {
    return null;
  }
}

export function patientSessionCookieOptions(token: string) {
  return {
    name: PATIENT_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export function clearPatientSessionCookieOptions() {
  return {
    name: PATIENT_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}
