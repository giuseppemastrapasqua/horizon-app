import { prisma } from "../lib/prisma";

import {
  getPropertyRevenueData,
} from "../lib/revenue/get-property-revenue-data";

import {
  buildPeriodRevenueRecommendation,
} from "../app/properties/[id]/components/property-calendar/revenue/build-period-recommendation";

async function main() {
  const [
    propertyId,
    rangeStart,
    rangeEnd,
  ] =
    process.argv.slice(2);

  if (
    !propertyId ||
    !rangeStart ||
    !rangeEnd
  ) {
    throw new Error(
      [
        "Uso:",
        "npx tsx scripts/debug-revenue-period.ts PROPERTY_ID YYYY-MM-DD YYYY-MM-DD",
      ].join(" "),
    );
  }

  const property =
    await prisma.property.findUnique({
      where: {
        id:
          propertyId,
      },

      select: {
        id: true,
        name: true,
        city: true,
        zone: true,

        ratePlans: {
          where: {
            code:
              "STANDARD",
          },

          take:
            1,

          select: {
            basePrice:
              true,

            minimumStay:
              true,
          },
        },
      },
    });

  if (!property) {
    throw new Error(
      `Alloggio ${propertyId} non trovato.`,
    );
  }

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

  const standard =
    property.ratePlans[0] ??
    null;

  const result =
    buildPeriodRevenueRecommendation({
      propertyId,

      rangeStart,
      rangeEnd,

      minimumStay:
        String(
          standard?.minimumStay ??
          1,
        ),

      revenueData,
    });

  console.log("");
  console.log(
    "===== PROPERTY =====",
  );

  console.log({
    id:
      property.id,

    name:
      property.name,

    city:
      property.city,

    zone:
      property.zone,

    standardRate:
      standard?.basePrice ===
        null ||
      standard?.basePrice ===
        undefined
        ? null
        : Number(
            standard.basePrice,
          ),

    minimumStay:
      standard?.minimumStay ??
      null,
  });

  console.log("");
  console.log(
    "===== PERIOD =====",
  );

  console.log({
    from:
      rangeStart,

    to:
      rangeEnd,
  });

  console.log("");
  console.log(
    "===== MARKET DATA =====",
  );

  console.log({
    days:
      revenueData.days.length,

    snapshot:
      revenueData.snapshot
        ? {
            market:
              revenueData.snapshot
                .marketName,

            adr:
              revenueData.snapshot
                .marketAdr,

            provider:
              revenueData.snapshot
                .provider,
          }
        : null,

    comparables:
      revenueData.comparables.length,
  });

  console.log("");
  console.log(
    "===== DAILY MARKET =====",
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

      event:
        day.eventScore,

      confidence:
        day.confidence,
    });
  }

  console.log("");
  console.log(
    "===== REVENUE RESULT =====",
  );

  console.dir(
    result,
    {
      depth:
        null,
    },
  );

  console.log("");
  console.log(
    "===== DAILY AI PRICES =====",
  );

  if (
    result.recommendation
      ?.dailyPrices
      ?.length
  ) {
    for (
      const item of
        result.recommendation
          .dailyPrices
    ) {
      console.log({
        date:
          item.date,

        aiPrice:
          item.recommendedPrice,
      });
    }
  } else {
    console.log(
      "NESSUN PREZZO AI GIORNALIERO",
    );
  }
}

main()
  .catch(
    (error) => {
      console.error(
        "DEBUG REVENUE KO:",
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
