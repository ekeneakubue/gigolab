import { NextResponse } from "next/server";
import type { TestRequestStatus } from "@prisma/client";

import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

function statusLabel(status: TestRequestStatus) {
  if (status === "InProgress") return "In progress";
  return status;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const barcodeToken = token?.trim() ?? "";

  if (!barcodeToken) {
    return NextResponse.json({ error: "Missing result token." }, { status: 400 });
  }

  try {
    const record = await prisma.testRequest.findUnique({
      where: { barcodeToken },
      include: {
        company: {
          select: { name: true, logoUrl: true, location: true, phone: true },
        },
        patient: {
          select: { name: true, patientCode: true, gender: true },
        },
        doctor: { select: { name: true } },
        items: {
          orderBy: { sortOrder: "asc" },
          include: {
            test: { select: { name: true, printAs: true } },
          },
        },
      },
    });

    if (!record) {
      return NextResponse.json({ error: "No request found for this code." }, { status: 404 });
    }

    return NextResponse.json({
      requestCode: record.requestCode,
      barcodeToken: record.barcodeToken,
      status: statusLabel(record.status),
      priority: record.priority,
      sampleType: record.sampleType,
      requestedAt: record.requestedAt,
      patient: {
        name: record.patient.name,
        patientCode: record.patient.patientCode,
        gender: record.patient.gender,
      },
      doctorName: record.doctor?.name ?? null,
      company: record.company,
      resultsReady: record.status === "Completed" && record.resultsReleased,
      resultsReleased: record.resultsReleased,
      verifiedAt: record.verifiedAt,
      items: record.items.map((item) => ({
        name: item.test.printAs || item.test.name,
        result:
          record.status === "Completed" && record.resultsReleased ? item.result : "",
        normalRange:
          record.status === "Completed" && record.resultsReleased ? item.normalRange : "",
        pending: !(record.status === "Completed" && record.resultsReleased),
      })),
    });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to load results.");
    return NextResponse.json({ error: message }, { status });
  }
}
