const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const rules =
    await prisma.financeFormulaRule.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        isEnabled: true,
      },
    });

  for (const rule of rules) {
    const name =
      rule.name
        .trim()
        .toLowerCase();

    const isStructural =
      rule.category === "OTA_COMMISSION" ||
      rule.category === "CLEANING" ||
      rule.category === "MANAGEMENT_COMMISSION" ||
      name.includes("commissione ota") ||
      name.includes("pulizi") ||
      name.includes("property manager");

    if (
      !isStructural ||
      !rule.isEnabled
    ) {
      continue;
    }

    await prisma.financeFormulaRule.update({
      where: {
        id: rule.id,
      },

      data: {
        isEnabled: false,
      },
    });

    console.log(
      "DISATTIVATA:",
      rule.name
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
