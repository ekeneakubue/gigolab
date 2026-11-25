import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const applications = await prisma.demoApplication.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ applications });
  } catch (error) {
    const { status, message } = prismaErrorResponse(
      error,
      "Failed to load demo applications.",
    );
    return NextResponse.json({ error: message }, { status });
  }
}
