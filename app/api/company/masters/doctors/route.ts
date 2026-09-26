import { NextResponse } from "next/server";

import { getCompanySession } from "@/lib/company-auth";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getCompanySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const doctors = await prisma.doctor.findMany({
      where: { companyId: session.companyId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(doctors);
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to load doctors.");
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
      name?: string;
      email?: string;
      mobile?: string;
      clinicAddress?: string;
      qualification?: string;
      specialization?: string;
    };

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const mobile = body.mobile?.trim() ?? "";
    const clinicAddress = body.clinicAddress?.trim() ?? "";
    const qualification = body.qualification?.trim() ?? "";
    const specialization = body.specialization?.trim() ?? "";

    if (!name) {
      return NextResponse.json({ error: "Doctor's name is required." }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }
    if (!mobile) {
      return NextResponse.json({ error: "Mobile number is required." }, { status: 400 });
    }
    if (!clinicAddress) {
      return NextResponse.json({ error: "Clinic address is required." }, { status: 400 });
    }
    if (!qualification) {
      return NextResponse.json({ error: "Qualification is required." }, { status: 400 });
    }
    if (!specialization) {
      return NextResponse.json({ error: "Specialization is required." }, { status: 400 });
    }

    const created = await prisma.doctor.create({
      data: {
        companyId: session.companyId,
        name,
        email,
        mobile,
        clinicAddress,
        qualification,
        specialization,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to create doctor.");
    return NextResponse.json({ error: message }, { status });
  }
}
