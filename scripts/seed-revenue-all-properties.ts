import { prisma } from "../lib/prisma";

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

function clamp(
  value: number,
  min: number,
  max: number,
) {
  return Math.max(
    min,
    Math.min(
      max,
      value,
    ),
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

/*
 * Baseline DIFFERENZIATA per zona.
 *
 * È un dataset sintetico di sviluppo:
 * NON rappresenta dati reali AirDNA.
 */
function getMarketProfile(
  city: string,
  zone: string | null,
) {
  const key =
    `${city} ${zone ?? ""}`
      .toLowerCase();

  if (
    key.includes("brera")
  ) {
    return {
      adr: 235,
      occupancy: 79,
      demand: 82,
      supply: 95,
    };
  }

  if (
    key.includes("duomo")
  ) {
    return {
      adr: 265,
      occupancy: 82,
      demand: 86,
      supply: 120,
    };
  }

  if (
    key.includes("navigli")
  ) {
    return {
      adr: 195,
      occupancy: 78,
      demand: 80,
      supply: 145,
    };
  }

  if (
    key.includes("bovisa")
  ) {
    return {
      adr: 145,
      occupancy: 68,
      demand: 64,
      supply: 80,
    };
  }

  if (
    key.includes("loreto")
  ) {
    return {
      adr: 168,
      occupancy: 72,
      demand: 68,
      supply: 125,
    };
  }

  return {
    adr: 175,
    occupancy: 72,
    demand: 70,
    supply: 100,
  };
}

async function main() {
  const properties =
    await prisma.property.findMany({
      orderBy: {
        name: "asc",
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

  if (
    properties.length === 0
  ) {
    throw new Error(
      "Nessun alloggio trovato.",
    );
  }

  console.log("");
  console.log(
    "===== REVENUE MULTI PROPERTY =====",
  );

  for (
    const [
      propertyIndex,
      property,
    ]
    of properties.entries()
  ) {
    const profile =
      getMarketProfile(
        property.city,
        property.zone,
      );

    console.log("");
    console.log(
      `>>> ${property.name}`,
    );

    /*
     * Eliminiamo SOLTANTO i dati demo
     * di questa struttura.
     *
     * Eventuali dati AIRDNA o altri
     * provider rimangono intatti.
     */
    await prisma.revenueDailySignal.deleteMany({
      where: {
        propertyId:
          property.id,

        provider,
      },
    });

    await prisma.revenueComparable.deleteMany({
      where: {
        propertyId:
          property.id,

        provider,
      },
    });

    await prisma.revenueMarketSnapshot.deleteMany({
      where: {
        propertyId:
          property.id,

        provider,
      },
    });

    /*
     * Snapshot mercato specifico
     * della struttura/zona.
     */
    await prisma.revenueMarketSnapshot.create({
      data: {
        propertyId:
          property.id,

        provider,

        marketName:
          property.zone
            ? `${property.city} - ${property.zone}`
            : property.city,

        currency:
          "EUR",

        marketAdr:
          profile.adr,

        marketOccupancy:
          profile.occupancy,

        marketRevenue:
          round(
            profile.adr *
            profile.occupancy /
            100 *
            30,
          ),

        demandIndex:
          profile.demand,

        bookingPace:
          clamp(
            profile.demand - 4,
            0,
            100,
          ),

        activeSupply:
          profile.supply,

        rawData: {
          synthetic: true,
          purpose:
            "Horizon Revenue multi-property development seed",
          property:
            property.name,
          zone:
            property.zone,
        },
      },
    });

    /*
     * Competitive set specifico.
     */
    const comparableMultipliers =
      [
        0.92,
        0.97,
        1.03,
        1.08,
        1.13,
      ];

    for (
      const [
        index,
        multiplier,
      ]
      of comparableMultipliers.entries()
    ) {
      const nightlyPrice =
        Math.round(
          profile.adr *
          multiplier,
        );

      await prisma.revenueComparable.create({
        data: {
          propertyId:
            property.id,

          provider,

          externalListingId:
            `demo-${property.id}-${index + 1}`,

          name:
            `${property.zone ?? property.city} Comparable ${index + 1}`,

          distanceKm:
            round(
              0.3 +
              index * 0.35,
            ),

          maxGuests:
            property.maxGuests,

          bedrooms:
            property.bedrooms,

          bathrooms:
            property.bathrooms,

          nightlyPrice,

          adr:
            Math.round(
              nightlyPrice * 0.97,
            ),

          occupancyRate:
            clamp(
              profile.occupancy +
              index -
              2,
              45,
              95,
            ),

          similarityScore:
            94 -
            index * 4,

          rawData: {
            synthetic: true,
            purpose:
              "Horizon Revenue multi-property development seed",
          },
        },
      });
    }

    /*
     * 18 mesi:
     * 01/01/2026 → 30/06/2027
     */
    const startDate =
      new Date(
        Date.UTC(
          2026,
          0,
          1,
        ),
      );

    const endDate =
      new Date(
        Date.UTC(
          2027,
          5,
          30,
        ),
      );

    const rows = [];

    let cursor =
      new Date(
        startDate,
      );

    let dayIndex =
      0;

    while (
      cursor <= endDate
    ) {
      const date =
        dateOnly(
          cursor,
        );

      const dayOfWeek =
        date.getUTCDay();

      const month =
        date.getUTCMonth();

      /*
       * Venerdì e sabato:
       * domanda normalmente più alta.
       */
      const weekend =
        dayOfWeek === 5 ||
        dayOfWeek === 6;

      /*
       * Stagionalità milanese sintetica.
       */
      const seasonalAdjustment =
        [
          -0.08, // gen
          -0.04, // feb
           0.02, // mar
           0.08, // apr
           0.10, // mag
           0.06, // giu
           0.00, // lug
          -0.06, // ago
           0.12, // set
           0.10, // ott
           0.02, // nov
           0.08, // dic
        ][month] ?? 0;

      const weekendAdjustment =
        weekend
          ? 0.13
          : 0;

      /*
       * Oscillazione giornaliera deterministica.
       * PropertyIndex evita che tutte le
       * strutture abbiano la stessa curva.
       */
      const wave =
        Math.sin(
          (
            dayIndex +
            propertyIndex * 7
          ) /
          8,
        );

      const shortWave =
        Math.sin(
          (
            dayIndex +
            propertyIndex * 11
          ) /
          3.7,
        );

      /*
       * Pressione evento sintetica.
       * Alcune date avranno quindi un
       * prezzo sensibilmente diverso.
       */
      const eventPressure =
        dayIndex % 29 === 0
          ? 0.16
          : dayIndex % 17 === 0
            ? 0.08
            : 0;

      const multiplier =
        1 +
        seasonalAdjustment +
        weekendAdjustment +
        wave * 0.035 +
        shortWave * 0.018 +
        eventPressure;

      const marketMedianPrice =
        round(
          profile.adr *
          multiplier,
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
          clamp(
            profile.occupancy +
            weekendAdjustment * 35 +
            wave * 5 +
            eventPressure * 25,
            40,
            96,
          ),
        );

      const demandIndex =
        round(
          clamp(
            profile.demand +
            weekendAdjustment * 38 +
            wave * 6 +
            eventPressure * 28,
            30,
            100,
          ),
          4,
        );

      const bookingPace =
        round(
          clamp(
            demandIndex -
            5 +
            shortWave * 3,
            20,
            100,
          ),
          4,
        );

      const propertyOccupancy =
        round(
          clamp(
            marketOccupancy -
            4 +
            shortWave * 4,
            20,
            100,
          ),
          4,
        );

      const eventScore =
        round(
          clamp(
            45 +
            eventPressure * 250 +
            Math.max(
              0,
              wave,
            ) *
            8,
            0,
            100,
          ),
          4,
        );

      const confidence =
        round(
          clamp(
            86 +
            Math.sin(
              (
                dayIndex +
                propertyIndex
              ) /
              11,
            ) *
            4,
            75,
            94,
          ),
        );

      rows.push({
        propertyId:
          property.id,

        date,

        provider,

        currency:
          "EUR",

        marketMedianPrice,
        marketLowPrice,
        marketHighPrice,
        marketOccupancy,

        competitorAvailability:
          15 +
          (
            dayIndex %
            17
          ),

        demandIndex,

        propertyOccupancy,

        bookingPace,

        leadTimeDays:
          14 +
          (
            dayIndex %
            46
          ),

        gapBeforeNights:
          dayIndex %
          4,

        gapAfterNights:
          (
            dayIndex +
            2
          ) %
          5,

        eventScore,

        confidence,

        factors: {
          synthetic:
            true,

          purpose:
            "Horizon Revenue multi-property development seed",

          property:
            property.name,

          market:
            property.zone ??
            property.city,

          seasonalAdjustment,
          weekendAdjustment,
          eventPressure,
        },
      });

      cursor =
        new Date(
          date.getTime() +
          86_400_000,
        );

      dayIndex +=
        1;
    }

    /*
     * createMany invece di 546
     * query singole.
     */
    await prisma.revenueDailySignal.createMany({
      data:
        rows,
    });

    console.log({
      id:
        property.id,

      property:
        property.name,

      market:
        property.zone ??
        property.city,

      marketAdr:
        profile.adr,

      signals:
        rows.length,

      comparables:
        comparableMultipliers.length,
    });
  }

  console.log("");
  console.log(
    "===== COMPLETATO =====",
  );

  console.log({
    properties:
      properties.length,

    provider,
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
