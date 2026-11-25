import { NextResponse } from "next/server";
import type { AccountStatus } from "@prisma/client";

import { getCompanySession } from "@/lib/company-auth";
import { isUniqueConstraintError, prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

function mapPatient(patient: {
  id: string;
  patientCode: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: Date | null;
  address: string;
  hasInsurance: boolean;
  insuranceProvider: string;
  insuranceNumber: string;
  insurancePlan: string;
  status: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: patient.id,
    patientCode: patient.patientCode,
    name: patient.name,
    email: patient.email,
    phone: patient.phone,
    gender: patient.gender,
    dateOfBirth: patient.dateOfBirth,
    address: patient.address,
    hasInsurance: patient.hasInsurance,
    insuranceProvider: patient.insuranceProvider,
    insuranceNumber: patient.insuranceNumber,
    insurancePlan: patient.insurancePlan,
    status: patient.status,
    createdAt: patient.createdAt,
    updatedAt: patient.updatedAt,
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getCompanySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const existing = await prisma.patient.findFirst({
      where: { id, companyId: session.companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Patient not found." }, { status: 404 });
    }

    const body = (await request.json()) as {
      name?: string;
      email?: string;
      phone?: string;
      gender?: string;
      dateOfBirth?: string | null;
      address?: string;
      hasInsurance?: boolean;
      insuranceProvider?: string;
      insuranceNumber?: string;
      insurancePlan?: string;
      status?: AccountStatus;
    };

    const name = body.name?.trim() ?? existing.name;
    const email =
      body.email !== undefined ? body.email.trim().toLowerCase() : existing.email;
    const phone = body.phone !== undefined ? body.phone.trim() : existing.phone;
    const gender = body.gender !== undefined ? body.gender.trim() : existing.gender;
    const address = body.address !== undefined ? body.address.trim() : existing.address;
    const hasInsurance =
      body.hasInsurance !== undefined ? Boolean(body.hasInsurance) : existing.hasInsurance;
    const insuranceProvider = hasInsurance
      ? body.insuranceProvider !== undefined
        ? body.insuranceProvider.trim()
        : existing.insuranceProvider
      : "";
    const insuranceNumber = hasInsurance
      ? body.insuranceNumber !== undefined
        ? body.insuranceNumber.trim()
        : existing.insuranceNumber
      : "";
    const insurancePlan = hasInsurance
      ? body.insurancePlan !== undefined
        ? body.insurancePlan.trim()
        : existing.insurancePlan
      : "";
    const status = body.status ?? existing.status;

    let dateOfBirth = existing.dateOfBirth;
    if (body.dateOfBirth !== undefined) {
      const raw = body.dateOfBirth?.trim() || null;
      if (!raw) {
        dateOfBirth = null;
      } else {
        const parsed = new Date(raw);
        if (Number.isNaN(parsed.getTime())) {
          return NextResponse.json({ error: "Enter a valid date of birth." }, { status: 400 });
        }
        dateOfBirth = parsed;
      }
    }

    if (!name) {
      return NextResponse.json({ error: "Patient name is required." }, { status: 400 });
    }
    if (hasInsurance && !insuranceProvider) {
      return NextResponse.json(
        { error: "Insurance provider is required when insurance is enabled." },
        { status: 400 },
      );
    }
    if (hasInsurance && !insuranceNumber) {
      return NextResponse.json(
        { error: "Insurance / membership number is required when insurance is enabled." },
        { status: 400 },
      );
    }

    const updated = await prisma.patient.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        gender,
        dateOfBirth,
        address,
        hasInsurance,
        insuranceProvider,
        insuranceNumber,
        insurancePlan,
        status,
      },
    });

    return NextResponse.json(mapPatient(updated));
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "A patient with this code already exists." },
        { status: 409 },
      );
    }
    const { status, message } = prismaErrorResponse(error, "Failed to update patient.");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getCompanySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const existing = await prisma.patient.findFirst({
      where: { id, companyId: session.companyId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Patient not found." }, { status: 404 });
    }

    await prisma.patient.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to delete patient.");
    return NextResponse.json({ error: message }, { status });
  }
}
