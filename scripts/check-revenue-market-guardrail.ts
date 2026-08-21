import { prisma } from "../lib/prisma";

import {
  getPropertyRevenueData,
} from "../lib/revenue/get-property-revenue-data";

import {
  buildPeriodRevenueRecommendation,
} from "../app/properties/[id]/components/property-calendar/revenue/build-period-recommendation";

async function main() {
  const start =
    "2026-08-19";

  const end =
    "2026-08-25";

  const properties =
    await prisma.property.findMany({
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
    "===== MARKET GUARDRAIL CHECK =====",
  );

  let totalDays =
    0;

  let violations =
    0;

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
      "--------------------------------",
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

            day.marketMedianPrice,
          ],
        ),
      );

    for (
      const daily of
        result.recommendation.dailyPrices ??
        []
    ) {
      const market =
        marketByDate.get(
          daily.date,
        );

      if (
        market === null ||
        market === undefined ||
        market <= 0
      ) {
        console.log({
          date:
            daily.date,

          market:
            market ?? null,

          ai:
            daily.recommendedPrice,

          status:
            "NO MARKET",
        });

        continue;
      }

      const min =
        Math.round(
          market *
            0.85,
        );

      const max =
        Math.round(
          market *
            1.15,
        );

      const deltaPercent =
        Math.round(
          (
            (
              daily.recommendedPrice /
              market
            ) -
            1
          ) *
            1000,
        ) /
        10;

      const ok =
        daily.recommendedPrice >=
          min &&
        daily.recommendedPrice <=
          max;

      totalDays +=
        1;

      if (!ok) {
        violations +=
          1;
      }

      console.log({
        date:
          daily.date,

        market:
          market,

        min:
          min,

        max:
          max,

        ai:
          daily.recommendedPrice,

        deltaPercent,

        status:
          ok
            ? "OK"
            : "VIOLATION",
      });
    }
  }

  console.log("");
  console.log(
    "===== RISULTATO =====",
  );

  console.log({
    totalDays,
    violations,
  });

  if (
    violations > 0
  ) {
    throw new Error(
      `Market Guardrail violato in ${violations} giorni.`,
    );
  }

  console.log(
    "MARKET GUARDRAIL OK",
  );
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
