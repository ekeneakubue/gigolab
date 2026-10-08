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

async function findOwnedRegistration(id: string, companyId: string) {
  return prisma.sampleRegistration.findFirst({
    where: { id, companyId },
    select: { id: true },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getCompanySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await findOwnedRegistration(id, session.companyId);
    if (!existing) {
      return NextResponse.json({ error: "Registration not found." }, { status: 404 });
    }

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

    const updated = await prisma.sampleRegistration.update({
      where: { id },
      data: {
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
          deleteMany: {},
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

    return NextResponse.json(updated);
  } catch (error) {
    if (isUniqueConstraintError(error, "sampleCode")) {
      return NextResponse.json({ error: "That sample ID is already registered." }, { status: 409 });
    }
    const { status, message } = prismaErrorResponse(error, "Failed to update registration.");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getCompanySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await findOwnedRegistration(id, session.companyId);
    if (!existing) {
      return NextResponse.json({ error: "Registration not found." }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.sampleRegistration.delete({ where: { id } });
      await tx.company.updateMany({
        where: { id: session.companyId, sampleCount: { gt: 0 } },
        data: { sampleCount: { decrement: 1 } },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to delete registration.");
    return NextResponse.json({ error: message }, { status });
  }
}
