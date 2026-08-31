import type {
  BackgroundJob,
  Prisma,
} from "@prisma/client";

import { describe, expect, it, vi } from "vitest";

import {
  processRevenueAiAnalysisJob,
} from "./process-revenue-ai-analysis-job";

const {
  buildRecommendationMock,
  propertyFindUniqueMock,
  revenueRecommendationCreateMock,
  createProviderMock,
  syncRevenueMarketDataMock,
} = vi.hoisted(() => ({
  buildRecommendationMock: vi.fn(),
  propertyFindUniqueMock: vi.fn(),
  revenueRecommendationCreateMock:
    vi.fn(),
  createProviderMock: vi.fn(),
  syncRevenueMarketDataMock:
    vi.fn(),
}));

vi.mock(
  "@/lib/revenue/engine/build-property-revenue-recommendation",
  () => ({
    buildPropertyRevenueRecommendationInternal:
      buildRecommendationMock,
  }),
);

vi.mock(
  "@/lib/prisma",
  () => ({
    prisma: {
      property: {
        findUnique:
          propertyFindUniqueMock,
      },
      revenueRecommendation: {
        create:
          revenueRecommendationCreateMock,
      },
    },
  }),
);

vi.mock(
  "@/lib/revenue/providers/create-revenue-market-provider",
  () => ({
    createRevenueMarketProvider:
      createProviderMock,
  }),
);

vi.mock(
  "@/lib/revenue/sync-revenue-market-data",
  () => ({
    syncRevenueMarketData:
      syncRevenueMarketDataMock,
  }),
);

describe(
  "processRevenueAiAnalysisJob",
  () => {
    it(
      "rifiuta un tipo di job diverso da REVENUE_AI_ANALYSIS",
      async () => {
        const job =
          createBackgroundJob({
            type: "BOOKING_SYNC",
            payload: {
              propertyId:
                "property-1",
              date:
                "2026-08-29",
              strategy:
                "BALANCED",
            },
          });

        await expect(
          processRevenueAiAnalysisJob(
            job,
          ),
        ).rejects.toThrow(
          "Tipo di job non supportato dall'handler Revenue AI: BOOKING_SYNC.",
        );

        expect(
          buildRecommendationMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rifiuta un payload senza date",
      async () => {
        const job =
          createBackgroundJob({
            type:
              "REVENUE_AI_ANALYSIS",
            payload: {
              propertyId:
                "property-1",
            },
          });

        await expect(
          processRevenueAiAnalysisJob(
            job,
          ),
        ).rejects.toThrow(
          'Il payload del job REVENUE_AI_ANALYSIS deve contenere "date".',
        );

        expect(
          buildRecommendationMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rifiuta una strategy non supportata",
      async () => {
        const job =
          createBackgroundJob({
            type:
              "REVENUE_AI_ANALYSIS",
            payload: {
              propertyId:
                "property-1",
              date:
                "2026-08-29",
              strategy:
                "INVALID",
            },
          });

        await expect(
          processRevenueAiAnalysisJob(
            job,
          ),
        ).rejects.toThrow();

        expect(
          buildRecommendationMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "processa un job valido e crea la recommendation",
      async () => {
        const provider = {
          getRevenueMarketData:
            vi.fn(),
        };

        const property = {
          id:
            "property-1",
          name:
            "Horizon Property",
          address:
            "Via Test 1",
          city:
            "Roma",
          zone:
            "Centro",
          maxGuests:
            4,
          bedrooms:
            2,
          bathrooms:
            1,
        };

        const decision = {
          date:
            new Date(
              "2026-08-29T00:00:00.000Z",
            ),
          recommendedPrice:
            180,
          recommendedRange: {
            min:
              160,
            max:
              210,
          },
          confidence:
            87,
          explanation: [
            "Domanda di mercato positiva.",
          ],
          marketReference:
            175,
          adjustmentPercent:
            2.86,
        };

        propertyFindUniqueMock.mockResolvedValue(
          property,
        );

        createProviderMock.mockReturnValue(
          provider,
        );

        syncRevenueMarketDataMock.mockResolvedValue(
          {
            snapshotId:
              "snapshot-1",
          },
        );

        buildRecommendationMock.mockResolvedValue(
          decision,
        );

        revenueRecommendationCreateMock.mockResolvedValue(
          {
            id:
              "recommendation-1",
          },
        );

        const job =
          createBackgroundJob({
            type:
              "REVENUE_AI_ANALYSIS",
            payload: {
              propertyId:
                "property-1",
              date:
                "2026-08-29",
              strategy:
                "BALANCED",
            },
          });

        const result =
          await processRevenueAiAnalysisJob(
            job,
          );

        expect(
          propertyFindUniqueMock,
        ).toHaveBeenCalled();

        expect(
          createProviderMock,
        ).toHaveBeenCalledOnce();

        expect(
          syncRevenueMarketDataMock,
        ).toHaveBeenCalledOnce();

        expect(
          syncRevenueMarketDataMock,
        ).toHaveBeenCalledWith({
          provider,
          query: {
            propertyId:
              "property-1",
            location: {
              city:
                "Roma",
              zone:
                "Centro",
            },
            property: {
              maxGuests:
                4,
              bedrooms:
                2,
              bathrooms:
                1,
            },
            startDate:
              expect.any(Date),
            endDate:
              expect.any(Date),
          },
        });

        expect(
          buildRecommendationMock,
        ).toHaveBeenCalledWith({
          propertyId:
            "property-1",
          date:
            expect.any(Date),
          strategy:
            "BALANCED",
        });

        expect(
          revenueRecommendationCreateMock,
        ).toHaveBeenCalledWith({
          data: expect.objectContaining({
            propertyId:
              "property-1",
            marketSnapshotId:
              "snapshot-1",
            strategy:
              "BALANCED",
            status:
              "GENERATED",
            recommendedPrice:
              decision.recommendedPrice,
            lowPrice:
              decision.recommendedRange.min,
            highPrice:
              decision.recommendedRange.max,
            confidence:
              decision.confidence,
          }),
        });
      },
    );
  },
);

type CreateBackgroundJobInput = {
  type: BackgroundJob["type"];
  payload: Prisma.JsonValue;
};

function createBackgroundJob({
  type,
  payload,
}: CreateBackgroundJobInput): BackgroundJob {
  return {
    id:
      "background-job-1",

    type,

    status:
      "QUEUED",

    payload,

    deduplicationKey:
      null,

    attempts:
      0,

    maxAttempts:
      3,

    availableAt:
      new Date(
        "2026-08-29T12:00:00.000Z",
      ),

    startedAt:
      null,

    heartbeatAt:
      null,

    finishedAt:
      null,

    lastError:
      null,

    createdAt:
      new Date(
        "2026-08-29T12:00:00.000Z",
      ),

    updatedAt:
      new Date(
        "2026-08-29T12:00:00.000Z",
      ),
  };
}
