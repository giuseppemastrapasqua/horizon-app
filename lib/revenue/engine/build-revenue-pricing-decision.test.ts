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
    it(
      "mantiene coerenti contributi economici e aggiustamento finale",
      () => {
        const signals =
          buildRevenueSignals({
            propertyId:
              "property-explainability",

            date:
              new Date(
                "2026-08-21T00:00:00.000Z",
              ),

            market: {
              medianPrice:
                200,

              occupancy:
                82,

              demandIndex:
                88,

              competitorAvailability:
                8,

              confidence:
                95,
            },

            property: {
              occupancy:
                78,

              bookingPace:
                82,
            },

            calendar: {
              leadTimeDays:
                14,

              gapBeforeNights:
                2,

              gapAfterNights:
                3,
            },

            event: {
              score:
                80,
            },
          });

        const result =
          buildRevenuePricingDecision({
            signalSet:
              signals,

            strategy:
              "BALANCED",
          });

        const signalContributions =
          result.contributions.filter(
            (item) =>
              item.code !==
              "STRATEGY",
          );

        const rawPressure =
          signalContributions.reduce(
            (
              total,
              item,
            ) =>
              total +
              item.contribution,
            0,
          );

        const expectedAdjustmentPercent =
          Math.round(
            rawPressure *
              20 *
              10,
          ) /
          10;

        expect(
          result.contributions.length,
        ).toBe(9);

        expect(
          result.contributions.find(
            (item) =>
              item.code ===
              "STRATEGY",
          )?.contribution,
        ).toBe(0);

        expect(
          result.adjustmentPercent,
        ).toBe(
          expectedAdjustmentPercent,
        );
      },
    );

    it(
      "produce contributi nulli quando i driver sono neutrali",
      () => {
        const signals =
          buildRevenueSignals({
            propertyId:
              "property-neutral",

            date:
              new Date(
                "2026-08-21T00:00:00.000Z",
              ),

            market: {
              medianPrice:
                200,

              occupancy:
                50,

              demandIndex:
                50,

              competitorAvailability:
                25,

              confidence:
                95,
            },

            property: {
              occupancy:
                50,

              bookingPace:
                0.75,
            },

            calendar: {
              leadTimeDays:
                30,

              gapBeforeNights:
                4,

              gapAfterNights:
                4,
            },

            event: {
              score:
                50,
            },
          });

        const result =
          buildRevenuePricingDecision({
            signalSet:
              signals,

            strategy:
              "BALANCED",
          });

        const economicDrivers =
          result.contributions.filter(
            (item) =>
              item.code !==
              "STRATEGY",
          );

        expect(
          economicDrivers.every(
            (item) =>
              item.contribution ===
              0,
          ),
        ).toBe(true);

        expect(
          result.adjustmentPercent,
        ).toBe(0);

        expect(
          result.recommendedPrice,
        ).toBe(200);
      },
    );
    it(
      "spiega il prezzo usando gli impatti economici reali",
      () => {
        const signals =
          buildRevenueSignals({
            propertyId:
              "property-explanation",

            date:
              new Date(
                "2026-08-21T00:00:00.000Z",
              ),

            market: {
              medianPrice:
                200,

              occupancy:
                85,

              demandIndex:
                90,

              competitorAvailability:
                5,

              confidence:
                95,
            },

            property: {
              occupancy:
                80,

              bookingPace:
                85,
            },

            calendar: {
              leadTimeDays:
                20,

              gapBeforeNights:
                4,

              gapAfterNights:
                4,
            },

            event: {
              score:
                80,
            },
          });

        const result =
          buildRevenuePricingDecision({
            signalSet:
              signals,

            strategy:
              "BALANCED",
          });

        expect(
          result.explanation.some(
            (text) =>
              text.includes(
                "% sul prezzo",
              ),
          ),
        ).toBe(true);

        expect(
          result.explanation.some(
            (text) =>
              text.includes(
                "Strategia Balanced",
              ),
          ),
        ).toBe(true);
      },
    );
  },
);



