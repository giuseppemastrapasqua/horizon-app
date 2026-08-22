import {
  buildPeriodRevenueRecommendation,
} from "@/app/properties/[id]/components/property-calendar/revenue/build-period-recommendation";

import {
  buildRevenueRecommendationInsights,
} from "./build-revenue-recommendation-insights";

import {
  prisma,
} from "@/lib/prisma";

import {
  getPropertyRevenueData,
} from "@/lib/revenue/get-property-revenue-data";

export async function getPropertyRevenueIntelligence({
  propertyId,
  startDate,
  endDate,
}: {
  propertyId: string;
  startDate: Date;
  endDate: Date;
}) {
  const property =
    await prisma.property.findUnique({
      where: {
        id: propertyId,
      },

      select: {
        id: true,
        name: true,

        ratePlans: {
          orderBy: [
            {
              isDefault: "desc",
            },
            {
              createdAt: "asc",
            },
          ],

          select: {
            code: true,
            isDefault: true,
            basePrice: true,
            minimumStay: true,
          },
        },
      },
    });

  if (!property) {
    return [];
  }

  const standardRate =
    property.ratePlans.find(
      (ratePlan) =>
        ratePlan.code ===
        "STANDARD",
    ) ??
    property.ratePlans.find(
      (ratePlan) =>
        ratePlan.isDefault,
    ) ??
    null;

  if (!standardRate) {
    return [];
  }

  const revenueData =
    await getPropertyRevenueData({
      propertyId:
        property.id,

      startDate,
      endDate,
    });

  const revenueResult =
    buildPeriodRevenueRecommendation({
      propertyId:
        property.id,

      rangeStart:
        dateKey(startDate),

      rangeEnd:
        dateKey(endDate),

      minimumStay:
        String(
          standardRate.minimumStay,
        ),

      revenueData,
    });

  const recommendation =
    revenueResult.recommendation;

  if (!recommendation) {
    return [];
  }

  return buildRevenueRecommendationInsights({
    propertyId:
      property.id,

    propertyName:
      property.name,

    recommendation,

    currentPrice:
      Number(
        standardRate.basePrice,
      ),
  });
}

function dateKey(
  date: Date,
) {
  return date
    .toISOString()
    .slice(0, 10);
}
