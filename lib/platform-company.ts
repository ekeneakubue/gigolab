import { CompanyPlan } from "@prisma/client";

import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

/** Reserved lab code for the internal Gigolab platform organisation. */
export const PLATFORM_COMPANY_CODE = "Gigolab-Platfm";
export const PLATFORM_COMPANY_NAME = "Gigolab";

export async function getOrCreatePlatformCompany() {
  const existing = await prisma.company.findUnique({
    where: { code: PLATFORM_COMPANY_CODE },
    select: { id: true, name: true },
  });

  if (existing) {
    return existing;
  }

  return prisma.company.create({
    data: {
      code: PLATFORM_COMPANY_CODE,
      name: PLATFORM_COMPANY_NAME,
      initials: "GL",
      location: "Platform",
      plan: CompanyPlan.Pinnacle,
      status: "Active",
      contactEmail: "admin@gigolab.com",
      passwordHash: hashPassword(crypto.randomUUID()),
    },
    select: { id: true, name: true },
  });
}
