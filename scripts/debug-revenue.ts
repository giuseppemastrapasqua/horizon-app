import { prisma } from "../lib/prisma";

const propertyId =
  "cms4dant60001d9b4aj0dd92e";

async function main() {
  const snapshot =
    await prisma.revenueMarketSnapshot.findFirst({
      where: {
        propertyId,
      },
      orderBy: {
        capturedAt:
          "desc",
      },
    });

  const daily =
    await prisma.revenueDailySignal.findMany({
      where: {
        propertyId,
      },
      orderBy: {
        date:
          "asc",
      },
    });

  const comparables =
    await prisma.revenueComparable.findMany({
      where: {
        propertyId,
      },
      orderBy: {
        similarityScore:
          "desc",
      },
    });

  const dailyWithPrice =
    daily.filter(
      (item) =>
        item.marketMedianPrice !==
        null,
    );

  const dailyWithConfidence =
    daily.filter(
      (item) =>
        item.confidence !== null &&
        Number(
          item.confidence,
        ) >= 50,
    );

  const dailyUsableCandidate =
    daily.filter(
      (item) =>
        item.marketMedianPrice !==
          null &&
        item.confidence !== null &&
        Number(
          item.confidence,
        ) >= 50,
    );

  const comparablesWithPrice =
    comparables.filter(
      (item) =>
        item.adr !== null ||
        item.nightlyPrice !==
          null,
    );

  console.log("");
  console.log(
    "===== REVENUE DIAGNOSTIC =====",
  );

  console.log(
    "PROPERTY:",
    propertyId,
  );

  console.log("");
  console.log(
    "===== SNAPSHOT =====",
  );

  console.log(
    snapshot
      ? {
          provider:
            snapshot.provider,

          capturedAt:
            snapshot.capturedAt,

          marketAdr:
            snapshot.marketAdr ===
            null
              ? null
              : Number(
                  snapshot.marketAdr,
                ),

          marketOccupancy:
            snapshot.marketOccupancy ===
            null
              ? null
              : Number(
                  snapshot.marketOccupancy,
                ),

          demandIndex:
            snapshot.demandIndex ===
            null
              ? null
              : Number(
                  snapshot.demandIndex,
                ),
        }
      : null,
  );

  console.log("");
  console.log(
    "===== DAILY =====",
  );

  console.log({
    total:
      daily.length,

    firstDate:
      daily[0]?.date ??
      null,

    lastDate:
      daily.at(-1)?.date ??
      null,

    withMarketMedianPrice:
      dailyWithPrice.length,

    withConfidence50:
      dailyWithConfidence.length,

    candidateUsable:
      dailyUsableCandidate.length,
  });

  console.log("");
  console.log(
    "===== NOVEMBRE 2026 =====",
  );

  const november =
    daily.filter(
      (item) => {
        const key =
          item.date
            .toISOString()
            .slice(
              0,
              7,
            );

        return (
          key ===
          "2026-11"
        );
      },
    );

  console.log({
    total:
      november.length,

    withMarketMedianPrice:
      november.filter(
        (item) =>
          item.marketMedianPrice !==
          null,
      ).length,

    withConfidence50:
      november.filter(
        (item) =>
          item.confidence !== null &&
          Number(
            item.confidence,
          ) >= 50,
      ).length,

    rows:
      november.map(
        (item) => ({
          date:
            item.date
              .toISOString()
              .slice(
                0,
                10,
              ),

          marketMedianPrice:
            item.marketMedianPrice ===
            null
              ? null
              : Number(
                  item.marketMedianPrice,
                ),

          confidence:
            item.confidence ===
            null
              ? null
              : Number(
                  item.confidence,
                ),
        }),
      ),
  });

  console.log("");
  console.log(
    "===== COMPARABLES =====",
  );

  console.log({
    total:
      comparables.length,

    withPrice:
      comparablesWithPrice.length,

    rows:
      comparables.map(
        (item) => ({
          name:
            item.name,

          nightlyPrice:
            item.nightlyPrice ===
            null
              ? null
              : Number(
                  item.nightlyPrice,
                ),

          adr:
            item.adr ===
            null
              ? null
              : Number(
                  item.adr,
                ),

          similarityScore:
            item.similarityScore ===
            null
              ? null
              : Number(
                  item.similarityScore,
                ),
        }),
      ),
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
