const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const properties =
    await prisma.property.findMany({
      orderBy: {
        name: "asc",
      },

      select: {
        id: true,
        name: true,

        financeFormulas: {
          select: {
            id: true,
            name: true,
            status: true,
            scope: true,
          },
        },
      },
    });

  for (const property of properties) {
    console.log("");
    console.log("STRUTTURA:", property.name);
    console.log("ID:", property.id);
    console.log(
      "FORMULE:",
      property.financeFormulas
    );
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
