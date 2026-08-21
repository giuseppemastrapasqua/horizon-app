import { prisma } from "../lib/prisma";

async function main() {
  const properties =
    await prisma.property.findMany({
      orderBy: {
        name: "asc",
      },

      select: {
        id: true,
        name: true,
        city: true,
        zone: true,
      },
    });

  console.log("");
  console.log("===== REVENUE PER STRUTTURA =====");
  console.log("");

  for (const property of properties) {
    const [
      totalSignals,
      firstSignal,
      lastSignal,
      augustSignals,
      aiOverrides,
      snapshot,
    ] =
      await Promise.all([
        prisma.revenueDailySignal.count({
          where: {
            propertyId:
              property.id,
          },
        }),

        prisma.revenueDailySignal.findFirst({
          where: {
            propertyId:
              property.id,
          },

          orderBy: {
            date: "asc",
          },

          select: {
            date: true,
          },
        }),

        prisma.revenueDailySignal.findFirst({
          where: {
            propertyId:
              property.id,
          },

          orderBy: {
            date: "desc",
          },

          select: {
            date: true,
          },
        }),

        prisma.revenueDailySignal.findMany({
          where: {
            propertyId:
              property.id,

            date: {
              gte:
                new Date(
                  "2026-08-19T00:00:00",
                ),

              lte:
                new Date(
                  "2026-08-25T00:00:00",
                ),
            },
          },

          orderBy: {
            date: "asc",
          },

          select: {
            date: true,
            marketMedianPrice: true,
            marketOccupancy: true,
            demandIndex: true,
            confidence: true,
          },
        }),

        prisma.propertyPriceOverride.count({
          where: {
            propertyId:
              property.id,

            source:
              "AI",
          },
        }),

        prisma.revenueMarketSnapshot.findFirst({
          where: {
            propertyId:
              property.id,
          },

          orderBy: {
            capturedAt:
              "desc",
          },

          select: {
            marketName: true,
            marketAdr: true,
            capturedAt: true,
          },
        }),
      ]);

    console.log("--------------------------------");
    console.log({
      id:
        property.id,

      name:
        property.name,

      city:
        property.city,

      zone:
        property.zone,

      totalSignals,

      firstSignal:
        firstSignal?.date
          .toISOString()
          .slice(0, 10) ??
        null,

      lastSignal:
        lastSignal?.date
          .toISOString()
          .slice(0, 10) ??
        null,

      august19to25:
        augustSignals.length,

      aiOverrides,

      market:
        snapshot?.marketName ??
        null,

      marketAdr:
        snapshot?.marketAdr ===
          null ||
        snapshot?.marketAdr ===
          undefined
          ? null
          : Number(
              snapshot.marketAdr,
            ),
    });

    if (
      augustSignals.length >
      0
    ) {
      console.log(
        "Segnali 19-25 agosto:",
      );

      for (
        const signal of
          augustSignals
      ) {
        console.log({
          date:
            signal.date
              .toISOString()
              .slice(0, 10),

          median:
            signal.marketMedianPrice ===
            null
              ? null
              : Number(
                  signal.marketMedianPrice,
                ),

          occupancy:
            signal.marketOccupancy ===
            null
              ? null
              : Number(
                  signal.marketOccupancy,
                ),

          demand:
            signal.demandIndex ===
            null
              ? null
              : Number(
                  signal.demandIndex,
                ),

          confidence:
            signal.confidence ===
            null
              ? null
              : Number(
                  signal.confidence,
                ),
        });
      }
    }

    console.log("");
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
