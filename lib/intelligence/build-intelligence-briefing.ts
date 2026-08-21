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
    [...insights].sort(
      (left, right) =>
        severityWeight(right.severity) -
        severityWeight(left.severity),
    );

  return {
    generatedAt:
      now.toISOString(),

    portfolio: {
      properties:
        propertyCount,

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
