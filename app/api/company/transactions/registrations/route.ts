import { NextResponse } from "next/server";

import { getCompanySession } from "@/lib/company-auth";
import { isUniqueConstraintError, prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

function parseDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

const registrationInclude = {
  doctor: { select: { id: true, name: true } },
  tests: {
    orderBy: { sortOrder: "asc" as const },
    include: { test: { select: { id: true, name: true } } },
  },
} as const;

export async function GET() {
  const session = await getCompanySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const registrations = await prisma.sampleRegistration.findMany({
      where: { companyId: session.companyId },
      include: registrationInclude,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(registrations);
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to load registrations.");
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
      sampleCode?: string;
      sampleName?: string;
      category?: string;
      age?: string;
      doctorId?: string;
      patientId?: string;
      sampleType?: string;
      collectionDate?: string;
      registeredAt?: string;
      tests?: { testId?: string; result?: string; normalRange?: string }[];
    };

    const sampleCode = body.sampleCode?.trim() ?? "";
    const sampleName = body.sampleName?.trim() ?? "";
    const category = body.category?.trim() ?? "";
    const age = body.age?.trim() ?? "";
    const doctorId = body.doctorId?.trim() ?? "";
    const patientId = body.patientId?.trim() ?? "";
    const sampleType = body.sampleType?.trim() ?? "";
    const collectionDate = parseDate(body.collectionDate);
    const registeredAt = parseDate(body.registeredAt);
    const tests = (body.tests ?? []).map((test) => ({
      testId: test.testId?.trim() ?? "",
      result: test.result?.trim() ?? "",
      normalRange: test.normalRange?.trim() ?? "",
    }));

    if (!sampleCode || !sampleName || !category || !age || !patientId || !sampleType) {
      return NextResponse.json({ error: "Fill in every sample detail." }, { status: 400 });
    }
    if (!doctorId) {
      return NextResponse.json({ error: "Select a referring doctor." }, { status: 400 });
    }
    if (!collectionDate || !registeredAt) {
      return NextResponse.json({ error: "Collection date and registration date are required." }, { status: 400 });
    }
    if (tests.length === 0 || tests.some((test) => !test.testId)) {
      return NextResponse.json({ error: "Select a test for every row." }, { status: 400 });
    }

    const doctor = await prisma.doctor.findFirst({
      where: { id: doctorId, companyId: session.companyId },
      select: { id: true },
    });
    if (!doctor) {
      return NextResponse.json({ error: "Referring doctor not found." }, { status: 400 });
    }

    const knownTests = await prisma.test.findMany({
      where: { companyId: session.companyId, id: { in: tests.map((test) => test.testId) } },
      select: { id: true },
    });
    if (knownTests.length !== new Set(tests.map((test) => test.testId)).size) {
      return NextResponse.json({ error: "One of the selected tests was not found." }, { status: 400 });
    }

    const created = await prisma.$transaction(async (tx) => {
      const registration = await tx.sampleRegistration.create({
        data: {
          companyId: session.companyId,
          sampleCode,
          sampleName,
          category,
          age,
          doctorId,
          patientId,
          sampleType,
          collectionDate,
          registeredAt,
          tests: {
            create: tests.map((test, index) => ({
              testId: test.testId,
              result: test.result,
              normalRange: test.normalRange,
              sortOrder: index,
            })),
          },
        },
        include: registrationInclude,
      });

      await tx.company.update({
        where: { id: session.companyId },
        data: { sampleCount: { increment: 1 } },
      });

      return registration;
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error, "sampleCode")) {
      return NextResponse.json({ error: "That sample ID is already registered." }, { status: 409 });
    }
    const { status, message } = prismaErrorResponse(error, "Failed to save registration.");
    return NextResponse.json({ error: message }, { status });
  }
}
