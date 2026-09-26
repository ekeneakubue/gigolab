import { NextResponse } from "next/server";

import { getCompanySession } from "@/lib/company-auth";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

async function findOwnedDoctor(id: string, companyId: string) {
  return prisma.doctor.findFirst({
    where: { id, companyId },
    select: { id: true },
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getCompanySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const existing = await findOwnedDoctor(id, session.companyId);
    if (!existing) {
      return NextResponse.json({ error: "Doctor not found." }, { status: 404 });
    }

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

    const updated = await prisma.doctor.update({
      where: { id },
      data: {
        name,
        email,
        mobile,
        clinicAddress,
        qualification,
        specialization,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to update doctor.");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getCompanySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const existing = await findOwnedDoctor(id, session.companyId);
    if (!existing) {
      return NextResponse.json({ error: "Doctor not found." }, { status: 404 });
    }

    await prisma.doctor.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to delete doctor.");
    return NextResponse.json({ error: message }, { status });
  }
}
