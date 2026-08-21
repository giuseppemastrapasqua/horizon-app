const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const formulas =
    await prisma.financeFormula.findMany({
      orderBy: {
        createdAt: "asc",
      },

      include: {
        property: {
          select: {
            name: true,
          },
        },

        rules: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

  for (const formula of formulas) {
    console.log("");
    console.log("================================================");
    console.log("FORMULA:", formula.name);
    console.log("ID:", formula.id);
    console.log(
      "IMMOBILE:",
      formula.property?.name ?? "GENERALE"
    );
    console.log(
      "STATO:",
      formula.status
    );
    console.log("================================================");

    for (const rule of formula.rules) {
      console.log({
        order: rule.order,
        name: rule.name,
        enabled: rule.isEnabled,
        operation: rule.operation,
        valueType: rule.valueType,
        value: Number(rule.value),
        base: rule.base,
        category: rule.category,
        channel: rule.channel,
      });
    }
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
