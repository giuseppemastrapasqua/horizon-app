import {
  buildRevenueNightContext,
} from "./build-revenue-night-context";

import {
  buildRevenueSignals,
} from "./build-revenue-signals";

import {
  buildRevenuePricingDecision,
} from "./build-revenue-pricing-decision";

import type {
  RevenueStrategy,
} from "./revenue-engine-types";

export async function buildPropertyRevenueRecommendation({
  propertyId,
  date,
  strategy,
}: {
  propertyId: string;
  date: Date;
  strategy: RevenueStrategy;
}) {
  const context =
    await buildRevenueNightContext(
      propertyId,
      date,
    );

  const signals =
    buildRevenueSignals(
      context,
    );

  return buildRevenuePricingDecision({
    signalSet:
      signals,

    strategy,
  });
}
