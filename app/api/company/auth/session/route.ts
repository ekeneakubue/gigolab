import { NextResponse } from "next/server";

import { getCompanySession } from "@/lib/company-auth";
import { prisma } from "@/lib/prisma";
import { toRoleLabel } from "@/lib/user-role";

export async function GET() {
  const session = await getCompanySession();
  if (!session) {
    return NextResponse.json({ company: null }, { status: 401 });
  }

  const record = await prisma.company.findUnique({
    where: { id: session.companyId },
    select: { logoUrl: true, status: true, brandColor: true },
  });

  let userName = session.userName ?? null;
  let userInitials = session.userInitials ?? null;
  let role = session.role ?? null;
  let userImageUrl: string | null = null;

  let dashboardRoute = session.dashboardRoute ?? null;
  let companyRoleId = session.companyRoleId ?? null;

  if (session.userId) {
    const user = await prisma.user.findFirst({
      where: { id: session.userId, companyId: session.companyId },
      select: {
        name: true,
        initials: true,
        imageUrl: true,
        role: true,
        companyRoleId: true,
        companyRole: { select: { id: true, name: true, dashboardRoute: true } },
      },
    });
    if (user) {
      userName = user.name;
      userInitials = user.initials;
      userImageUrl = user.imageUrl ?? null;
      role = user.companyRole?.name ?? toRoleLabel(user.role);
      companyRoleId = user.companyRole?.id ?? user.companyRoleId ?? null;
      dashboardRoute = user.companyRole?.dashboardRoute ?? null;
    }
  }

  return NextResponse.json({
    company: {
      ...session,
      logoUrl: record?.logoUrl ?? null,
      brandColor: record?.brandColor ?? null,
      status: record?.status ?? "Active",
      userName,
      userInitials,
      userImageUrl,
      role,
      companyRoleId,
      dashboardRoute,
    },
  });
}
