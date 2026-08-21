import type {
  RevenuePricingDecision,
} from "@/lib/revenue/engine/revenue-engine-types";

import type {
  IntelligenceInsight,
} from "./intelligence-types";

export function buildRevenueDecisionInsight({
  propertyId,
  propertyName,
  decision,
  currentPrice,
}: {
  propertyId: string;
  propertyName: string;

  decision: RevenuePricingDecision;

  currentPrice:
    number | null;
}): IntelligenceInsight | null {
  if (
    decision.confidence < 60
  ) {
    return null;
  }

  const gapSignal =
    decision.signals.signals.find(
      (signal) =>
        signal.code ===
        "CALENDAR_GAP",
    );

  const gapNights =
    typeof gapSignal?.value ===
    "number"
      ? gapSignal.value
      : null;

  const isShortGap =
    gapNights !== null &&
    gapNights <= 2;

  const absoluteAdjustment =
    Math.abs(
      decision.adjustmentPercent,
    );

  /*
   * Un insight viene generato quando:
   *
   * - esiste un gap breve nel calendario
   * oppure
   * - la raccomandazione differisce
   *   in modo significativo dal mercato.
   */
  if (
    !isShortGap &&
    absoluteAdjustment < 5
  ) {
    return null;
  }

  const priceDelta =
    currentPrice === null
      ? null
      : decision.recommendedPrice -
        currentPrice;

  const severity =
    isShortGap
      ? "OPPORTUNITY"
      : absoluteAdjustment >= 15
        ? "WARNING"
        : "INFO";

  const primaryExplanation =
    decision.explanation
      .slice(0, 3)
      .join(" ");

  return {
    id:
      [
        "revenue-decision",
        propertyId,
        dateKey(
          decision.date,
        ),
      ].join(":"),

    propertyId,
    propertyName,

    category:
      "REVENUE",

    severity,

    title:
      isShortGap
        ? "Opportunità su disponibilità residua"
        : "Variazione tariffaria consigliata",

    explanation:
      [
        isShortGap
          ? `Horizon ha rilevato un gap di ${gapNights} notte${gapNights === 1 ? "" : "i"} nel calendario.`
          : null,

        `Prezzo mercato €${decision.marketReference}.`,

        `Prezzo consigliato €${decision.recommendedPrice}.`,

        primaryExplanation ||
          null,
      ]
        .filter(Boolean)
        .join(" "),

    date:
      dateKey(
        decision.date,
      ),

    confidence:
      decision.confidence,

    economicImpact: {
      amount:
        priceDelta === null
          ? undefined
          : Math.abs(
              priceDelta,
            ),

      currency:
        "EUR",

      direction:
        priceDelta === null
          ? "UNKNOWN"
          : priceDelta >= 0
            ? "POSITIVE"
            : "NEGATIVE",
    },

    action: {
      type:
        isShortGap
          ? "REVIEW_PRICE"
          : "APPLY_REVENUE_PRICE",

      label:
        isShortGap
          ? "Analizza opportunità"
          : "Verifica prezzo AI",

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

      marketReference:
        decision.marketReference,

      recommendedPrice:
        decision.recommendedPrice,

      adjustmentPercent:
        decision.adjustmentPercent,

      strategy:
        decision.strategy,

      gapNights,
    },
  };
}

function dateKey(
  date: Date,
) {
  return date
    .toISOString()
    .slice(0, 10);
}
