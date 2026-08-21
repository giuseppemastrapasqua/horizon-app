const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const reports =
    await prisma.financeReport.findMany({
      orderBy: {
        createdAt: "desc",
      },

      select: {
        id: true,
        title: true,
        referenceMonth: true,
        createdAt: true,

        property: {
          select: {
            name: true,
          },
        },
      },
    });

  console.log(
    JSON.stringify(
      reports,
      null,
      2
    )
  );
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
