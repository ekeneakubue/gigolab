import { NextResponse } from "next/server";

import { getPatientSession } from "@/lib/patient-auth";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

function parseScheduledAt(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET() {
  const session = await getPatientSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: session.patientId,
        companyId: session.companyId,
      },
      orderBy: { scheduledAt: "asc" },
    });
    return NextResponse.json({ appointments });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to load appointments.");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  const session = await getPatientSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      scheduledAt?: string;
      reason?: string;
      notes?: string;
    };

    const scheduledAt = parseScheduledAt(body.scheduledAt);
    const reason = body.reason?.trim() ?? "";
    const notes = body.notes?.trim() ?? "";

    if (!scheduledAt) {
      return NextResponse.json(
        { error: "Choose a valid appointment date and time." },
        { status: 400 },
      );
    }
    if (scheduledAt.getTime() < Date.now() - 60_000) {
      return NextResponse.json(
        { error: "Appointment time must be in the future." },
        { status: 400 },
      );
    }
    if (!reason) {
      return NextResponse.json({ error: "Reason is required." }, { status: 400 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        companyId: session.companyId,
        patientId: session.patientId,
        scheduledAt,
        reason,
        notes,
        status: "Pending",
      },
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to book appointment.");
    return NextResponse.json({ error: message }, { status });
  }
}
