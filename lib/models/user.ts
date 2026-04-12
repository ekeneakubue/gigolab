import type { AccountStatus } from "./status";

/**
 * Application role for permissions. UI may show a separate job title;
 * keep this aligned with admin "Add user" options plus legacy demo labels.
 */
export type UserRole =
  | "Admin"
  | "Manager"
  | "Staff"
  | "Lab Manager"
  | "Supervisor"
  | "Receptionist"
  | "Technician";

/**
 * Person who can sign in. Belongs to exactly one company when onboarded;
 * `companyId` null means not yet assigned to a tenant.
 */
export type User = {
  id: string;
  companyId: string | null;
  email: string;
  name: string;
  initials: string;
  role: UserRole;
  status: AccountStatus;
  /** Human-readable access summary for admin tables; refine to RBAC flags later. */
  accessLabel: string;
  createdAt: Date;
  lastSeenAt: Date | null;
  /** Never store plain passwords on a client model; use only on the server / auth layer. */
  passwordHash?: string;
  imageUrl?: string | null;
};

/** User with optional joined company for list/detail APIs. */
export type UserWithCompany = User & {
  company?: { id: string; name: string } | null;
};
