import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildRevenueSignals,
} from "./build-revenue-signals";

import {
  buildRevenuePricingDecision,
} from "./build-revenue-pricing-decision";

describe(
  "buildRevenuePricingDecision",
  () => {
    const signals =
      buildRevenueSignals({
        propertyId:
          "property-1",

        date:
          new Date(
            "2026-09-15T00:00:00.000Z",
          ),

        market: {
          medianPrice:
            215,

          occupancy:
            82,

          demandIndex:
            0.86,

          competitorAvailability:
            8,

          confidence:
            90,
        },

        property: {
          occupancy:
            78,

          bookingPace:
            1.18,
        },

        calendar: {
          leadTimeDays:
            20,

          gapBeforeNights:
            4,

          gapAfterNights:
            3,
        },

        event: {
          score:
            null,
        },
      });

    it(
      "usa il mercato come riferimento e non un prezzo manuale",
      () => {
        const result =
          buildRevenuePricingDecision({
            signalSet:
              signals,

            strategy:
              "BALANCED",
          });

        expect(
          result.marketReference,
        ).toBe(215);

        expect(
          result.recommendedPrice,
        ).toBeGreaterThan(0);

        expect(
          result.confidence,
        ).toBeGreaterThanOrEqual(
          70,
        );
      },
    );

    it(
      "ordina Occupancy, Balanced e ADR in modo coerente con mercato positivo",
      () => {
        const occupancy =
          buildRevenuePricingDecision({
            signalSet:
              signals,

            strategy:
              "OCCUPANCY",
          });

        const balanced =
          buildRevenuePricingDecision({
            signalSet:
              signals,

            strategy:
              "BALANCED",
          });

        const adr =
          buildRevenuePricingDecision({
            signalSet:
              signals,

            strategy:
              "ADR",
          });

        expect(
          occupancy.recommendedPrice,
        ).toBeLessThan(
          balanced.recommendedPrice,
        );

        expect(
          balanced.recommendedPrice,
        ).toBeLessThan(
          adr.recommendedPrice,
        );
      },
    );

    it(
      "rifiuta dati non affidabili",
      () => {
        const unusableSignals =
          buildRevenueSignals({
            propertyId:
              "property-1",

            date:
              new Date(),

            market: {
              medianPrice:
                null,

              occupancy:
                null,

              demandIndex:
                null,

              competitorAvailability:
                null,

              confidence:
                10,
            },

            property: {
              occupancy:
                null,

              bookingPace:
                null,
            },

            calendar: {
              leadTimeDays:
                null,

              gapBeforeNights:
                null,

              gapAfterNights:
                null,
            },

            event: {
              score:
                null,
            },
          });

        expect(() =>
          buildRevenuePricingDecision({
            signalSet:
              unusableSignals,

            strategy:
              "BALANCED",
          }),
        ).toThrow(
          "Dati insufficienti",
        );
      },
    );
  },
);
