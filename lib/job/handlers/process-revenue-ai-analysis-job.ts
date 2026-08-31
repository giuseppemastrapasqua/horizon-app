import type {
  BackgroundJob,
  Prisma,
} from "@prisma/client";

import {
  prisma,
} from "@/lib/prisma";

import {
  createRevenueMarketProvider,
} from "@/lib/revenue/providers/create-revenue-market-provider";

import {
  syncRevenueMarketData,
} from "@/lib/revenue/sync-revenue-market-data";

import {
  buildPropertyRevenueRecommendationInternal,
} from "@/lib/revenue/engine/build-property-revenue-recommendation";

import type {
  RevenueStrategy,
} from "@/lib/revenue/engine/revenue-engine-types";

type RevenueAiAnalysisPayload = {
  propertyId: string;
  date: string;
  strategy: RevenueStrategy;
};

function isJsonObject(
  value: Prisma.JsonValue,
): value is Prisma.JsonObject {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function readRequiredString(
  payload: Prisma.JsonObject,
  key: keyof RevenueAiAnalysisPayload,
): string {
  const value = payload[key];

  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(
      `Il payload del job REVENUE_AI_ANALYSIS deve contenere "${key}".`,
    );
  }

  return value.trim();
}

function parseStrategy(
  value: string,
): RevenueStrategy {
  if (
    value !== "OCCUPANCY" &&
    value !== "BALANCED" &&
    value !== "ADR"
  ) {
    throw new Error(
      `Strategia Revenue non valida: ${value}.`,
    );
  }

  return value;
}

function parsePayload(
  payload: Prisma.JsonValue,
): RevenueAiAnalysisPayload {
  if (!isJsonObject(payload)) {
    throw new Error(
      "Il payload del job REVENUE_AI_ANALYSIS non Ã¨ un oggetto JSON valido.",
    );
  }

  const date = readRequiredString(
    payload,
    "date",
  );

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    throw new Error(
      `Data Revenue non valida: ${date}.`,
    );
  }

  return {
    propertyId:
      readRequiredString(
        payload,
        "propertyId",
      ),

    date,

    strategy:
      parseStrategy(
        readRequiredString(
          payload,
          "strategy",
        ),
      ),
  };
}

export async function processRevenueAiAnalysisJob(
  job: BackgroundJob,
): Promise<void> {
  if (
    job.type !==
    "REVENUE_AI_ANALYSIS"
  ) {
    throw new Error(
      `Tipo di job non supportato dall'handler Revenue AI: ${job.type}.`,
    );
  }

  const payload =
    parsePayload(
      job.payload,
    );

  const date =
    new Date(
      payload.date,
    );

  const property =
    await prisma.property.findUnique({
      where: {
        id: payload.propertyId,
      },

      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        zone: true,
        maxGuests: true,
        bedrooms: true,
        bathrooms: true,
      },
    });

  if (!property) {
    throw new Error(
      `Property ${payload.propertyId} non trovata.`,
    );
  }

  const provider =
    createRevenueMarketProvider();

  const syncResult =
    await syncRevenueMarketData({
      provider,

      query: {
        propertyId:
          property.id,

        location: {
          city:
            property.city,

          zone:
            property.zone,
        },

        property: {
          maxGuests:
            property.maxGuests,

          bedrooms:
            property.bedrooms,

          bathrooms:
            property.bathrooms,
        },

        startDate:
          date,

        endDate:
          date,
      },
    });

  const decision =
    await buildPropertyRevenueRecommendationInternal({
      propertyId:
        property.id,

      date,

      strategy:
        payload.strategy,
    });

  await prisma.revenueRecommendation.create({
    data: {
      propertyId:
        property.id,

      date:
        decision.date,

      marketSnapshotId:
        syncResult.snapshotId,

      strategy:
        payload.strategy,

      status:
        "GENERATED",

      currency:
        "EUR",

      recommendedPrice:
        decision.recommendedPrice,

      lowPrice:
        decision.recommendedRange.min,

      highPrice:
        decision.recommendedRange.max,

      confidence:
        decision.confidence,

      rationale:
        decision.explanation.join(
          "\n",
        ),

      factors:
        {
          marketReference:
            decision.marketReference,

          adjustmentPercent:
            decision.adjustmentPercent,

          contributions:
            decision.contributions,

          signals:
            decision.signals,
        },

      engineVersion:
        "revenue-engine-v1",
    },
  });
}
