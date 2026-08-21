import { prisma } from "@/lib/prisma";

export async function getPropertyRevenueData({
  propertyId,
  startDate,
  endDate,
}: {
  propertyId: string;
  startDate: Date;
  endDate: Date;
}) {
  const [
    property,
    latestSnapshot,
    dailySignals,
    comparables,
  ] = await Promise.all([
    prisma.property.findUnique({
      where: {
        id: propertyId,
      },

      select: {
        maxGuests: true,
        bedrooms: true,
        bathrooms: true,
      },
    }),

    prisma.revenueMarketSnapshot.findFirst({
      where: {
        propertyId,
      },

      orderBy: {
        capturedAt: "desc",
      },
    }),

    prisma.revenueDailySignal.findMany({
      where: {
        propertyId,

        date: {
          gte: startDate,
          lte: endDate,
        },
      },

      orderBy: [
        {
          date: "asc",
        },
        {
          capturedAt: "desc",
        },
      ],
    }),

    prisma.revenueComparable.findMany({
      where: {
        propertyId,
      },

      orderBy: {
        similarityScore: "desc",
      },

      take: 20,
    }),
  ]);

  /*
   * revenueDailySignal può contenere
   * più acquisizioni della stessa data.
   *
   * Manteniamo soltanto quella più
   * recente per ogni giorno.
   */
  const latestSignalByDate =
    new Map<
      string,
      (typeof dailySignals)[number]
    >();

  for (const signal of dailySignals) {
    const key =
      signal.date
        .toISOString()
        .slice(0, 10);

    if (
      !latestSignalByDate.has(
        key,
      )
    ) {
      latestSignalByDate.set(
        key,
        signal,
      );
    }
  }

  if (!property) {
    throw new Error(
      "Property non trovata durante il caricamento Revenue.",
    );
  }

  return {
    property: {
      maxGuests:
        property.maxGuests,

      bedrooms:
        property.bedrooms,

      bathrooms:
        property.bathrooms,
    },

    snapshot:
      latestSnapshot
        ? {
            id:
              latestSnapshot.id,

            provider:
              latestSnapshot.provider,

            marketName:
              latestSnapshot.marketName,

            currency:
              latestSnapshot.currency,

            marketAdr:
              latestSnapshot.marketAdr ===
              null
                ? null
                : Number(
                    latestSnapshot.marketAdr,
                  ),

            marketOccupancy:
              latestSnapshot.marketOccupancy ===
              null
                ? null
                : Number(
                    latestSnapshot.marketOccupancy,
                  ),

            demandIndex:
              latestSnapshot.demandIndex ===
              null
                ? null
                : Number(
                    latestSnapshot.demandIndex,
                  ),

            bookingPace:
              latestSnapshot.bookingPace ===
              null
                ? null
                : Number(
                    latestSnapshot.bookingPace,
                  ),

            activeSupply:
              latestSnapshot.activeSupply,

            capturedAt:
              latestSnapshot.capturedAt
                .toISOString(),
          }
        : null,

    days:
      Array.from(
        latestSignalByDate.values(),
      ).map(
        (signal) => ({
          id:
            signal.id,

          date:
            signal.date
              .toISOString(),

          provider:
            signal.provider,

          currency:
            signal.currency,

          marketMedianPrice:
            signal.marketMedianPrice ===
            null
              ? null
              : Number(
                  signal.marketMedianPrice,
                ),

          marketLowPrice:
            signal.marketLowPrice ===
            null
              ? null
              : Number(
                  signal.marketLowPrice,
                ),

          marketHighPrice:
            signal.marketHighPrice ===
            null
              ? null
              : Number(
                  signal.marketHighPrice,
                ),

          marketOccupancy:
            signal.marketOccupancy ===
            null
              ? null
              : Number(
                  signal.marketOccupancy,
                ),

          competitorAvailability:
            signal.competitorAvailability,

          demandIndex:
            signal.demandIndex ===
            null
              ? null
              : Number(
                  signal.demandIndex,
                ),

          propertyOccupancy:
            signal.propertyOccupancy ===
            null
              ? null
              : Number(
                  signal.propertyOccupancy,
                ),

          bookingPace:
            signal.bookingPace ===
            null
              ? null
              : Number(
                  signal.bookingPace,
                ),

          leadTimeDays:
            signal.leadTimeDays,

          gapBeforeNights:
            signal.gapBeforeNights,

          gapAfterNights:
            signal.gapAfterNights,

          eventScore:
            signal.eventScore ===
            null
              ? null
              : Number(
                  signal.eventScore,
                ),

          confidence:
            signal.confidence ===
            null
              ? null
              : Number(
                  signal.confidence,
                ),
        }),
      ),

    comparables:
      comparables.map(
        (comparable) => ({
          id:
            comparable.id,

          provider:
            comparable.provider,

          externalListingId:
            comparable.externalListingId,

          name:
            comparable.name,

          distanceKm:
            comparable.distanceKm ===
            null
              ? null
              : Number(
                  comparable.distanceKm,
                ),

          maxGuests:
            comparable.maxGuests,

          bedrooms:
            comparable.bedrooms,

          bathrooms:
            comparable.bathrooms,

          nightlyPrice:
            comparable.nightlyPrice ===
            null
              ? null
              : Number(
                  comparable.nightlyPrice,
                ),

          adr:
            comparable.adr ===
            null
              ? null
              : Number(
                  comparable.adr,
                ),

          occupancyRate:
            comparable.occupancyRate ===
            null
              ? null
              : Number(
                  comparable.occupancyRate,
                ),

          similarityScore:
            comparable.similarityScore ===
            null
              ? null
              : Number(
                  comparable.similarityScore,
                ),
        }),
      ),
  };
}


