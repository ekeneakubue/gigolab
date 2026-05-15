import { NextResponse } from "next/server";

import { getCompanySession } from "@/lib/company-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getCompanySession();
  if (!session) {
    return NextResponse.json({ company: null }, { status: 401 });
  }

  const record = await prisma.company.findUnique({
    where: { id: session.companyId },
    select: { logoUrl: true },
  });

  return NextResponse.json({
    company: {
      ...session,
      logoUrl: record?.logoUrl ?? null,
    },
  });
}
