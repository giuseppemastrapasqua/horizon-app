import {
  buildIntelligenceBriefing,
} from "./build-intelligence-briefing";

import type {
  HorizonIntelligenceBriefing,
  IntelligenceInsight,
} from "./intelligence-types";

export type PropertyIntelligenceInput = {
  propertyId: string;
  propertyName: string;

  insights:
    IntelligenceInsight[];
};

export function buildPortfolioIntelligence({
  properties,
  now = new Date(),
}: {
  properties:
    PropertyIntelligenceInput[];

  now?: Date;
}): HorizonIntelligenceBriefing {
  const insights =
    properties.flatMap(
      (property) =>
        property.insights,
    );

  return buildIntelligenceBriefing({
    propertyCount:
      properties.length,

    insights,

    now,
  });
}
