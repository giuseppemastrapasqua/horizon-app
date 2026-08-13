import { prisma } from "../lib/prisma";

const propertyId =
  "cms4dant60001d9b4aj0dd92e";

const provider =
  "HORIZON_DEMO";

function round(
  value: number,
  digits = 2,
) {
  const factor =
    10 ** digits;

  return (
    Math.round(
      value * factor,
    ) / factor
  );
}

function dateOnly(
  date: Date,
) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    ),
  );
}

async function main() {
  const property =
    await prisma.property.findUnique({
      where: {
        id: propertyId,
      },

      select: {
        id: true,
        name: true,
        city: true,
        zone: true,
        maxGuests: true,
        bedrooms: true,
        bathrooms: true,
      },
    });

  if (!property) {
    throw new Error(
      `Property ${propertyId} non trovata.`,
    );
  }

  console.log(
    "Property:",
    property,
  );

  /*
   * Eliminiamo esclusivamente i dati DEMO.
   * Non tocchiamo eventuali dati provenienti
   * in futuro da provider reali.
   */
  await prisma.revenueDailySignal.deleteMany({
    where: {
      propertyId,
      provider,
    },
  });

  await prisma.revenueComparable.deleteMany({
    where: {
      propertyId,
      provider,
    },
  });

  await prisma.revenueMarketSnapshot.deleteMany({
    where: {
      propertyId,
      provider,
    },
  });

  console.log(
    "Vecchi dati HORIZON_DEMO rimossi.",
  );

  /*
   * Snapshot generale.
   */
  await prisma.revenueMarketSnapshot.create({
    data: {
      propertyId,
      provider,

      marketName:
        property.zone
          ? `${property.city} - ${property.zone}`
          : property.city,

      currency:
        "EUR",

      marketAdr:
        168,

      marketOccupancy:
        72,

      marketRevenue:
        3679,

      demandIndex:
        68,

      bookingPace:
        64,

      activeSupply:
        125,

      rawData: {
        synthetic: true,
        purpose:
          "Horizon Revenue development seed",
      },
    },
  });

  /*
   * Competitive set sintetico.
   */
  const comparableRows = [
    {
      externalListingId:
        "demo-comp-01",
      name:
        "Comparable Centro 1",
      distanceKm:
        0.35,
      nightlyPrice:
        174,
      adr:
        169,
      occupancyRate:
        76,
      similarityScore:
        94,
    },
    {
      externalListingId:
        "demo-comp-02",
      name:
        "Comparable Centro 2",
      distanceKm:
        0.7,
      nightlyPrice:
        159,
      adr:
        155,
      occupancyRate:
        71,
      similarityScore:
        89,
    },
    {
      externalListingId:
        "demo-comp-03",
      name:
        "Comparable Centro 3",
      distanceKm:
        1.1,
      nightlyPrice:
        188,
      adr:
        181,
      occupancyRate:
        74,
      similarityScore:
        86,
    },
    {
      externalListingId:
        "demo-comp-04",
      name:
        "Comparable Centro 4",
      distanceKm:
        1.45,
      nightlyPrice:
        149,
      adr:
        146,
      occupancyRate:
        68,
      similarityScore:
        82,
    },
    {
      externalListingId:
        "demo-comp-05",
      name:
        "Comparable Centro 5",
      distanceKm:
        1.8,
      nightlyPrice:
        179,
      adr:
        173,
      occupancyRate:
        73,
      similarityScore:
        79,
    },
  ];

  for (
    const comparable
    of comparableRows
  ) {
    await prisma.revenueComparable.create({
      data: {
        propertyId,
        provider,

        externalListingId:
          comparable.externalListingId,

        name:
          comparable.name,

        distanceKm:
          comparable.distanceKm,

        maxGuests:
          property.maxGuests,

        bedrooms:
          property.bedrooms,

        bathrooms:
          property.bathrooms,

        nightlyPrice:
          comparable.nightlyPrice,

        adr:
          comparable.adr,

        occupancyRate:
          comparable.occupancyRate,

        similarityScore:
          comparable.similarityScore,

        rawData: {
          synthetic: true,
          purpose:
            "Horizon Revenue development seed",
        },
      },
    });
  }

  /*
   * Generiamo circa 18 mesi:
   * dal 1 gennaio 2026 al 30 giugno 2027.
   *
   * In questo modo puoi testare liberamente
   * diversi mesi dal calendario.
   */
  const start =
    new Date(
      Date.UTC(
        2026,
        0,
        1,
      ),
    );

  const end =
    new Date(
      Date.UTC(
        2027,
        5,
        30,
      ),
    );

  let created =
    0;

  for (
    let cursor =
      new Date(start);

    cursor <= end;

    cursor =
      new Date(
        cursor.getTime() +
          86_400_000,
      )
  ) {
    const date =
      dateOnly(
        cursor,
      );

    const month =
      date.getUTCMonth();

    const weekday =
      date.getUTCDay();

    /*
     * Stagionalità demo.
     */
    const seasonalAdjustment =
      month === 6 ||
      month === 7
        ? 30
        : month === 11
          ? 28
          : month === 3 ||
              month === 4 ||
              month === 8
            ? 15
            : 0;

    const weekendAdjustment =
      weekday === 5 ||
      weekday === 6
        ? 22
        : 0;

    /*
     * Oscillazione deterministica.
     * Nessun Math.random(): il seed resta
     * riproducibile.
     */
    const wave =
      Math.sin(
        created / 6,
      );

    const marketMedianPrice =
      round(
        145 +
          seasonalAdjustment +
          weekendAdjustment +
          wave * 9,
      );

    const marketLowPrice =
      round(
        marketMedianPrice *
          0.82,
      );

    const marketHighPrice =
      round(
        marketMedianPrice *
          1.22,
      );

    const marketOccupancy =
      round(
        Math.min(
          94,
          Math.max(
            55,
            69 +
              seasonalAdjustment *
                0.25 +
              (
                weekendAdjustment >
                0
                  ? 7
                  : 0
              ) +
              wave * 4,
          ),
        ),
      );

    const demandIndex =
      round(
        Math.min(
          95,
          Math.max(
            45,
            64 +
              seasonalAdjustment *
                0.35 +
              (
                weekendAdjustment >
                0
                  ? 8
                  : 0
              ) +
              wave * 5,
          ),
        ),
        4,
      );

    const propertyOccupancy =
      round(
        Math.max(
          45,
          marketOccupancy - 5,
        ),
      );

    const bookingPace =
      round(
        Math.min(
          90,
          Math.max(
            40,
            61 +
              wave * 6 +
              (
                weekendAdjustment >
                0
                  ? 5
                  : 0
              ),
          ),
        ),
        4,
      );

    const eventScore =
      round(
        month === 3 ||
        month === 8 ||
        month === 11
          ? 72 +
              wave * 5
          : 45 +
              wave * 4,
        4,
      );

    /*
     * Manteniamo confidence alta perché
     * vogliamo verificare il motore,
     * non il ramo "dati insufficienti".
     */
    const confidence =
      round(
        82 +
          Math.sin(
            created / 11,
          ) *
            5,
      );

    await prisma.revenueDailySignal.create({
      data: {
        propertyId,
        date,
        provider,

        currency:
          "EUR",

        marketMedianPrice,
        marketLowPrice,
        marketHighPrice,

        marketOccupancy,

        competitorAvailability:
          18 +
          (
            created %
            14
          ),

        demandIndex,

        leadTimeDays:
          21 +
          (
            created %
            35
          ),

        propertyOccupancy,

        bookingPace,

        gapBeforeNights:
          created %
          4,

        gapAfterNights:
          (
            created +
            2
          ) %
          5,

        eventScore,

        confidence,

        factors: {
          synthetic: true,
          purpose:
            "Horizon Revenue development seed",

          seasonalAdjustment,
          weekendAdjustment,
        },
      },
    });

    created +=
      1;
  }

  console.log("");
  console.log(
    "===== SEED COMPLETATO =====",
  );

  console.log({
    propertyId,
    provider,
    dailySignals:
      created,
    comparables:
      comparableRows.length,
    snapshots:
      1,
  });
}

main()
  .catch(
    (error) => {
      console.error(
        error,
      );

      process.exitCode =
        1;
    },
  )
  .finally(
    async () => {
      await prisma.$disconnect();
    },
  );
