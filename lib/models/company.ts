import type { AccountStatus } from "./status";

/** Subscription tier shown on the companies admin surface. */
export type CompanyPlan = "Base" | "Ascent" | "Summit" | "Pinnacle";

/**
 * Organisation (lab) using the product. One company has many users.
 * Counts such as `userCount` / `sampleCount` are often denormalised for dashboards;
 * they can be derived from related tables instead when a database exists.
 */
export type Company = {
  id: string;
  name: string;
  /** Short label for avatars; usually two letters. */
  initials: string;
  location: string;
  plan: CompanyPlan;
  status: AccountStatus;
  /** Primary billing / admin contact email for the organisation. */
  contactEmail: string;
  phone: string | null;
  joinedAt: Date;
  lastActiveAt: Date | null;
  userCount: number;
  sampleCount: number;
  /** Public URL or storage key for logo; omit when not uploaded. */
  logoUrl?: string | null;
};
