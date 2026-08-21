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
      "2026-08-19T00:00:00.000Z",
    );

  const endDate =
    new Date(
      "2026-08-25T23:59:59.999Z",
    );

  console.log("");
  console.log(
    "===== REVENUE SIGNAL VALUES =====",
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

    console.log("");
    console.log(
      "--------------------------------",
    );

    console.log(
      property.name,
    );

    for (
      const day of
        data.days
    ) {
      console.log({
        date:
          day.date.slice(
            0,
            10,
          ),

        propertyOccupancy:
          day.propertyOccupancy,

        bookingPace:
          day.bookingPace,

        leadTimeDays:
          day.leadTimeDays,

        gapBefore:
          day.gapBeforeNights,

        gapAfter:
          day.gapAfterNights,

        demand:
          day.demandIndex,

        event:
          day.eventScore,
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
