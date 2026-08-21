const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const reports =
    await prisma.financeReport.findMany({
      orderBy: {
        createdAt: "desc",
      },

      take: 5,

      select: {
        id: true,
        title: true,
        referenceMonth: true,

        adjustments: {
          select: {
            id: true,
            description: true,
            amount: true,
          },
        },
      },
    });

  console.dir(
    reports,
    {
      depth: null,
    }
  );
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
