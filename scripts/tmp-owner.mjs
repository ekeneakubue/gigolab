import { readFileSync } from "fs";
import { randomBytes, scryptSync } from "crypto";
import { PrismaClient } from "@prisma/client";

const env = readFileSync(".env", "utf8");
for (const line of env.split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  const key = m[1].trim();
  let value = m[2].trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  if (!process.env[key]) process.env[key] = value;
}

const mode = process.argv[2] ?? "seed";
const prisma = new PrismaClient();
const emails = ["tmp-owner-ui@gigolab.test", "tmp-staff-ui@gigolab.test", "tmp-staff-edit@gigolab.test"];

try {
  const existing = await prisma.user.findMany({ where: { email: { in: emails } }, select: { companyId: true } });
  if (existing.length) {
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
    for (const u of existing) {
      if (!u.companyId) continue;
      await prisma.company.updateMany({
        where: { id: u.companyId, userCount: { gt: 0 } },
        data: { userCount: { decrement: 1 } },
      });
    }
  }
  if (mode === "seed") {
    const company = await prisma.company.findFirst({ where: { status: "Active" }, select: { id: true } });
    const hash = (pw) => { const s = randomBytes(16).toString("hex"); return `${s}:${scryptSync(pw, s, 64).toString("hex")}`; };
    await prisma.$transaction([
      prisma.user.create({
        data: { companyId: company.id, name: "Tmp Owner UI", initials: "TO", email: emails[0], role: "LabOwner", accessLabel: "Tests limited", passwordHash: hash("TmpOwner-7k") },
      }),
      prisma.user.create({
        data: { companyId: company.id, name: "Tmp Staff UI", initials: "TS", email: emails[1], role: "LabTechnician", accessLabel: "Tests limited", passwordHash: hash("TmpStaff-7k") },
      }),
      prisma.company.update({ where: { id: company.id }, data: { userCount: { increment: 2 } } }),
    ]);
  }
  console.log(JSON.stringify({ mode, removed: existing.length }));
} finally {
  await prisma.$disconnect();
}
