import { prisma } from "@/lib/prisma";

import type {
  RevenueMarketProvider,
  RevenueMarketQuery,
} from "./providers/revenue-market-provider";

export async function syncRevenueMarketData({
  provider,
  query,
}: {
  provider: RevenueMarketProvider;
  query: RevenueMarketQuery;
}) {
  const result =
    await provider.getMarketData(
      query,
    );

  return prisma.$transaction(
    async (transaction) => {
      const snapshot =
        await transaction.revenueMarketSnapshot.create({
          data: {
            propertyId:
              query.propertyId,

            provider:
              result.provider,

            marketName:
              result.market.name ??
              null,

            currency:
              result.currency,

            marketAdr:
              result.market.adr ??
              null,

            marketOccupancy:
              result.market.occupancy ??
              null,

            marketRevenue:
              result.market.revenue ??
              null,

            demandIndex:
              result.market.demandIndex ??
              null,

            bookingPace:
              result.market.bookingPace ??
              null,

            activeSupply:
              result.market.activeSupply ??
              null,

            rawData:
              toJsonValue(
                result.rawData,
              ),

            capturedAt:
              result.capturedAt,
          },
        });

      if (
        result.days.length > 0
      ) {
        await transaction.revenueDailySignal.createMany({
          data:
            result.days.map(
              (day) => ({
                propertyId:
                  query.propertyId,

                date:
                  day.date,

                provider:
                  result.provider,

                currency:
                  result.currency,

                marketMedianPrice:
                  day.marketMedianPrice ??
                  null,

                marketLowPrice:
                  day.marketLowPrice ??
                  null,

                marketHighPrice:
                  day.marketHighPrice ??
                  null,

                marketOccupancy:
                  day.marketOccupancy ??
                  null,

                competitorAvailability:
                  day.competitorAvailability ??
                  null,

                demandIndex:
                  day.demandIndex ??
                  null,

                eventScore:
                  day.eventScore ??
                  null,

                confidence:
                  day.confidence ??
                  null,

                factors:
                  toJsonValue(
                    day.factors,
                  ),

                capturedAt:
                  result.capturedAt,
              }),
            ),
        });
      }

      if (
        result.comparables.length > 0
      ) {
        for (
          const comparable
          of result.comparables
        ) {
          await transaction.revenueComparable.upsert({
            where: {
              propertyId_provider_externalListingId: {
                propertyId:
                  query.propertyId,

                provider:
                  result.provider,

                externalListingId:
                  comparable.externalListingId,
              },
            },

            create: {
              propertyId:
                query.propertyId,

              provider:
                result.provider,

              externalListingId:
                comparable.externalListingId,

              name:
                comparable.name ??
                null,

              latitude:
                comparable.latitude ??
                null,

              longitude:
                comparable.longitude ??
                null,

              distanceKm:
                comparable.distanceKm ??
                null,

              maxGuests:
                comparable.maxGuests ??
                null,

              bedrooms:
                comparable.bedrooms ??
                null,

              bathrooms:
                comparable.bathrooms ??
                null,

              nightlyPrice:
                comparable.nightlyPrice ??
                null,

              adr:
                comparable.adr ??
                null,

              occupancyRate:
                comparable.occupancyRate ??
                null,

              similarityScore:
                comparable.similarityScore ??
                null,

              rawData:
                toJsonValue(
                  comparable.rawData,
                ),

              capturedAt:
                result.capturedAt,
            },

            update: {
              name:
                comparable.name ??
                null,

              latitude:
                comparable.latitude ??
                null,

              longitude:
                comparable.longitude ??
                null,

              distanceKm:
                comparable.distanceKm ??
                null,

              maxGuests:
                comparable.maxGuests ??
                null,

              bedrooms:
                comparable.bedrooms ??
                null,

              bathrooms:
                comparable.bathrooms ??
                null,

              nightlyPrice:
                comparable.nightlyPrice ??
                null,

              adr:
                comparable.adr ??
                null,

              occupancyRate:
                comparable.occupancyRate ??
                null,

              similarityScore:
                comparable.similarityScore ??
                null,

              rawData:
                toJsonValue(
                  comparable.rawData,
                ),

              capturedAt:
                result.capturedAt,
            },
          });
        }
      }

      return {
        snapshotId:
          snapshot.id,

        provider:
          result.provider,

        capturedAt:
          result.capturedAt,

        dailySignalsCreated:
          result.days.length,

        comparablesProcessed:
          result.comparables.length,
      };
    },
  );
}

function toJsonValue(
  value: unknown,
) {
  if (
    value === undefined
  ) {
    return undefined;
  }

  /*
   * Garantisce che il valore passato
   * a Prisma sia JSON serializzabile
   * e rimuove eventuali undefined.
   */
  return JSON.parse(
    JSON.stringify(
      value,
    ),
  );
}
