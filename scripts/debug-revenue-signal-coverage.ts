import { prisma } from "../lib/prisma";

import {
  getPropertyRevenueData,
} from "../lib/revenue/get-property-revenue-data";

async function main() {
  const properties =
    await prisma.property.findMany({
      select: {
        id: true,
        name: true,
      },

      orderBy: {
        name: "asc",
      },
    });

  const startDate =
    new Date(
      "2026-08-01T00:00:00.000Z",
    );

  const endDate =
    new Date(
      "2026-08-31T23:59:59.999Z",
    );

  console.log("");
  console.log(
    "===== REVENUE SIGNAL COVERAGE =====",
  );

  for (
    const property of
      properties
  ) {
    const data =
      await getPropertyRevenueData({
        propertyId:
          property.id,

        startDate,
        endDate,
      });

    const days =
      data.days;

    const count =
      (
        selector: (
          day: (typeof days)[number],
        ) => unknown,
      ) =>
        days.filter(
          (day) =>
            selector(day) !== null &&
            selector(day) !== undefined,
        ).length;

    console.log("");
    console.log(
      "--------------------------------",
    );

    console.log(
      property.name,
    );

    console.log({
      totalDays:
        days.length,

      marketPrice:
        count(
          (day) =>
            day.marketMedianPrice,
        ),

      marketOccupancy:
        count(
          (day) =>
            day.marketOccupancy,
        ),

      demand:
        count(
          (day) =>
            day.demandIndex,
        ),

      competitorAvailability:
        count(
          (day) =>
            day.competitorAvailability,
        ),

      propertyOccupancy:
        count(
          (day) =>
            day.propertyOccupancy,
        ),

      bookingPace:
        count(
          (day) =>
            day.bookingPace,
        ),

      leadTime:
        count(
          (day) =>
            day.leadTimeDays,
        ),

      gapBefore:
        count(
          (day) =>
            day.gapBeforeNights,
        ),

      gapAfter:
        count(
          (day) =>
            day.gapAfterNights,
        ),

      eventScore:
        count(
          (day) =>
            day.eventScore,
        ),

      confidence:
        count(
          (day) =>
            day.confidence,
        ),
    });
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
