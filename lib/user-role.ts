import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const ROLE_FROM_LABEL: Record<string, UserRole> = {
  Admin: "Admin",
  Manager: "Manager",
  Staff: "Staff",
  "Lab Manager": "LabManager",
  LabManager: "LabManager",
  "Lab Owner": "LabOwner",
  LabOwner: "LabOwner",
  "Lab Technician": "LabTechnician",
  LabTechnician: "LabTechnician",
  "Lab Receptionist": "LabReceptionist",
  LabReceptionist: "LabReceptionist",
  "Lab HR": "LabHR",
  LabHR: "LabHR",
  Supervisor: "Supervisor",
  Receptionist: "Receptionist",
  Technician: "Technician",
};

const ROLE_LABEL: Partial<Record<UserRole, string>> = {
  LabManager: "Lab Manager",
  LabOwner: "Lab Owner",
  LabTechnician: "Lab Technician",
  LabReceptionist: "Lab Receptionist",
  LabHR: "Lab HR",
};

export function parseUserRole(value: string | undefined): UserRole | null {
  if (!value) return "Staff";
  return ROLE_FROM_LABEL[value] ?? null;
}

export function toRoleLabel(role: UserRole) {
  return ROLE_LABEL[role] ?? role;
}

/** All assignable system roles from the Prisma/DB UserRole enum. */
export function listUserRoleLabels(): string[] {
  return (Object.values(UserRole) as UserRole[]).map(toRoleLabel);
}

/**
 * Prefer Postgres enum labels (includes @map display values).
 * Falls back to Prisma client enum if the query is unavailable.
 */
export async function listUserRoleLabelsFromDatabase(): Promise<string[]> {
  try {
    const rows = await prisma.$queryRaw<Array<{ label: string }>>`
      SELECT e.enumlabel AS label
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname = 'UserRole'
        AND n.nspname = current_schema()
      ORDER BY e.enumsortorder
    `;
    if (rows.length > 0) {
      return rows.map((row) => {
        const mapped = ROLE_FROM_LABEL[row.label];
        return mapped ? toRoleLabel(mapped) : row.label;
      });
    }
  } catch {
    // fall through to Prisma enum
  }
  return listUserRoleLabels();
}
