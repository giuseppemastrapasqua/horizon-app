import {
  buildComparablePositioning,
} from "../lib/revenue/engine/build-comparable-positioning";

function runScenario(
  name: string,
  comparables: Parameters<
    typeof buildComparablePositioning
  >[0]["comparables"],
) {
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

      comparables,
    });

  console.log("");
  console.log(
    "========================================",
  );
  console.log(name);

  console.log({
    usable:
      result.usable,

    comparableCount:
      result.comparableCount,

    comparableReference:
      result.comparableReference,

    positioningFactor:
      result.positioningFactor,

    rationale:
      result.rationale,
  });
}

runScenario(
  "A - COMPETITIVE SET COERENTE",
  [
    {
      adr: 190,
      nightlyPrice: null,
      similarityScore: 92,
      maxGuests: 6,
      bedrooms: 3,
      bathrooms: 2,
    },
    {
      adr: 200,
      nightlyPrice: null,
      similarityScore: 90,
      maxGuests: 6,
      bedrooms: 3,
      bathrooms: 2,
    },
    {
      adr: 210,
      nightlyPrice: null,
      similarityScore: 88,
      maxGuests: 6,
      bedrooms: 3,
      bathrooms: 2,
    },
  ],
);

runScenario(
  "B - SET COERENTE + OUTLIER STRUTTURALE",
  [
    {
      adr: 190,
      nightlyPrice: null,
      similarityScore: 92,
      maxGuests: 6,
      bedrooms: 3,
      bathrooms: 2,
    },
    {
      adr: 200,
      nightlyPrice: null,
      similarityScore: 90,
      maxGuests: 6,
      bedrooms: 3,
      bathrooms: 2,
    },
    {
      adr: 210,
      nightlyPrice: null,
      similarityScore: 88,
      maxGuests: 6,
      bedrooms: 3,
      bathrooms: 2,
    },

    /*
     * Prezzo volutamente estremo.
     * Similarity provider molto alta,
     * ma struttura incompatibile.
     */
    {
      adr: 500,
      nightlyPrice: null,
      similarityScore: 99,
      maxGuests: 2,
      bedrooms: 1,
      bathrooms: 1,
    },
  ],
);

runScenario(
  "C - DIFFERENZA MODERATA",
  [
    {
      adr: 190,
      nightlyPrice: null,
      similarityScore: 92,
      maxGuests: 6,
      bedrooms: 3,
      bathrooms: 2,
    },
    {
      adr: 240,
      nightlyPrice: null,
      similarityScore: 92,
      maxGuests: 6,
      bedrooms: 2,
      bathrooms: 2,
    },
  ],
);

runScenario(
  "D - PROFILO PARZIALMENTE SCONOSCIUTO",
  [
    {
      adr: 190,
      nightlyPrice: null,
      similarityScore: 92,
      maxGuests: 6,
      bedrooms: 3,
      bathrooms: 2,
    },
    {
      adr: 220,
      nightlyPrice: null,
      similarityScore: 90,
      maxGuests: 6,
      bedrooms: null,
      bathrooms: null,
    },
  ],
);
