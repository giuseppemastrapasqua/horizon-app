const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const reports = await prisma.financeReport.findMany({
    orderBy: {
      createdAt: "desc",
    },

    select: {
      id: true,
      propertyId: true,
      referenceMonth: true,
      createdAt: true,
    },
  });

  const seen = new Set();
  const duplicates = [];

  for (const report of reports) {
    const key =
      `${report.propertyId}|${report.referenceMonth.toISOString()}`;

    if (seen.has(key)) {
      duplicates.push(report.id);
    } else {
      seen.add(key);
    }
  }

  console.log(
    "Duplicati da eliminare:",
    duplicates.length
  );

  if (duplicates.length > 0) {
    await prisma.financeReport.deleteMany({
      where: {
        id: {
          in: duplicates,
        },
      },
    });
  }

  console.log("OK - duplicati eliminati");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
