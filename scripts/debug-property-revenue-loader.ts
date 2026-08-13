import {
  getPropertyRevenueData,
} from "../lib/revenue/get-property-revenue-data";

import {
  prisma,
} from "../lib/prisma";

const propertyId =
  "cms4dant60001d9b4aj0dd92e";

async function main() {
  const revenueStartDate =
    new Date();

  revenueStartDate.setUTCHours(
    0,
    0,
    0,
    0,
  );

  const revenueEndDate =
    new Date(
      revenueStartDate,
    );

  revenueEndDate.setUTCFullYear(
    revenueEndDate.getUTCFullYear() +
      1,
  );

  console.log("");
  console.log(
    "===== INTERVALLO PAGE =====",
  );

  console.log({
    start:
      revenueStartDate.toISOString(),

    end:
      revenueEndDate.toISOString(),
  });

  const revenueData =
    await getPropertyRevenueData({
      propertyId,
      startDate:
        revenueStartDate,
      endDate:
        revenueEndDate,
    });

  console.log("");
  console.log(
    "===== LOADER RESULT =====",
  );

  console.log({
    snapshot:
      revenueData.snapshot,

    days:
      revenueData.days.length,

    comparables:
      revenueData.comparables.length,

    firstDay:
      revenueData.days[0]?.date ??
      null,

    lastDay:
      revenueData.days.at(-1)?.date ??
      null,
  });

  const november =
    revenueData.days.filter(
      (day) =>
        day.date.slice(
          0,
          7,
        ) ===
        "2026-11",
    );

  console.log("");
  console.log(
    "===== NOVEMBRE NEL LOADER =====",
  );

  console.log({
    count:
      november.length,

    rows:
      november.map(
        (day) => ({
          date:
            day.date.slice(
              0,
              10,
            ),

          price:
            day.marketMedianPrice,

          confidence:
            day.confidence,

          occupancy:
            day.marketOccupancy,

          demand:
            day.demandIndex,
        }),
      ),
  });
}

main()
  .catch(
    console.error,
  )
  .finally(
    async () => {
      await prisma.$disconnect();
    },
  );
