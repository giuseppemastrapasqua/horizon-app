import {
  prisma,
} from "../lib/prisma";

import {
  getPropertyRevenueData,
} from "../lib/revenue/get-property-revenue-data";

import {
  buildPeriodRevenueRecommendation,
} from "../app/properties/[id]/components/property-calendar/revenue/build-period-recommendation";

const propertyId =
  "cms4dant60001d9b4aj0dd92e";

async function main() {
  const startDate =
    new Date(
      "2026-08-13T00:00:00.000Z",
    );

  const endDate =
    new Date(
      "2027-08-13T00:00:00.000Z",
    );

  const revenueData =
    await getPropertyRevenueData({
      propertyId,
      startDate,
      endDate,
    });

  console.log("");
  console.log(
    "===== INPUT =====",
  );

  console.log({
    days:
      revenueData.days.length,

    snapshot:
      Boolean(
        revenueData.snapshot,
      ),

    comparables:
      revenueData.comparables.length,
  });

  console.log("");
  console.log(
    "===== PERIOD RESULT =====",
  );

  const result =
    buildPeriodRevenueRecommendation({
      propertyId,

      rangeStart:
        "2026-11-01",

      rangeEnd:
        "2026-11-07",

      minimumStay:
        "2",

      revenueData,
    });

  console.dir(
    result,
    {
      depth: null,
    },
  );
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
