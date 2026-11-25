import { NextResponse } from "next/server";

import { getCompanySession } from "@/lib/company-auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prismaErrorResponse } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";
import { persistImageReference, replaceStoredImage, storageErrorStatus } from "@/lib/r2";
import { toRoleLabel } from "@/lib/user-role";

function mapProfile(user: {
  id: string;
  name: string;
  initials: string;
  email: string;
  imageUrl: string | null;
  role: Parameters<typeof toRoleLabel>[0];
  companyRole: { name: string } | null;
}) {
  return {
    id: user.id,
    name: user.name,
    initials: user.initials,
    email: user.email,
    imageUrl: user.imageUrl,
    role: user.companyRole?.name ?? toRoleLabel(user.role),
  };
}

export async function GET() {
  try {
    const session = await getCompanySession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { id: session.userId, companyId: session.companyId },
      select: {
        id: true,
        name: true,
        initials: true,
        email: true,
        imageUrl: true,
        role: true,
        companyRole: { select: { name: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ profile: mapProfile(user) });
  } catch (error) {
    const { status, message } = prismaErrorResponse(error, "Failed to load profile.");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getCompanySession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const existing = await prisma.user.findFirst({
      where: { id: session.userId, companyId: session.companyId },
      select: {
        id: true,
        name: true,
        initials: true,
        email: true,
        imageUrl: true,
        role: true,
        passwordHash: true,
        companyRole: { select: { name: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const body = (await request.json()) as {
      imageUrl?: string | null;
      currentPassword?: string;
      newPassword?: string;
    };

    const updatingImage = body.imageUrl !== undefined;
    const newPassword = body.newPassword?.trim() ?? "";
    const currentPassword = body.currentPassword ?? "";
    const updatingPassword = Boolean(newPassword);

    if (!updatingImage && !updatingPassword) {
      return NextResponse.json(
        { error: "Nothing to update. Change your photo or password." },
        { status: 400 },
      );
    }

    if (updatingPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters." },
          { status: 400 },
        );
      }
      if (!existing.passwordHash || !verifyPassword(currentPassword, existing.passwordHash)) {
        return NextResponse.json(
          { error: "Current password is incorrect." },
          { status: 400 },
        );
      }
    }

    const nextImageUrl = updatingImage
      ? await persistImageReference(
          typeof body.imageUrl === "string" ? body.imageUrl.trim() || null : null,
          "avatars",
        )
      : undefined;

    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        ...(nextImageUrl !== undefined ? { imageUrl: nextImageUrl } : {}),
        ...(updatingPassword ? { passwordHash: hashPassword(newPassword) } : {}),
      },
      select: {
        id: true,
        name: true,
        initials: true,
        email: true,
        imageUrl: true,
        role: true,
        companyRole: { select: { name: true } },
      },
    });

    if (nextImageUrl !== undefined) {
      await replaceStoredImage(existing.imageUrl, nextImageUrl);
    }

    return NextResponse.json({
      profile: mapProfile(updated),
      updated: {
        image: updatingImage,
        password: updatingPassword,
      },
    });
  } catch (error) {
    const storageError = storageErrorStatus(error);
    if (storageError) {
      return NextResponse.json({ error: storageError.message }, { status: storageError.status });
    }
    const { status, message } = prismaErrorResponse(error, "Failed to update profile.");
    return NextResponse.json({ error: message }, { status });
  }
}
