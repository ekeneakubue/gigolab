export type ImageFolder = "logos" | "avatars";

export async function uploadImageFile(file: File, folder: ImageFolder): Promise<string> {
  const body = new FormData();
  body.set("file", file);
  body.set("folder", folder);

  const response = await fetch("/api/uploads", { method: "POST", body });
  const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
  if (!response.ok || !payload?.url) {
    throw new Error(payload?.error || "Could not upload image.");
  }

  return payload.url;
}
