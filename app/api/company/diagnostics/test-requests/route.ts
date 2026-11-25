import { NextResponse } from "next/server";
import type { TestRequestPriority, TestRequestStatus } from "@prisma/client";

import { getCompanySession } from "@/lib/company-auth";
import { isUniqueConstraintError, prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

const PRIORITIES = new Set(["Routine", "Urgent", "STAT"]);

function parseDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

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

type RequestWithRelations = {
  id: string;
  requestCode: string;
  barcodeToken: string;
  patientId: string;
  doctorId: string | null;
  priority: TestRequestPriority;
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
};

function mapRequest(request: RequestWithRelations) {
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

export async function GET() {
  const session = await getCompanySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const requests = await prisma.testRequest.findMany({
      where: { companyId: session.companyId },
      include: requestInclude,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(requests.map(mapRequest));
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to load test requests.");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  const session = await getCompanySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      requestCode?: string;
      patientId?: string;
      doctorId?: string;
      priority?: string;
      sampleType?: string;
      clinicalNotes?: string;
      requestedAt?: string;
      testIds?: string[];
    };

    const requestCode = body.requestCode?.trim().toUpperCase() || "";
    const patientId = body.patientId?.trim() ?? "";
    const doctorId = body.doctorId?.trim() || null;
    const priority = (body.priority?.trim() || "Routine") as TestRequestPriority;
    const sampleType = body.sampleType?.trim() ?? "";
    const clinicalNotes = body.clinicalNotes?.trim() ?? "";
    const requestedAt = parseDate(body.requestedAt);
    const testIds = Array.from(
      new Set((body.testIds ?? []).map((id) => id?.trim()).filter(Boolean) as string[]),
    );

    if (!requestCode) {
      return NextResponse.json({ error: "Request ID is required." }, { status: 400 });
    }
    if (!patientId) {
      return NextResponse.json({ error: "Select a patient." }, { status: 400 });
    }
    if (!sampleType) {
      return NextResponse.json({ error: "Select a sample type." }, { status: 400 });
    }
    if (!requestedAt) {
      return NextResponse.json({ error: "Request date is required." }, { status: 400 });
    }
    if (!PRIORITIES.has(priority)) {
      return NextResponse.json(
        { error: "Priority must be Routine, Urgent, or STAT." },
        { status: 400 },
      );
    }
    if (testIds.length === 0) {
      return NextResponse.json({ error: "Add at least one test." }, { status: 400 });
    }

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, companyId: session.companyId },
      select: { id: true },
    });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found." }, { status: 400 });
    }

    if (doctorId) {
      const doctor = await prisma.doctor.findFirst({
        where: { id: doctorId, companyId: session.companyId },
        select: { id: true },
      });
      if (!doctor) {
        return NextResponse.json({ error: "Referring doctor not found." }, { status: 400 });
      }
    }

    const knownTests = await prisma.test.findMany({
      where: { companyId: session.companyId, id: { in: testIds } },
      select: { id: true, amount: true },
    });
    if (knownTests.length !== testIds.length) {
      return NextResponse.json(
        { error: "One of the selected tests was not found." },
        { status: 400 },
      );
    }

    const amountById = new Map(knownTests.map((test) => [test.id, test.amount]));
    const totalAmount = testIds.reduce((sum, id) => sum + (amountById.get(id) ?? 0), 0);

    const created = await prisma.testRequest.create({
      data: {
        companyId: session.companyId,
        requestCode,
        patientId,
        doctorId,
        priority,
        sampleType,
        clinicalNotes,
        requestedAt,
        totalAmount,
        items: {
          create: testIds.map((testId, index) => ({
            testId,
            amount: amountById.get(testId) ?? 0,
            sortOrder: index,
          })),
        },
      },
      include: requestInclude,
    });

    const company = await prisma.company.findUnique({
      where: { id: session.companyId },
      select: {
        name: true,
        logoUrl: true,
        location: true,
        phone: true,
        contactEmail: true,
      },
    });

    return NextResponse.json(
      {
        ...mapRequest(created),
        company: {
          name: company?.name ?? session.name,
          logoUrl: company?.logoUrl ?? null,
          location: company?.location ?? "",
          phone: company?.phone ?? "",
          contactEmail: company?.contactEmail ?? "",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (isUniqueConstraintError(error, "requestCode")) {
      return NextResponse.json({ error: "That request ID is already in use." }, { status: 409 });
    }
    const { status, message } = prismaErrorResponse(error, "Failed to create test request.");
    return NextResponse.json({ error: message }, { status });
  }
}
