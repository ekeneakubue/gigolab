import { NextResponse } from "next/server";
import type { TestRequestStatus } from "@prisma/client";

import { getCompanySession } from "@/lib/company-auth";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

function statusLabel(status: TestRequestStatus) {
  if (status === "InProgress") return "In progress";
  return status;
}

const requestInclude = {
  patient: {
    select: { id: true, name: true, patientCode: true, phone: true, gender: true },
  },
  doctor: { select: { id: true, name: true, specialization: true } },
  items: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      test: { select: { id: true, name: true, printAs: true, amount: true } },
    },
  },
} as const;

function mapRequest(request: {
  id: string;
  requestCode: string;
  barcodeToken: string;
  patientId: string;
  doctorId: string | null;
  priority: string;
  sampleType: string;
  clinicalNotes: string;
  status: TestRequestStatus;
  requestedAt: Date;
  totalAmount: number;
  paymentStatus: "Unpaid" | "Partial" | "Paid";
  paymentMethod: string;
  amountPaid: number;
  paymentRef: string;
  paidAt: Date | null;
  resultsReleased: boolean;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  patient: {
    id: string;
    name: string;
    patientCode: string;
    phone: string;
    gender: string;
  };
  doctor: { id: string; name: string; specialization: string } | null;
  items: {
    id: string;
    amount: number;
    result: string;
    normalRange: string;
    sortOrder: number;
    test: { id: string; name: string; printAs: string; amount: number };
  }[];
}) {
  return {
    id: request.id,
    requestCode: request.requestCode,
    barcodeToken: request.barcodeToken,
    patientId: request.patientId,
    patientName: `${request.patient.name} (${request.patient.patientCode})`,
    patient: request.patient,
    doctorId: request.doctorId,
    doctor: request.doctor,
    priority: request.priority,
    sampleType: request.sampleType,
    clinicalNotes: request.clinicalNotes,
    status: statusLabel(request.status),
    statusRaw: request.status,
    requestedAt: request.requestedAt,
    totalAmount: request.totalAmount,
    paymentStatus: request.paymentStatus,
    paymentMethod: request.paymentMethod,
    amountPaid: request.amountPaid,
    paymentRef: request.paymentRef,
    paidAt: request.paidAt,
    resultsReleased: request.resultsReleased,
    verifiedAt: request.verifiedAt,
    tests: request.items.map((item) => item.test.name).join(", "),
    items: request.items,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getCompanySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const record = await prisma.testRequest.findFirst({
      where: { id, companyId: session.companyId },
      include: requestInclude,
    });
    if (!record) {
      return NextResponse.json({ error: "Test request not found." }, { status: 404 });
    }
    return NextResponse.json(mapRequest(record));
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to load test request.");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getCompanySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const existing = await prisma.testRequest.findFirst({
      where: { id, companyId: session.companyId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Test request not found." }, { status: 404 });
    }

    const body = (await request.json()) as {
      status?: string;
      items?: { id?: string; result?: string; normalRange?: string }[];
      paymentMethod?: string;
      amountPaid?: number;
      paymentRef?: string;
      paymentOnly?: boolean;
      releaseOnly?: boolean;
      resultsReleased?: boolean;
    };

    if (body.releaseOnly) {
      const record = await prisma.testRequest.findFirst({
        where: { id, companyId: session.companyId },
        include: {
          items: { select: { id: true, result: true } },
        },
      });
      if (!record) {
        return NextResponse.json({ error: "Test request not found." }, { status: 404 });
      }
      if (record.status !== "Completed") {
        return NextResponse.json(
          { error: "Only completed requests can be released." },
          { status: 400 },
        );
      }
      if (record.items.length === 0 || record.items.some((item) => !item.result.trim())) {
        return NextResponse.json(
          { error: "All test results must be filled before release." },
          { status: 400 },
        );
      }

      const shouldRelease = body.resultsReleased !== false;
      const released = await prisma.testRequest.update({
        where: { id },
        data: {
          resultsReleased: shouldRelease,
          verifiedAt: shouldRelease ? new Date() : null,
        },
        include: requestInclude,
      });
      return NextResponse.json(mapRequest(released));
    }

    if (body.paymentOnly) {
      const paymentMethod = body.paymentMethod?.trim() ?? "";
      const paymentRef = body.paymentRef?.trim() ?? "";
      const amountPaid = Number(body.amountPaid);
      const record = await prisma.testRequest.findFirst({
        where: { id, companyId: session.companyId },
        select: { totalAmount: true },
      });
      if (!record) {
        return NextResponse.json({ error: "Test request not found." }, { status: 404 });
      }
      if (!paymentMethod) {
        return NextResponse.json({ error: "Select a payment method." }, { status: 400 });
      }
      if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
        return NextResponse.json({ error: "Enter a valid amount paid." }, { status: 400 });
      }
      if (amountPaid > record.totalAmount + 0.0001) {
        return NextResponse.json(
          { error: "Amount paid cannot exceed the request total." },
          { status: 400 },
        );
      }

      const paymentStatus =
        amountPaid + 0.0001 >= record.totalAmount
          ? "Paid"
          : amountPaid > 0
            ? "Partial"
            : "Unpaid";

      const paid = await prisma.testRequest.update({
        where: { id },
        data: {
          paymentMethod,
          paymentRef,
          amountPaid,
          paymentStatus,
          paidAt: new Date(),
        },
        include: requestInclude,
      });
      return NextResponse.json(mapRequest(paid));
    }

    const items = (body.items ?? []).map((item) => ({
      id: item.id?.trim() ?? "",
      result: item.result?.trim() ?? "",
      normalRange: item.normalRange?.trim() ?? "",
    }));

    if (items.length === 0 || items.some((item) => !item.id)) {
      return NextResponse.json({ error: "Provide result rows for every test." }, { status: 400 });
    }

    const ownedItems = await prisma.testRequestItem.findMany({
      where: { requestId: id, id: { in: items.map((item) => item.id) } },
      select: { id: true },
    });
    if (ownedItems.length !== items.length) {
      return NextResponse.json(
        { error: "One of the test rows does not belong to this request." },
        { status: 400 },
      );
    }

    const statusInput = body.status?.trim();
    let nextStatus: TestRequestStatus | undefined;
    if (statusInput === "Pending") nextStatus = "Pending";
    else if (statusInput === "In progress" || statusInput === "InProgress") nextStatus = "InProgress";
    else if (statusInput === "Completed") nextStatus = "Completed";
    else if (statusInput) {
      return NextResponse.json(
        { error: "Status must be Pending, In progress, or Completed." },
        { status: 400 },
      );
    }

    if (nextStatus === "Completed") {
      const incomplete = items.some((item) => !item.result);
      if (incomplete) {
        return NextResponse.json(
          { error: "Enter a result for every test before marking completed." },
          { status: 400 },
        );
      }
    }

    if (!nextStatus) {
      const allFilled = items.every((item) => item.result);
      const anyFilled = items.some((item) => item.result || item.normalRange);
      if (allFilled) nextStatus = "Completed";
      else if (anyFilled) nextStatus = "InProgress";
    }

    const updated = await prisma.$transaction(async (tx) => {
      await Promise.all(
        items.map((item) =>
          tx.testRequestItem.update({
            where: { id: item.id },
            data: {
              result: item.result,
              normalRange: item.normalRange,
            },
          }),
        ),
      );

      return tx.testRequest.update({
        where: { id },
        data: nextStatus ? { status: nextStatus } : {},
        include: requestInclude,
      });
    });

    return NextResponse.json(mapRequest(updated));
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to save test results.");
    return NextResponse.json({ error: message }, { status });
  }
}
