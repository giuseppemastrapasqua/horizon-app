import { prisma } from "../lib/prisma";

import {
  getPropertyRevenueData,
} from "../lib/revenue/get-property-revenue-data";

import {
  buildPeriodRevenueRecommendation,
} from "../app/properties/[id]/components/property-calendar/revenue/build-period-recommendation";

const propertyId =
  "cmraixwak0002d998c86i3fp7";

const rangeStart =
  "2026-08-19";

const rangeEnd =
  "2026-08-25";

async function main() {
  const property =
    await prisma.property.findUnique({
      where: {
        id: propertyId,
      },

      select: {
        id: true,
        name: true,

        ratePlans: {
          where: {
            code: "STANDARD",
          },

          take: 1,

          select: {
            minimumStay: true,
            basePrice: true,
          },
        },
      },
    });

  if (!property) {
    throw new Error(
      "Brera non trovata.",
    );
  }

  /*
   * Usiamo UTC anche nel debug,
   * così non spostiamo le date
   * avanti/indietro per il timezone.
   */
  const startDate =
    new Date(
      `${rangeStart}T00:00:00.000Z`,
    );

  const endDate =
    new Date(
      `${rangeEnd}T23:59:59.999Z`,
    );

  const revenueData =
    await getPropertyRevenueData({
      propertyId,
      startDate,
      endDate,
    });

  console.log("");
  console.log("===== PROPERTY =====");

  console.log({
    id:
      property.id,

    name:
      property.name,

    standardRate:
      property.ratePlans[0]
        ? Number(
            property.ratePlans[0]
              .basePrice,
          )
        : null,

    minimumStay:
      property.ratePlans[0]
        ?.minimumStay ??
      null,
  });

  console.log("");
  console.log(
    "===== REVENUE DATA =====",
  );

  console.log({
    snapshot:
      revenueData.snapshot,

    days:
      revenueData.days.length,

    comparables:
      revenueData.comparables.length,
  });

  console.log("");
  console.log(
    "===== GIORNI CARICATI =====",
  );

  for (
    const day of
      revenueData.days
  ) {
    console.log({
      date:
        day.date.slice(
          0,
          10,
        ),

      median:
        day.marketMedianPrice,

      occupancy:
        day.marketOccupancy,

      demand:
        day.demandIndex,

      confidence:
        day.confidence,
    });
  }

  const result =
    buildPeriodRevenueRecommendation({
      propertyId,

      rangeStart,
      rangeEnd,

      minimumStay:
        String(
          property.ratePlans[0]
            ?.minimumStay ??
          1,
        ),

      revenueData,
    });

  console.log("");
  console.log(
    "===== RECOMMENDATION =====",
  );

  console.dir(
    result,
    {
      depth: null,
    },
  );
}

main()
  .catch(
    (error) => {
      console.error(
        "DEBUG KO:",
        error,
      );

      process.exitCode =
        1;
    },
  )
  .finally(
    async () => {
      await prisma.$disconnect();
    },
  );
