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
        propertyId: true,
        referenceMonth: true,
        createdAt: true,

        adjustments: {
          select: {
            id: true,
            description: true,
            amount: true,
          },
        },
      },
    });

  const keep = new Map();
  const duplicates = [];

  for (const report of reports) {
    const key =
      `${report.propertyId}|${
        report.referenceMonth.toISOString()
      }`;

    if (!keep.has(key)) {
      keep.set(key, report);
      continue;
    }

    duplicates.push(report);
  }

  console.log(
    "Rendiconti mantenuti:",
    keep.size
  );

  console.log(
    "Duplicati da eliminare:",
    duplicates.length
  );

  for (const report of duplicates) {
    console.log(
      "ELIMINO:",
      report.id,
      report.referenceMonth,
      "rettifiche:",
      report.adjustments.map(
        (item) => ({
          description:
            item.description,
          amount:
            Number(item.amount),
        })
      )
    );
  }

  if (duplicates.length > 0) {
    await prisma.financeReport.deleteMany({
      where: {
        id: {
          in:
            duplicates.map(
              (report) =>
                report.id
            ),
        },
      },
    });
  }

  console.log(
    "OK - duplicati eliminati"
  );
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
