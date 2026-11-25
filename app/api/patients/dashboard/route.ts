import { NextResponse } from "next/server";

import { getPatientSession } from "@/lib/patient-auth";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getPatientSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const now = new Date();
    const [releasedResults, upcomingAppointments, pendingAppointments] = await Promise.all([
      prisma.testRequest.count({
        where: {
          patientId: session.patientId,
          companyId: session.companyId,
          status: "Completed",
          resultsReleased: true,
        },
      }),
      prisma.appointment.count({
        where: {
          patientId: session.patientId,
          companyId: session.companyId,
          scheduledAt: { gte: now },
          status: { in: ["Pending", "Confirmed"] },
        },
      }),
      prisma.appointment.count({
        where: {
          patientId: session.patientId,
          companyId: session.companyId,
          status: "Pending",
        },
      }),
    ]);

    const latestResults = await prisma.testRequest.findMany({
      where: {
        patientId: session.patientId,
        companyId: session.companyId,
        status: "Completed",
        resultsReleased: true,
      },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          take: 3,
          include: { test: { select: { name: true, printAs: true } } },
        },
      },
      orderBy: { requestedAt: "desc" },
      take: 3,
    });

    const nextAppointments = await prisma.appointment.findMany({
      where: {
        patientId: session.patientId,
        companyId: session.companyId,
        scheduledAt: { gte: now },
        status: { in: ["Pending", "Confirmed"] },
      },
      orderBy: { scheduledAt: "asc" },
      take: 3,
    });

    return NextResponse.json({
      summary: {
        releasedResults,
        upcomingAppointments,
        pendingAppointments,
      },
      latestResults: latestResults.map((request) => ({
        id: request.id,
        requestCode: request.requestCode,
        requestedAt: request.requestedAt,
        sampleType: request.sampleType,
        tests: request.items
          .map((item) => item.test.printAs || item.test.name)
          .join(", "),
      })),
      nextAppointments,
    });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to load dashboard.");
    return NextResponse.json({ error: message }, { status });
  }
}
