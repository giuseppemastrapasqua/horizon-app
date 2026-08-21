const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const templates =
    await prisma.financeReportTemplate.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

  console.dir(
    templates,
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
