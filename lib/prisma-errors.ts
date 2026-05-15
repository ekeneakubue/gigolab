import { Prisma } from "@prisma/client";

export function prismaErrorResponse(error: unknown, fallback: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P1001") {
      return {
        status: 503,
        message:
          "Database is unreachable. If you use Neon, open your project in the Neon console to wake it, then try again.",
      };
    }

    if (error.code === "P1002") {
      return {
        status: 503,
        message: "Database connection timed out. Check your network and DATABASE_URL, then try again.",
      };
    }

    if (error.code === "P2021" || error.code === "P2022") {
      return {
        status: 503,
        message:
          "Database schema is out of date. Stop the dev server, run `npx prisma db push`, then `npx prisma generate`.",
      };
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      status: 503,
      message: "Could not connect to the database. Check DATABASE_URL in your .env file.",
    };
  }

  const message = error instanceof Error ? error.message : fallback;
  if (/can't reach database|connection.*closed|ECONNREFUSED/i.test(message)) {
    return {
      status: 503,
      message:
        "Database connection failed. If you use Neon, wake the database from the Neon console and retry.",
    };
  }

  return { status: 500, message: fallback };
}

export function isUniqueConstraintError(
  error: unknown,
  field?: string
): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== "P2002") return false;
  if (!field) return true;
  const target = error.meta?.target;
  if (Array.isArray(target)) return target.includes(field);
  if (typeof target === "string") return target.includes(field);
  return false;
}
