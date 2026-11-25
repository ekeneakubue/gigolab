import { NextResponse } from "next/server";

import { getPatientSession } from "@/lib/patient-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getPatientSession();
  if (!session) {
    return NextResponse.json({ patient: null }, { status: 401 });
  }

  const company = await prisma.company.findUnique({
    where: { id: session.companyId },
    select: { name: true, logoUrl: true, location: true, phone: true },
  });

  return NextResponse.json({
    patient: {
      ...session,
      companyName: company?.name ?? session.companyName,
      companyLogoUrl: company?.logoUrl ?? session.companyLogoUrl,
      companyLocation: company?.location ?? "",
      companyPhone: company?.phone ?? null,
    },
  });
}
