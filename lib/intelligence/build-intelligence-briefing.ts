import type {
  HorizonIntelligenceBriefing,
  IntelligenceInsight,
} from "./intelligence-types";

export function buildIntelligenceBriefing({
  propertyCount,
  insights,
  now = new Date(),
}: {
  propertyCount: number;
  insights: IntelligenceInsight[];
  now?: Date;
}): HorizonIntelligenceBriefing {
  const orderedInsights =
    [...insights]
      .sort(
        (left, right) => {
          /*
           * 1. Severità
           */
          const severityDifference =
            severityWeight(
              right.severity,
            ) -
            severityWeight(
              left.severity,
            );

          if (
            severityDifference !== 0
          ) {
            return severityDifference;
          }

          /*
           * 2. Impatto economico
           *
           * A parità di severità,
           * portiamo prima gli insight
           * con maggiore valore economico.
           */
          const impactDifference =
            economicImpactWeight(
              right,
            ) -
            economicImpactWeight(
              left,
            );

          if (
            impactDifference !== 0
          ) {
            return impactDifference;
          }

          /*
           * 3. Data
           *
           * Se disponibili, gli insight
           * più recenti vengono prima.
           */
          return (
            insightDateWeight(
              right,
            ) -
            insightDateWeight(
              left,
            )
          );
        },
      )
      .slice(
        0,
        8,
      );

  return {
    generatedAt:
      now.toISOString(),

    portfolio: {
      properties:
        propertyCount,

      totalInsights:
        insights.length,

      criticalInsights:
        insights.filter(
          (insight) =>
            insight.severity ===
            "CRITICAL",
        ).length,

      warnings:
        insights.filter(
          (insight) =>
            insight.severity ===
            "WARNING",
        ).length,

      opportunities:
        insights.filter(
          (insight) =>
            insight.severity ===
            "OPPORTUNITY",
        ).length,
    },

    insights:
      orderedInsights,
  };
}

function severityWeight(
  severity:
    IntelligenceInsight["severity"],
) {
  switch (severity) {
    case "CRITICAL":
      return 4;

    case "WARNING":
      return 3;

    case "OPPORTUNITY":
      return 2;

    case "INFO":
    default:
      return 1;
  }
}

function economicImpactWeight(
  insight: IntelligenceInsight,
) {
  return Math.abs(
    insight.economicImpact
      ?.amount ?? 0,
  );
}

function insightDateWeight(
  insight: IntelligenceInsight,
) {
  if (!insight.date) {
    return 0;
  }

  const timestamp =
    Date.parse(
      insight.date,
    );

  return Number.isNaN(
    timestamp,
  )
    ? 0
    : timestamp;
}
