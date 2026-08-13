import {
  prisma,
} from "../lib/prisma";

import {
  buildRevenueSignals,
} from "../lib/revenue/engine/build-revenue-signals";

import {
  buildRevenuePricingDecision,
} from "../lib/revenue/engine/build-revenue-pricing-decision";

const propertyId =
  "cms4dant60001d9b4aj0dd92e";

async function main() {
  const day =
    await prisma.revenueDailySignal.findFirst({
      where: {
        propertyId,

        date:
          new Date(
            "2026-11-01T00:00:00.000Z",
          ),
      },

      orderBy: {
        capturedAt:
          "desc",
      },
    });

  if (!day) {
    throw new Error(
      "RevenueDailySignal del 01/11/2026 non trovato.",
    );
  }

  const signalSet =
    buildRevenueSignals({
      propertyId,

      date:
        day.date,

      market: {
        medianPrice:
          day.marketMedianPrice === null
            ? null
            : Number(
                day.marketMedianPrice,
              ),

        occupancy:
          day.marketOccupancy === null
            ? null
            : Number(
                day.marketOccupancy,
              ),

        demandIndex:
          day.demandIndex === null
            ? null
            : Number(
                day.demandIndex,
              ),

        competitorAvailability:
          day.competitorAvailability,

        confidence:
          day.confidence === null
            ? null
            : Number(
                day.confidence,
              ),
      },

      property: {
        occupancy:
          day.propertyOccupancy === null
            ? null
            : Number(
                day.propertyOccupancy,
              ),

        bookingPace:
          day.bookingPace === null
            ? null
            : Number(
                day.bookingPace,
              ),
      },

      calendar: {
        leadTimeDays:
          day.leadTimeDays,

        gapBeforeNights:
          day.gapBeforeNights,

        gapAfterNights:
          day.gapAfterNights,
      },

      event: {
        score:
          day.eventScore === null
            ? null
            : Number(
                day.eventScore,
              ),
      },
    });

  console.log("");
  console.log(
    "===== SIGNAL SET =====",
  );

  console.dir(
    signalSet,
    {
      depth: null,
    },
  );

  console.log("");
  console.log(
    "===== USABLE =====",
  );

  console.log({
    usable:
      signalSet.usable,

    overallConfidence:
      signalSet.overallConfidence,
  });

  console.log("");
  console.log(
    "===== DECISION =====",
  );

  if (!signalSet.usable) {
    console.log(
      "NESSUNA DECISIONE: signalSet.usable = false",
    );

    return;
  }

  try {
    const decision =
      buildRevenuePricingDecision({
        signalSet,
        strategy:
          "BALANCED",
      });

    console.dir(
      decision,
      {
        depth: null,
      },
    );
  } catch (error) {
    console.error(
      "ERRORE DECISION:",
      error,
    );
  }
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
