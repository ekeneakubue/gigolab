import { NextResponse } from "next/server";

import {
  createPatientSessionToken,
  patientSessionCookieOptions,
} from "@/lib/patient-auth";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PATIENT_DASHBOARD = "/patients";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      patientCode?: string;
      password?: string;
    };

    const email = body.email?.trim().toLowerCase() ?? "";
    const patientCode = (body.patientCode ?? body.password ?? "").trim();

    if (!email || !patientCode) {
      return NextResponse.json(
        { error: "Email and patient code are required." },
        { status: 400 },
      );
    }

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const matches = await prisma.patient.findMany({
      where: {
        status: "Active",
        email: { equals: email, mode: "insensitive" },
        patientCode: { equals: patientCode, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        email: true,
        patientCode: true,
        companyId: true,
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            status: true,
          },
        },
      },
      take: 5,
    });

    if (matches.length === 0) {
      return NextResponse.json(
        { error: "Invalid email or patient code." },
        { status: 401 },
      );
    }

    if (matches.length > 1) {
      return NextResponse.json(
        {
          error:
            "Multiple patient records match these credentials. Contact your lab for help.",
        },
        { status: 409 },
      );
    }

    const patient = matches[0];
    if (patient.company.status !== "Active") {
      return NextResponse.json(
        { error: "This lab account is not active." },
        { status: 403 },
      );
    }

    const token = await createPatientSessionToken({
      patientId: patient.id,
      companyId: patient.companyId,
      companyName: patient.company.name,
      companyLogoUrl: patient.company.logoUrl,
      name: patient.name,
      email: patient.email,
      patientCode: patient.patientCode,
    });

    const response = NextResponse.json({
      redirectTo: PATIENT_DASHBOARD,
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        patientCode: patient.patientCode,
        companyName: patient.company.name,
      },
    });
    response.cookies.set(patientSessionCookieOptions(token));
    return response;
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Could not sign in.");
    return NextResponse.json({ error: message }, { status });
  }
}
