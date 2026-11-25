import { NextResponse } from "next/server";
import type { AccountStatus } from "@prisma/client";

import { getCompanySession } from "@/lib/company-auth";
import {
  generatePatientCode,
  isValidPatientCode,
} from "@/lib/patient-code";
import { isUniqueConstraintError, prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

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

export async function GET() {
  const session = await getCompanySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const patients = await prisma.patient.findMany({
      where: { companyId: session.companyId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      companyName: session.name,
      patients: patients.map(mapPatient),
    });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to load patients.");
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
      patientCode?: string;
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

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const phone = body.phone?.trim() ?? "";
    const gender = body.gender?.trim() ?? "";
    const address = body.address?.trim() ?? "";
    const hasInsurance = Boolean(body.hasInsurance);
    const insuranceProvider = hasInsurance ? body.insuranceProvider?.trim() ?? "" : "";
    const insuranceNumber = hasInsurance ? body.insuranceNumber?.trim() ?? "" : "";
    const insurancePlan = hasInsurance ? body.insurancePlan?.trim() ?? "" : "";
    const status = body.status ?? "Active";
    const dateOfBirthRaw = body.dateOfBirth?.trim() || null;
    const dateOfBirth = dateOfBirthRaw ? new Date(dateOfBirthRaw) : null;

    if (!name) {
      return NextResponse.json({ error: "Patient name is required." }, { status: 400 });
    }
    if (dateOfBirthRaw && Number.isNaN(dateOfBirth?.getTime())) {
      return NextResponse.json({ error: "Enter a valid date of birth." }, { status: 400 });
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

    const requestedCode = body.patientCode?.trim().toUpperCase() ?? "";
    let patientCode = isValidPatientCode(session.name, requestedCode)
      ? requestedCode
      : generatePatientCode(session.name);

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const created = await prisma.patient.create({
          data: {
            companyId: session.companyId,
            patientCode,
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
        return NextResponse.json(mapPatient(created), { status: 201 });
      } catch (error) {
        if (!isUniqueConstraintError(error) || attempt === 4) throw error;
        patientCode = generatePatientCode(session.name);
      }
    }

    return NextResponse.json({ error: "Failed to create patient." }, { status: 500 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "A patient with this code already exists." },
        { status: 409 },
      );
    }
    const { status, message } = prismaErrorResponse(error, "Failed to create patient.");
    return NextResponse.json({ error: message }, { status });
  }
}
