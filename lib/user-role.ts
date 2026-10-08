import type { UserRole } from "@prisma/client";

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
