import { prisma } from "@/lib/prisma";

export type PropertyPricingOverrideView = {
  id: string;
  startDate: string;
  endDate: string;

  nightlyPrice:
    | number
    | null;

  minimumStay:
    | number
    | null;

  maximumStay:
    | number
    | null;

  occupancyIncluded:
    | number
    | null;

  source:
    | "MANUAL"
    | "AI"
    | "RULE";

  createdAt: string;
};

export async function getPropertyPricingOverrides(
  propertyId: string,
): Promise<PropertyPricingOverrideView[]> {
  const rows =
    await prisma.propertyPriceOverride.findMany({
      where: {
        propertyId,
      },

      orderBy: {
        createdAt:
          "asc",
      },

      select: {
        id: true,
        startDate: true,
        endDate: true,
        nightlyPrice: true,
        minimumStay: true,
        maximumStay: true,
        occupancyIncluded: true,
        source: true,
        createdAt: true,
      },
    });

  return rows.map(
    (row) => ({
      id:
        row.id,

      startDate:
        row.startDate.toISOString(),

      endDate:
        row.endDate.toISOString(),

      nightlyPrice:
        row.nightlyPrice === null
          ? null
          : Number(
              row.nightlyPrice,
            ),

      minimumStay:
        row.minimumStay,

      maximumStay:
        row.maximumStay,

      occupancyIncluded:
        row.occupancyIncluded,

      source:
        row.source,

      createdAt:
        row.createdAt.toISOString(),
    }),
  );
}

