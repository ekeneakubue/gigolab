import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import { ensureDefaultSystemRoles } from "@/lib/system-role";
import { listUserRoleLabelsFromDatabase } from "@/lib/user-role";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await ensureDefaultSystemRoles();

    const systemRoles = await prisma.systemRole.findMany({
      select: { name: true },
      orderBy: [{ kind: "asc" }, { name: "asc" }],
    });

    if (systemRoles.length > 0) {
      return NextResponse.json(systemRoles.map((role) => role.name));
    }

    const roles = await listUserRoleLabelsFromDatabase();
    return NextResponse.json(roles);
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to load roles.");
    return NextResponse.json({ error: message }, { status });
  }
}
