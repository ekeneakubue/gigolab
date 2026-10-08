import { NextResponse } from "next/server";

import { IMAGE_FOLDERS, storageErrorStatus, uploadImageBytes, type ImageFolder } from "@/lib/r2";

export const runtime = "nodejs";

function isImageFolder(value: string): value is ImageFolder {
  return (IMAGE_FOLDERS as readonly string[]).includes(value);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose an image file." }, { status: 400 });
    }
    if (typeof folder !== "string" || !isImageFolder(folder)) {
      return NextResponse.json({ error: "Invalid upload folder." }, { status: 400 });
    }

    const url = await uploadImageBytes({
      bytes: Buffer.from(await file.arrayBuffer()),
      contentType: file.type,
      folder,
    });

    return NextResponse.json({ url });
  } catch (error) {
    const storageError = storageErrorStatus(error);
    if (storageError) {
      return NextResponse.json({ error: storageError.message }, { status: storageError.status });
    }
    return NextResponse.json({ error: "Could not upload image." }, { status: 500 });
  }
}
