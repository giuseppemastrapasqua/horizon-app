import { prisma } from "../lib/prisma";

import {
  getPropertyRevenueData,
} from "../lib/revenue/get-property-revenue-data";

import {
  buildPeriodRevenueRecommendation,
} from "../app/properties/[id]/components/property-calendar/revenue/build-period-recommendation";

const targetNames = [
  "Hub 97 MIlano",
  "Navigli Urban Loft",
  "Piazza Duomo apartment",
];

async function main() {
  const start =
    "2026-08-19";

  const end =
    "2026-08-25";

  const properties =
    await prisma.property.findMany({
      where: {
        name: {
          in:
            targetNames,
        },
      },

      select: {
        id: true,
        name: true,

        ratePlans: {
          where: {
            code:
              "STANDARD",
          },

          take:
            1,

          select: {
            minimumStay:
              true,
          },
        },
      },

      orderBy: {
        name:
          "asc",
      },
    });

  console.log("");
  console.log(
    "===== REVENUE PROPERTY COMPARISON =====",
  );

  for (
    const property of
      properties
  ) {
    const revenueData =
      await getPropertyRevenueData({
        propertyId:
          property.id,

        startDate:
          new Date(
            `${start}T00:00:00.000Z`,
          ),

        endDate:
          new Date(
            `${end}T23:59:59.999Z`,
          ),
      });

    const result =
      buildPeriodRevenueRecommendation({
        propertyId:
          property.id,

        rangeStart:
          start,

        rangeEnd:
          end,

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
      "========================================",
    );

    console.log(
      property.name,
    );

    if (
      !result.recommendation
    ) {
      console.log(
        "NESSUNA RACCOMANDAZIONE",
      );

      continue;
    }

    const marketByDate =
      new Map(
        revenueData.days.map(
          (day) => [
            day.date.slice(
              0,
              10,
            ),

            day,
          ],
        ),
      );

    for (
      const daily of
        result.recommendation.dailyPrices ??
        []
    ) {
      const sourceDay =
        marketByDate.get(
          daily.date,
        );

      if (!sourceDay) {
        continue;
      }

      const market =
        sourceDay.marketMedianPrice;

      const deltaPercent =
        market &&
        market > 0
          ? Math.round(
              (
                daily.recommendedPrice /
                  market -
                1
              ) *
                1000,
            ) /
            10
          : null;

      console.log({
        date:
          daily.date,

        market:
          market,

        ai:
          daily.recommendedPrice,

        deltaPercent,

        propertyOccupancy:
          sourceDay.propertyOccupancy,

        bookingPace:
          sourceDay.bookingPace,

        demand:
          sourceDay.demandIndex,

        event:
          sourceDay.eventScore,

        leadTimeDays:
          sourceDay.leadTimeDays,

        gapBefore:
          sourceDay.gapBeforeNights,

        gapAfter:
          sourceDay.gapAfterNights,

        contributions:
          daily.contributions.map(
            (item) => ({
              code:
                item.code,

              label:
                item.label,

              pressure:
                item.pressure,

              weight:
                item.weight,

              contribution:
                item.contribution,

              adjustmentPercent:
                item.adjustmentPercent,
            }),
          ),

        explanation:
          daily.explanation,
      });
    }
  }
}

main()
  .catch(
    (error) => {
      console.error(
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

