import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

const STATUSES = ["Pending", "Contacted", "Approved", "Rejected"] as const;
type DemoStatus = (typeof STATUSES)[number];

function isDemoStatus(value: unknown): value is DemoStatus {
  return typeof value === "string" && STATUSES.includes(value as DemoStatus);
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      status?: string;
      notes?: string;
    };

    if (body.status !== undefined && !isDemoStatus(body.status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const notes =
      body.notes !== undefined
        ? body.notes.trim()
        : undefined;

    const application = await prisma.demoApplication.update({
      where: { id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
    });

    return NextResponse.json({ application });
  } catch (error) {
    const { status, message } = prismaErrorResponse(
      error,
      "Failed to update demo application.",
    );
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await prisma.demoApplication.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, message } = prismaErrorResponse(
      error,
      "Failed to delete demo application.",
    );
    return NextResponse.json({ error: message }, { status });
  }
}
