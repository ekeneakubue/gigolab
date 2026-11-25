import type { PrismaClient } from "@prisma/client";

type CompanyWithFeatures = {
  features?: { featureId: string }[];
} & Record<string, unknown>;

export function withCompanyFeatureIds<T extends CompanyWithFeatures>(company: T) {
  const { features, ...rest } = company;
  return {
    ...rest,
    featureIds: (features ?? []).map((row) => row.featureId),
  };
}

export async function syncCompanyFeatures(
  prismaClient: PrismaClient,
  companyId: string,
  featureIds: string[],
) {
  const uniqueIds = [...new Set(featureIds.filter((id) => typeof id === "string" && id))];

  const validFeatures =
    uniqueIds.length === 0
      ? []
      : await prismaClient.appFeature.findMany({
          where: { id: { in: uniqueIds } },
          select: { id: true },
        });

  const validIds = validFeatures.map((feature) => feature.id);

  await prismaClient.companyFeature.deleteMany({ where: { companyId } });

  if (validIds.length > 0) {
    await prismaClient.companyFeature.createMany({
      data: validIds.map((featureId) => ({ companyId, featureId })),
      skipDuplicates: true,
    });
  }

  return validIds;
}
