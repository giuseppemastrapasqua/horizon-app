import { prisma } from "../lib/prisma";

async function main() {
  const overrides =
    await prisma.propertyPriceOverride.findMany({
      where: {
        source: "AI",
      },

      orderBy: [
        {
          startDate: "asc",
        },
        {
          createdAt: "desc",
        },
      ],

      take: 50,

      select: {
        propertyId: true,
        startDate: true,
        endDate: true,
        nightlyPrice: true,
        minimumStay: true,
        source: true,
        note: true,
        createdAt: true,
      },
    });

  console.log("");
  console.log("===== REVENUE AI DAILY OVERRIDES =====");
  console.log("");

  for (const item of overrides) {
    console.log({
      date:
        item.startDate
          .toISOString()
          .slice(0, 10),

      end:
        item.endDate
          .toISOString()
          .slice(0, 10),

      price:
        Number(
          item.nightlyPrice,
        ),

      minimumStay:
        item.minimumStay,

      source:
        item.source,

      createdAt:
        item.createdAt
          .toISOString(),

      note:
        item.note,
    });
  }

  console.log("");
  console.log(
    `Totale override AI trovati: ${overrides.length}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
