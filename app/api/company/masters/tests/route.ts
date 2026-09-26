import { NextResponse } from "next/server";

import { getCompanySession } from "@/lib/company-auth";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

const DONE_FOR_VALUES = new Set(["Male", "Female", "Both"]);

export async function GET() {
  const session = await getCompanySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const tests = await prisma.test.findMany({
      where: { companyId: session.companyId },
      include: {
        department: { select: { id: true, name: true } },
        subDepartment: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(tests);
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to load tests.");
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
      printAs?: string;
      departmentId?: string;
      subDepartmentId?: string | null;
      amount?: number;
      testMrp?: number;
      doneFor?: string;
    };

    const name = body.name?.trim() ?? "";
    const printAs = body.printAs?.trim() ?? "";
    const departmentId = body.departmentId?.trim() ?? "";
    const subDepartmentId = body.subDepartmentId?.trim() || null;
    const amount = Number(body.amount);
    const testMrp = Number(body.testMrp);
    const doneFor = body.doneFor?.trim() ?? "";

    if (!name) {
      return NextResponse.json({ error: "Test name is required." }, { status: 400 });
    }
    if (!printAs) {
      return NextResponse.json({ error: "Print As is required." }, { status: 400 });
    }
    if (!departmentId) {
      return NextResponse.json({ error: "Department is required." }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount < 0) {
      return NextResponse.json({ error: "Amount must be a non-negative number." }, { status: 400 });
    }
    if (!Number.isFinite(testMrp) || testMrp < 0) {
      return NextResponse.json({ error: "Test MRP must be a non-negative number." }, { status: 400 });
    }
    if (!DONE_FOR_VALUES.has(doneFor)) {
      return NextResponse.json({ error: "Done For must be Male, Female, or Both." }, { status: 400 });
    }

    const department = await prisma.department.findFirst({
      where: { id: departmentId, companyId: session.companyId },
      select: { id: true },
    });
    if (!department) {
      return NextResponse.json({ error: "Department not found." }, { status: 400 });
    }

    if (subDepartmentId) {
      const sub = await prisma.subDepartment.findFirst({
        where: { id: subDepartmentId, departmentId },
        select: { id: true },
      });
      if (!sub) {
        return NextResponse.json(
          { error: "Sub department does not belong to the selected department." },
          { status: 400 }
        );
      }
    }

    const created = await prisma.test.create({
      data: {
        companyId: session.companyId,
        name,
        printAs,
        departmentId,
        subDepartmentId,
        amount,
        testMrp,
        doneFor: doneFor as "Male" | "Female" | "Both",
      },
      include: {
        department: { select: { id: true, name: true } },
        subDepartment: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to create test.");
    return NextResponse.json({ error: message }, { status });
  }
}
