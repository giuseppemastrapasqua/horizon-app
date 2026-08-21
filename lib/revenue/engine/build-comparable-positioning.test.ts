import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildComparablePositioning,
} from "./build-comparable-positioning";

describe(
  "buildComparablePositioning",
  () => {
    it(
      "aumenta il posizionamento quando i comparables valgono più del mercato",
      () => {
        const result =
          buildComparablePositioning({
            marketReference:
              200,

            comparables: [
              {
                adr:
                  220,

                nightlyPrice:
                  null,

                similarityScore:
                  95,
              },
              {
                adr:
                  230,

                nightlyPrice:
                  null,

                similarityScore:
                  90,
              },
            ],
          });

        expect(
          result.usable,
        ).toBe(true);

        expect(
          result.comparableReference,
        ).toBeGreaterThan(
          200,
        );

        expect(
          result.positioningFactor,
        ).toBeGreaterThan(
          1,
        );
      },
    );

    it(
      "limita il posizionamento massimo al 15 percento",
      () => {
        const result =
          buildComparablePositioning({
            marketReference:
              100,

            comparables: [
              {
                adr:
                  200,

                nightlyPrice:
                  null,

                similarityScore:
                  95,
              },
            ],
          });

        expect(
          result.positioningFactor,
        ).toBe(1.15);
      },
    );

    it(
      "ignora comparables con similarità troppo bassa",
      () => {
        const result =
          buildComparablePositioning({
            marketReference:
              200,

            comparables: [
              {
                adr:
                  400,

                nightlyPrice:
                  null,

                similarityScore:
                  30,
              },
            ],
          });

        expect(
          result.usable,
        ).toBe(false);

        expect(
          result.positioningFactor,
        ).toBe(1);
      },
    );

    it(
      "non modifica la baseline quando manca il mercato",
      () => {
        const result =
          buildComparablePositioning({
            marketReference:
              null,

            comparables: [
              {
                adr:
                  220,

                nightlyPrice:
                  null,

                similarityScore:
                  90,
              },
            ],
          });

        expect(
          result.usable,
        ).toBe(true);

        expect(
          result.positioningFactor,
        ).toBe(1);
      },
    );

    it(
      "mantiene pieno peso per un comparable con profilo identico",
      () => {
        const result =
          buildComparablePositioning({
            marketReference:
              200,

            propertyProfile: {
              maxGuests:
                4,

              bedrooms:
                2,

              bathrooms:
                1,
            },

            comparables: [
              {
                adr:
                  220,

                nightlyPrice:
                  null,

                similarityScore:
                  90,

                maxGuests:
                  4,

                bedrooms:
                  2,

                bathrooms:
                  1,
              },
            ],
          });

        expect(
          result.usable,
        ).toBe(true);

        expect(
          result.comparableCount,
        ).toBe(1);

        expect(
          result.comparableReference,
        ).toBe(220);
      },
    );

    it(
      "riduce il peso di un comparable con una camera differente",
      () => {
        const withProfile =
          buildComparablePositioning({
            marketReference:
              200,

            propertyProfile: {
              maxGuests:
                4,

              bedrooms:
                2,

              bathrooms:
                1,
            },

            comparables: [
              {
                adr:
                  180,

                nightlyPrice:
                  null,

                similarityScore:
                  90,

                maxGuests:
                  4,

                bedrooms:
                  2,

                bathrooms:
                  1,
              },
              {
                adr:
                  260,

                nightlyPrice:
                  null,

                similarityScore:
                  90,

                maxGuests:
                  4,

                bedrooms:
                  1,

                bathrooms:
                  1,
              },
            ],
          });

        const withoutProfile =
          buildComparablePositioning({
            marketReference:
              200,

            comparables: [
              {
                adr:
                  180,

                nightlyPrice:
                  null,

                similarityScore:
                  90,

                maxGuests:
                  4,

                bedrooms:
                  2,

                bathrooms:
                  1,
              },
              {
                adr:
                  260,

                nightlyPrice:
                  null,

                similarityScore:
                  90,

                maxGuests:
                  4,

                bedrooms:
                  1,

                bathrooms:
                  1,
              },
            ],
          });

        expect(
          withProfile.comparableReference,
        ).toBeLessThan(
          withoutProfile
            .comparableReference ??
            Infinity,
        );
      },
    );

    it(
      "esclude un comparable strutturalmente troppo distante",
      () => {
        const result =
          buildComparablePositioning({
            marketReference:
              200,

            propertyProfile: {
              maxGuests:
                6,

              bedrooms:
                3,

              bathrooms:
                2,
            },

            comparables: [
              {
                adr:
                  210,

                nightlyPrice:
                  null,

                similarityScore:
                  90,

                maxGuests:
                  6,

                bedrooms:
                  3,

                bathrooms:
                  2,
              },
              {
                adr:
                  400,

                nightlyPrice:
                  null,

                similarityScore:
                  95,

                maxGuests:
                  2,

                bedrooms:
                  1,

                bathrooms:
                  1,
              },
            ],
          });

        expect(
          result.usable,
        ).toBe(true);

        expect(
          result.comparableCount,
        ).toBe(1);

        expect(
          result.comparableReference,
        ).toBe(210);
      },
    );

    it(
      "non penalizza campi strutturali mancanti",
      () => {
        const result =
          buildComparablePositioning({
            marketReference:
              200,

            propertyProfile: {
              maxGuests:
                4,

              bedrooms:
                2,

              bathrooms:
                1,
            },

            comparables: [
              {
                adr:
                  220,

                nightlyPrice:
                  null,

                similarityScore:
                  90,

                maxGuests:
                  4,

                bedrooms:
                  null,

                bathrooms:
                  null,
              },
            ],
          });

        expect(
          result.usable,
        ).toBe(true);

        expect(
          result.comparableCount,
        ).toBe(1);

        expect(
          result.comparableReference,
        ).toBe(220);
      },
    );  },
);

