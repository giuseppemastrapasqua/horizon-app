import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildRevenueSignals,
} from "./build-revenue-signals";

describe(
  "buildRevenueSignals",
  () => {
    it(
      "costruisce segnali forti quando mercato e property mostrano pressione positiva",
      () => {
        const result =
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

        expect(
          result.usable,
        ).toBe(true);

        expect(
          result.overallConfidence,
        ).toBeGreaterThanOrEqual(
          70,
        );

        expect(
          result.signals.find(
            (signal) =>
              signal.code ===
              "MARKET_DEMAND",
          )?.strength,
        ).toBe(
          "VERY_HIGH",
        );

        expect(
          result.signals.find(
            (signal) =>
              signal.code ===
              "COMPETITOR_AVAILABILITY",
          )?.strength,
        ).toBe(
          "HIGH",
        );
      },
    );

    it(
      "rifiuta una raccomandazione quando manca il prezzo mercato",
      () => {
        const result =
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
                20,
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

        expect(
          result.usable,
        ).toBe(false);

        expect(
          result.warnings.length,
        ).toBeGreaterThan(
          0,
        );
      },
    );
  },
);
