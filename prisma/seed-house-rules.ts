import { PrismaClient } from "@prisma/client";

import { PROPERTY_HOUSE_RULES } from "../lib/properties/property-house-rules";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const result = await prisma.houseRule.createMany({
    data: PROPERTY_HOUSE_RULES.map((houseRule) => ({
      key: houseRule.key,
      label: houseRule.label,
      category: houseRule.category,
      description: houseRule.description,
      sortOrder: houseRule.sortOrder,
      isActive: true,
    })),
    skipDuplicates: true,
  });

  console.log(
    `Seed House Rules completato: ${result.count} nuove regole create.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("Errore durante il seed delle House Rules:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });