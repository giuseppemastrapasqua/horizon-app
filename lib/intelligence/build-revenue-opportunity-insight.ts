import type {
  IntelligenceInsight,
} from "./intelligence-types";

export function buildRevenueOpportunityInsight({
  propertyId,
  propertyName,
  date,
  currentPrice,
  recommendedPrice,
  confidence,
  gapNights,
}: {
  propertyId: string;
  propertyName: string;

  date: string;

  currentPrice:
    number | null;

  recommendedPrice: number;

  confidence: number;

  gapNights:
    number | null;
}): IntelligenceInsight | null {
  /*
   * Prima versione deterministica.
   *
   * Non utilizziamo ancora un LLM:
   * Horizon deve prima sapere
   * identificare autonomamente
   * un'opportunità.
   */

  if (
    confidence < 60
  ) {
    return null;
  }

  const isShortGap =
    gapNights !== null &&
    gapNights <= 2;

  if (!isShortGap) {
    return null;
  }

  const difference =
    currentPrice === null
      ? null
      : recommendedPrice -
        currentPrice;

  return {
    id:
      [
        "revenue-gap",
        propertyId,
        date,
      ].join(":"),

    propertyId,
    propertyName,

    category:
      "REVENUE",

    severity:
      "OPPORTUNITY",

    title:
      "Opportunità su notte libera",

    explanation:
      gapNights === 1
        ? `Horizon ha rilevato una notte isolata nel calendario di ${propertyName}.`
        : `Horizon ha rilevato un gap di ${gapNights} notti nel calendario di ${propertyName}.`,

    date,

    confidence,

    economicImpact: {
      amount:
        difference === null
          ? undefined
          : Math.abs(
              difference,
            ),

      currency:
        "EUR",

      direction:
        "POSITIVE",
    },

    action: {
      type:
        "REVIEW_PRICE",

      label:
        "Analizza opportunità",

      propertyId,

      href:
        `/calendar?propertyId=${encodeURIComponent(
          propertyId,
        )}`,

      requiresApproval:
        true,
    },

    metadata: {
      currentPrice,
      recommendedPrice,
      gapNights,
    },
  };
}
