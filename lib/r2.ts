import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export const IMAGE_FOLDERS = ["logos", "avatars"] as const;
export type ImageFolder = (typeof IMAGE_FOLDERS)[number];

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export class ImageStorageError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ImageStorageError";
    this.status = status;
  }
}

export function storageErrorStatus(error: unknown): { status: number; message: string } | null {
  if (error instanceof ImageStorageError) {
    return { status: error.status, message: error.message };
  }
  return null;
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new ImageStorageError(
      `${name} is not set. Add your Cloudflare R2 settings to .env.`,
      500,
    );
  }
  return value;
}

function publicBaseUrl() {
  return requireEnv("R2_PUBLIC_BASE_URL").replace(/\/+$/, "");
}

let client: S3Client | undefined;

function getClient() {
  if (!client) {
    const accountId = requireEnv("R2_ACCOUNT_ID");
    client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
        secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
      },
      // R2 does not support the default flexible checksums in newer AWS SDKs.
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }
  return client;
}

function isImageFolder(value: string): value is ImageFolder {
  return (IMAGE_FOLDERS as readonly string[]).includes(value);
}

export async function uploadImageBytes(input: {
  bytes: Buffer;
  contentType: string;
  folder: ImageFolder;
}): Promise<string> {
  const extension = IMAGE_EXTENSIONS[input.contentType];
  if (!extension) {
    throw new ImageStorageError("Upload a JPEG, PNG, WebP, or GIF image.");
  }
  if (input.bytes.byteLength === 0) {
    throw new ImageStorageError("The selected image is empty.");
  }
  if (input.bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new ImageStorageError("Image must be 5 MB or smaller.");
  }

  const key = `${input.folder}/${crypto.randomUUID()}.${extension}`;
  await getClient().send(
    new PutObjectCommand({
      Bucket: requireEnv("R2_BUCKET_NAME"),
      Key: key,
      Body: input.bytes,
      ContentType: input.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return `${publicBaseUrl()}/${key}`;
}

function keyFromPublicUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const base = process.env.R2_PUBLIC_BASE_URL?.trim().replace(/\/+$/, "");
  if (!base || !url.startsWith(`${base}/`)) return null;

  let key = "";
  try {
    key = decodeURIComponent(url.slice(base.length + 1));
  } catch {
    return null;
  }

  const folder = key.split("/")[0] ?? "";
  if (!isImageFolder(folder) || key.includes("..") || key.includes("\\")) return null;
  return key;
}

export async function deleteStoredImage(url: string | null | undefined) {
  const key = keyFromPublicUrl(url);
  if (!key) return;

  try {
    await getClient().send(
      new DeleteObjectCommand({
        Bucket: requireEnv("R2_BUCKET_NAME"),
        Key: key,
      }),
    );
  } catch (error) {
    console.error(`Failed to delete R2 object ${key}`, error);
  }
}

export async function replaceStoredImage(
  previousUrl: string | null | undefined,
  nextUrl: string | null | undefined,
) {
  if (!previousUrl || previousUrl === nextUrl) return;
  await deleteStoredImage(previousUrl);
}

function parseDataUrl(value: string): { bytes: Buffer; contentType: string } {
  const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,([a-z0-9+/=\s]+)$/i.exec(value);
  if (!match) {
    throw new ImageStorageError("Upload a JPEG, PNG, WebP, or GIF image.");
  }

  const bytes = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  return { bytes, contentType: match[1].toLowerCase() };
}

/** Keep an existing URL, or upload a legacy data URL into R2 before it is saved. */
export async function persistImageReference(
  value: string | null | undefined,
  folder: ImageFolder,
): Promise<string | null | undefined> {
  if (value == null) return value;

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("data:")) {
    const parsed = parseDataUrl(trimmed);
    return uploadImageBytes({ ...parsed, folder });
  }

  throw new ImageStorageError("Image must be uploaded before it can be saved.");
}
