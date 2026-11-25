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
    const requests = await prisma.testRequest.findMany({
      where: {
        patientId: session.patientId,
        companyId: session.companyId,
        status: "Completed",
        resultsReleased: true,
      },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          include: {
            test: { select: { id: true, name: true, printAs: true } },
          },
        },
        doctor: { select: { name: true } },
      },
      orderBy: { requestedAt: "desc" },
    });

    return NextResponse.json({
      results: requests.map((request) => ({
        id: request.id,
        requestCode: request.requestCode,
        barcodeToken: request.barcodeToken,
        sampleType: request.sampleType,
        priority: request.priority,
        requestedAt: request.requestedAt,
        verifiedAt: request.verifiedAt,
        doctorName: request.doctor?.name ?? null,
        tests: request.items.map((item) => item.test.printAs || item.test.name).join(", "),
        items: request.items.map((item) => ({
          id: item.id,
          name: item.test.printAs || item.test.name,
          result: item.result,
          normalRange: item.normalRange,
        })),
      })),
    });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to load results.");
    return NextResponse.json({ error: message }, { status });
  }
}
