import {
  buildRevenueNightContext,
  buildRevenueNightContextInternal,
} from "./build-revenue-night-context";

import {
  buildRevenueSignals,
} from "./build-revenue-signals";

import {
  buildRevenuePricingDecision,
} from "./build-revenue-pricing-decision";

import { requirePropertyAccess } from "@/lib/auth/guards";

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
  await requirePropertyAccess(propertyId);

  return buildPropertyRevenueRecommendationInternal({
    propertyId,
    date,
    strategy,
  });
}

export async function buildPropertyRevenueRecommendationInternal({
  propertyId,
  date,
  strategy,
}: {
  propertyId: string;
  date: Date;
  strategy: RevenueStrategy;
}) {
  const context =
    await buildRevenueNightContextInternal(
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
