import { NextResponse } from "next/server";

import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      labName?: string;
      location?: string;
      contactEmail?: string;
      phone?: string;
      logoUrl?: string | null;
    };

    const labName = body.labName?.trim() ?? "";
    const location = body.location?.trim() ?? "";
    const contactEmail = body.contactEmail?.trim().toLowerCase() ?? "";
    const phone = body.phone?.trim() ?? "";
    const logoUrl =
      typeof body.logoUrl === "string" && body.logoUrl.trim()
        ? body.logoUrl.trim()
        : null;

    if (!labName || !location || !contactEmail) {
      return NextResponse.json(
        { error: "Lab name, location, and contact email are required." },
        { status: 400 },
      );
    }

    if (!EMAIL_PATTERN.test(contactEmail)) {
      return NextResponse.json(
        { error: "Enter a valid contact email address." },
        { status: 400 },
      );
    }

    const application = await prisma.demoApplication.create({
      data: {
        labName,
        location,
        contactEmail,
        phone,
        logoUrl,
        status: "Pending",
      },
      select: {
        id: true,
        labName: true,
        contactEmail: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    const { status, message } = prismaErrorResponse(
      error,
      "Could not submit demo application.",
    );
    return NextResponse.json({ error: message }, { status });
  }
}
