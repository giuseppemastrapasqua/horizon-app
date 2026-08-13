import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildRevenueSuggestions,
} from "./build-revenue-suggestions";

describe(
  "buildRevenueSuggestions",
  () => {
    it(
      "genera tre scenari coerenti",
      () => {
        const result =
          buildRevenueSuggestions({
            currentNightlyPrice:
              180,

            occupancyRate:
              60,

            freeNights:
              12,

            selectedNights:
              5,

            currentMinimumStay:
              2,
          });

        expect(
          result.aggressive
            .nightlyPrice,
        ).toBeGreaterThan(
          result.balanced
            .nightlyPrice,
        );

        expect(
          result.occupancy
            .nightlyPrice,
        ).toBeLessThan(
          result.balanced
            .nightlyPrice,
        );

        expect(
          result.balanced
            .minimumStay,
        ).toBeGreaterThanOrEqual(
          1,
        );
      },
    );

    it(
      "limita il minimum stay alla durata del periodo",
      () => {
        const result =
          buildRevenueSuggestions({
            currentNightlyPrice:
              180,

            occupancyRate:
              90,

            freeNights:
              3,

            selectedNights:
              2,

            currentMinimumStay:
              5,
          });

        expect(
          result.aggressive
            .minimumStay,
        ).toBeLessThanOrEqual(
          2,
        );

        expect(
          result.balanced
            .minimumStay,
        ).toBeLessThanOrEqual(
          2,
        );
      },
    );

    it(
      "rifiuta input non validi",
      () => {
        expect(() =>
          buildRevenueSuggestions({
            currentNightlyPrice:
              0,

            occupancyRate:
              50,

            freeNights:
              10,

            selectedNights:
              3,

            currentMinimumStay:
              2,
          }),
        ).toThrow(
          "Il prezzo base deve essere maggiore di zero.",
        );
      },
    );
  },
);

