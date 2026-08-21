import { prisma } from "../lib/prisma";

async function main() {
  const property =
    await prisma.property.findFirst({
      orderBy: {
        createdAt: "desc",
      },

      select: {
        id: true,
        name: true,

        ratePlans: {
          select: {
            id: true,
            name: true,
            code: true,
            basePrice: true,
            active: true,
          },
        },

        revenueDailySignals: {
          orderBy: {
            date: "asc",
          },

          take: 100,

          select: {
            date: true,
            marketMedianPrice: true,
            marketLowPrice: true,
            marketHighPrice: true,
            marketOccupancy: true,
            demandIndex: true,
            bookingPace: true,
            eventScore: true,
            confidence: true,
          },
        },

        revenueMarketSnapshots: {
          orderBy: {
            capturedAt: "desc",
          },

          take: 3,

          select: {
            marketName: true,
            marketAdr: true,
            marketOccupancy: true,
            demandIndex: true,
            bookingPace: true,
            capturedAt: true,
          },
        },

        revenueComparables: {
          take: 10,

          select: {
            name: true,
            nightlyPrice: true,
            adr: true,
            occupancyRate: true,
            similarityScore: true,
          },
        },
      },
    });

  if (!property) {
    console.log(
      "NESSUNA STRUTTURA TROVATA",
    );

    return;
  }

  console.log("");
  console.log("===== PROPERTY =====");
  console.log({
    id: property.id,
    name: property.name,
  });

  console.log("");
  console.log("===== RATE PLANS =====");

  for (
    const rate of
      property.ratePlans
  ) {
    console.log({
      name: rate.name,
      code: rate.code,
      basePrice:
        rate.basePrice === null
          ? null
          : Number(rate.basePrice),
      active: rate.active,
    });
  }

  console.log("");
  console.log(
    "===== REVENUE DAILY SIGNALS =====",
  );

  for (
    const signal of
      property.revenueDailySignals
  ) {
    console.log({
      date:
        signal.date
          .toISOString()
          .slice(0, 10),

      median:
        signal.marketMedianPrice === null
          ? null
          : Number(
              signal.marketMedianPrice,
            ),

      low:
        signal.marketLowPrice === null
          ? null
          : Number(
              signal.marketLowPrice,
            ),

      high:
        signal.marketHighPrice === null
          ? null
          : Number(
              signal.marketHighPrice,
            ),

      occupancy:
        signal.marketOccupancy === null
          ? null
          : Number(
              signal.marketOccupancy,
            ),

      demand:
        signal.demandIndex === null
          ? null
          : Number(
              signal.demandIndex,
            ),

      pace:
        signal.bookingPace === null
          ? null
          : Number(
              signal.bookingPace,
            ),

      event:
        signal.eventScore === null
          ? null
          : Number(
              signal.eventScore,
            ),

      confidence:
        signal.confidence === null
          ? null
          : Number(
              signal.confidence,
            ),
    });
  }

  console.log("");
  console.log(
    "===== MARKET SNAPSHOTS =====",
  );

  for (
    const snapshot of
      property.revenueMarketSnapshots
  ) {
    console.log({
      market:
        snapshot.marketName,

      adr:
        snapshot.marketAdr === null
          ? null
          : Number(
              snapshot.marketAdr,
            ),

      occupancy:
        snapshot.marketOccupancy === null
          ? null
          : Number(
              snapshot.marketOccupancy,
            ),

      demand:
        snapshot.demandIndex === null
          ? null
          : Number(
              snapshot.demandIndex,
            ),

      pace:
        snapshot.bookingPace === null
          ? null
          : Number(
              snapshot.bookingPace,
            ),

      capturedAt:
        snapshot.capturedAt
          .toISOString(),
    });
  }

  console.log("");
  console.log(
    "===== COMPARABLES =====",
  );

  for (
    const comparable of
      property.revenueComparables
  ) {
    console.log({
      name:
        comparable.name,

      price:
        comparable.nightlyPrice === null
          ? null
          : Number(
              comparable.nightlyPrice,
            ),

      adr:
        comparable.adr === null
          ? null
          : Number(
              comparable.adr,
            ),

      occupancy:
        comparable.occupancyRate === null
          ? null
          : Number(
              comparable.occupancyRate,
            ),

      similarity:
        comparable.similarityScore === null
          ? null
          : Number(
              comparable.similarityScore,
            ),
    });
  }

  console.log("");
  console.log("===== TOTALI =====");

  console.log({
    dailySignals:
      property.revenueDailySignals.length,

    snapshots:
      property.revenueMarketSnapshots.length,

    comparables:
      property.revenueComparables.length,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

