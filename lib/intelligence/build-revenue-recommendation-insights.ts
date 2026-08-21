import type {
  IntelligenceInsight,
} from "./intelligence-types";

type RevenueRecommendationForIntelligence = {
  coveragePercent: number;

  dailyPrices?: Array<{
    date: string;
    recommendedPrice: number;

    contributions: Array<{
      code: string;
      adjustmentPercent: number;
    }>;

    explanation: string[];
  }>;
};

export function buildRevenueRecommendationInsights({
  propertyId,
  propertyName,
  recommendation,
  currentPrice,
}: {
  propertyId: string;
  propertyName: string;

  recommendation:
    RevenueRecommendationForIntelligence;

  currentPrice:
    number | null;
}): IntelligenceInsight[] {
  const insights:
    IntelligenceInsight[] = [];

  for (
    const day of
    recommendation.dailyPrices ?? []
  ) {
    const gapContribution =
      day.contributions.find(
        (contribution) =>
          contribution.code ===
          "CALENDAR_GAP",
      );

    const hasGapPressure =
      gapContribution !== undefined &&
      gapContribution.adjustmentPercent < 0;

    const priceDeltaPercent =
      currentPrice !== null &&
      currentPrice > 0
        ? (
            (
              day.recommendedPrice -
              currentPrice
            ) /
            currentPrice
          ) *
          100
        : null;

    /*
     * OPPORTUNITÀ CALENDARIO
     *
     * Il Revenue Engine ha già rilevato
     * pressione negativa derivante
     * dal gap del calendario.
     */
    if (hasGapPressure) {
      insights.push({
        id:
          `revenue-gap:${propertyId}:${day.date}`,

        propertyId,
        propertyName,

        category:
          "REVENUE",

        severity:
          "OPPORTUNITY",

        title:
          "Opportunità su disponibilità residua",

        explanation:
          [
            `Horizon ha rilevato una disponibilità che richiede attenzione il ${day.date}.`,
            `Prezzo Revenue consigliato €${day.recommendedPrice}.`,
            ...day.explanation.slice(
              0,
              2,
            ),
          ].join(" "),

        date:
          day.date,

        economicImpact: {
          amount:
            currentPrice !== null
              ? Math.abs(
                  day.recommendedPrice -
                  currentPrice,
                )
              : undefined,

          currency:
            "EUR",

          direction:
            "POSITIVE",
        },

        action: {
          type:
            "REVIEW_PRICE",

          label:
            "Valuta opportunità",

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
          recommendedPrice:
            day.recommendedPrice,

          coveragePercent:
            recommendation.coveragePercent,

          gapAdjustmentPercent:
            gapContribution
              ?.adjustmentPercent ??
            null,
        },
      });

      continue;
    }

    /*
     * VARIAZIONE PREZZO RILEVANTE
     *
     * Mostriamo un insight soltanto
     * quando il Revenue Engine propone
     * una differenza >= 10% rispetto
     * alla tariffa corrente.
     */
    if (
      priceDeltaPercent !== null &&
      Math.abs(
        priceDeltaPercent,
      ) >= 10
    ) {
      insights.push({
        id:
          `revenue-price:${propertyId}:${day.date}`,

        propertyId,
        propertyName,

        category:
          "REVENUE",

        severity:
          Math.abs(
            priceDeltaPercent,
          ) >= 20
            ? "WARNING"
            : "INFO",

        title:
          priceDeltaPercent > 0
            ? "Possibile aumento tariffario"
            : "Prezzo da rivedere",

        explanation:
          [
            `Per il ${day.date} Horizon propone €${day.recommendedPrice}.`,
            `La variazione rispetto alla tariffa corrente è ${priceDeltaPercent > 0 ? "+" : ""}${priceDeltaPercent.toFixed(
              1,
            )}%.`,
            ...day.explanation.slice(
              0,
              2,
            ),
          ].join(" "),

        date:
          day.date,

        economicImpact: {
          amount:
            currentPrice !== null
              ? Math.abs(
                  day.recommendedPrice -
                  currentPrice,
                )
              : undefined,

          currency:
            "EUR",

          direction:
            priceDeltaPercent > 0
              ? "POSITIVE"
              : "UNKNOWN",
        },

        action: {
          type:
            "APPLY_REVENUE_PRICE",

          label:
            "Verifica prezzo",

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
          recommendedPrice:
            day.recommendedPrice,

          priceDeltaPercent:
            Math.round(
              priceDeltaPercent *
                10,
            ) / 10,

          coveragePercent:
            recommendation.coveragePercent,
        },
      });
    }
  }

  /*
   * Evitiamo di riempire la UI:
   * mostriamo solo gli insight
   * più rilevanti del periodo.
   */
  return insights.slice(
    0,
    5,
  );
}
