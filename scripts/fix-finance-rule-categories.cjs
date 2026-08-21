const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const rules =
    await prisma.financeFormulaRule.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        channel: true,
      },
    });

  for (const rule of rules) {
    const name =
      rule.name
        .trim()
        .toLowerCase();

    let category = rule.category;
    let channel = rule.channel;

    if (
      name.includes("commissione ota booking") ||
      name.includes("booking.com")
    ) {
      category = "OTA_COMMISSION";
      channel = "BOOKING";
    } else if (
      name.includes("commissione ota airbnb") ||
      name === "airbnb"
    ) {
      category = "OTA_COMMISSION";
      channel = "AIRBNB";
    } else if (
      name.includes("commissione ota vrbo") ||
      name === "vrbo"
    ) {
      category = "OTA_COMMISSION";
      channel = "VRBO";
    } else if (
      name.includes("pulizi")
    ) {
      category = "CLEANING";
      channel = null;
    } else if (
      name.includes("property manager") ||
      name.includes("comm. pm") ||
      name.includes("commissione pm")
    ) {
      category =
        "MANAGEMENT_COMMISSION";
      channel = null;
    } else if (
      name.includes("cedolare")
    ) {
      category = "TAX";
      channel = null;
    } else if (
      name.includes("extra") ||
      name.includes("varie")
    ) {
      category = "OTHER";
      channel = null;
    }

    if (
      category !== rule.category ||
      channel !== rule.channel
    ) {
      await prisma.financeFormulaRule.update({
        where: {
          id: rule.id,
        },

        data: {
          category,
          channel,
        },
      });

      console.log(
        "AGGIORNATA:",
        rule.name,
        "->",
        category,
        channel ?? "-"
      );
    }
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
