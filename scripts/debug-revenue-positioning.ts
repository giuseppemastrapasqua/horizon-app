import { prisma } from "../lib/prisma";

import {
  getPropertyRevenueData,
} from "../lib/revenue/get-property-revenue-data";

import {
  buildComparablePositioning,
} from "../lib/revenue/engine/build-comparable-positioning";

import {
  buildRevenueSignals,
} from "../lib/revenue/engine/build-revenue-signals";

import {
  buildRevenuePricingDecision,
} from "../lib/revenue/engine/build-revenue-pricing-decision";

async function main() {
  const properties =
    await prisma.property.findMany({
      select: {
        id: true,
        name: true,
        city: true,
        zone: true,
        maxGuests: true,
        bedrooms: true,
        bathrooms: true,
      },

      orderBy: {
        name: "asc",
      },
    });

  /*
   * Testiamo una settimana.
   * Le date servono solo per il debug:
   * il motore rimane valido per tutto l'anno.
   */
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
    "===== REVENUE POSITIONING =====",
  );

  for (
    const property of
      properties
  ) {
    const revenueData =
      await getPropertyRevenueData({
        propertyId:
          property.id,

        startDate,
        endDate,
      });

    console.log("");
    console.log(
      "========================================",
    );

    console.log({
      property:
        property.name,

      city:
        property.city,

      zone:
        property.zone,

      maxGuests:
        property.maxGuests,

      bedrooms:
        property.bedrooms,

      bathrooms:
        property.bathrooms,

      days:
        revenueData.days.length,

      comparables:
        revenueData.comparables.length,
    });

    if (
      revenueData.days.length === 0
    ) {
      console.log(
        "NESSUN DATO GIORNALIERO",
      );

      continue;
    }

    for (
      const day of
        revenueData.days
    ) {
      const positioning =
        buildComparablePositioning({
          marketReference:
            day.marketMedianPrice,

          comparables:
            revenueData.comparables,
        });

      const positionedMarketPrice =
        day.marketMedianPrice ===
          null
          ? null
          : Math.round(
              day.marketMedianPrice *
                positioning.positioningFactor,
            );

      const signalSet =
        buildRevenueSignals({
          propertyId:
            property.id,

          date:
            new Date(
              day.date,
            ),

          market: {
            medianPrice:
              positionedMarketPrice,

            occupancy:
              day.marketOccupancy,

            demandIndex:
              day.demandIndex,

            competitorAvailability:
              day.competitorAvailability,

            confidence:
              day.confidence,
          },

          property: {
            occupancy:
              day.propertyOccupancy,

            bookingPace:
              day.bookingPace,

            maxGuests:
              property.maxGuests,

            bedrooms:
              property.bedrooms,

            bathrooms:
              property.bathrooms,

            city:
              property.city,

            zone:
              property.zone,
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
              day.eventScore,
          },
        });

      if (
        !signalSet.usable
      ) {
        console.log({
          date:
            day.date.slice(
              0,
              10,
            ),

          status:
            "DATI INSUFFICIENTI",
        });

        continue;
      }

      const decision =
        buildRevenuePricingDecision({
          signalSet,

          strategy:
            "BALANCED",
        });

      console.log({
        date:
          day.date.slice(
            0,
            10,
          ),

        market:
          day.marketMedianPrice,

        comparableReference:
          positioning.comparableReference,

        positioningPercent:
          Math.round(
            (
              positioning.positioningFactor -
              1
            ) *
              1000,
          ) / 10,

        positionedMarket:
          positionedMarketPrice,

        aiPrice:
          decision.recommendedPrice,

        adjustment:
          decision.adjustmentPercent,

        confidence:
          decision.confidence,

        comparablesUsed:
          positioning.comparableCount,
      });
    }
  }
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
