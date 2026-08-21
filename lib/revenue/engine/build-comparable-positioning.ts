export type ComparablePositioningInput = {
  marketReference:
    number | null;

  propertyProfile?: {
    maxGuests:
      number | null;

    bedrooms:
      number | null;

    bathrooms:
      number | null;
  };

  comparables: Array<{
    adr:
      number | null;

    nightlyPrice:
      number | null;

    similarityScore:
      number | null;

    maxGuests?:
      number | null;

    bedrooms?:
      number | null;

    bathrooms?:
      number | null;
  }>;
};

export type ComparablePositioningResult = {
  usable:
    boolean;

  comparableReference:
    number | null;

  positioningFactor:
    number;

  comparableCount:
    number;

  rationale:
    string;
};

export function buildComparablePositioning({
  marketReference,
  propertyProfile,
  comparables,
}: ComparablePositioningInput):
  ComparablePositioningResult {
  /*
   * Usiamo solo comparables
   * sufficientemente simili.
   */
  const usable =
    comparables
      .map(
        (comparable) => {
          const price =
            comparable.adr ??
            comparable.nightlyPrice;

          if (
            price === null ||
            !Number.isFinite(
              price,
            ) ||
            price <= 0
          ) {
            return null;
          }

          const providerSimilarity =
            comparable.similarityScore ??
            50;

          const profileMultiplier =
            calculateProfileMultiplier({
              propertyProfile,
              comparable,
            });

          const similarity =
            clamp(
              providerSimilarity *
                profileMultiplier,
              0,
              100,
            );

          if (
            similarity < 60
          ) {
            return null;
          }

          return {
            price,
            similarity,
          };
        },
      )
      .filter(
        (
          item,
        ): item is {
          price: number;
          similarity: number;
        } =>
          item !== null,
      );

  if (
    usable.length === 0
  ) {
    return {
      usable:
        false,

      comparableReference:
        null,

      positioningFactor:
        1,

      comparableCount:
        0,

      rationale:
        "Nessun comparable sufficientemente affidabile.",
    };
  }

  /*
   * Media ponderata:
   * un comparable con similarity 95
   * conta più di uno con similarity 65.
   */
  const totalWeight =
    usable.reduce(
      (
        total,
        item,
      ) =>
        total +
        item.similarity,
      0,
    );

  const weightedPrice =
    usable.reduce(
      (
        total,
        item,
      ) =>
        total +
        item.price *
          item.similarity,
      0,
    ) /
    totalWeight;

  const comparableReference =
    Math.round(
      weightedPrice,
    );

  if (
    marketReference === null ||
    !Number.isFinite(
      marketReference,
    ) ||
    marketReference <= 0
  ) {
    return {
      usable:
        true,

      comparableReference,

      positioningFactor:
        1,

      comparableCount:
        usable.length,

      rationale:
        `Riferimento calcolato su ${usable.length} strutture comparabili.`,
    };
  }

  /*
   * Rapporto fra competitive set
   * e mercato generale.
   *
   * Protezione importante:
   * il posizionamento non può
   * spostare la baseline oltre ±15%.
   */
  const rawFactor =
    comparableReference /
    marketReference;

  const positioningFactor =
    clamp(
      rawFactor,
      0.85,
      1.15,
    );

  const deltaPercent =
    Math.round(
      (
        positioningFactor -
        1
      ) *
      1000,
    ) /
    10;

  return {
    usable:
      true,

    comparableReference,

    positioningFactor,

    comparableCount:
      usable.length,

    rationale:
      [
        `${usable.length} comparables ponderati per similarità.`,
        `Posizionamento struttura ${formatSignedPercent(
          deltaPercent,
        )} rispetto al mercato.`,
      ].join(
        " ",
      ),
  };
}

function calculateProfileMultiplier({
  propertyProfile,
  comparable,
}: {
  propertyProfile:
    ComparablePositioningInput["propertyProfile"];

  comparable:
    ComparablePositioningInput["comparables"][number];
}) {
  if (!propertyProfile) {
    return 1;
  }

  let multiplier =
    1;

  /*
   * MAX GUESTS
   *
   * È il fattore strutturale più importante.
   * Una differenza di 1 ospite è tollerata,
   * differenze maggiori riducono progressivamente
   * il peso del comparable.
   */
  if (
    propertyProfile.maxGuests !== null &&
    comparable.maxGuests !== null &&
    comparable.maxGuests !== undefined
  ) {
    const difference =
      Math.abs(
        propertyProfile.maxGuests -
          comparable.maxGuests,
      );

    if (difference === 1) {
      multiplier *=
        0.96;
    } else if (difference === 2) {
      multiplier *=
        0.88;
    } else if (difference >= 3) {
      multiplier *=
        0.75;
    }
  }

  /*
   * BEDROOMS
   */
  if (
    propertyProfile.bedrooms !== null &&
    comparable.bedrooms !== null &&
    comparable.bedrooms !== undefined
  ) {
    const difference =
      Math.abs(
        propertyProfile.bedrooms -
          comparable.bedrooms,
      );

    if (difference === 1) {
      multiplier *=
        0.92;
    } else if (difference >= 2) {
      multiplier *=
        0.78;
    }
  }

  /*
   * BATHROOMS
   */
  if (
    propertyProfile.bathrooms !== null &&
    comparable.bathrooms !== null &&
    comparable.bathrooms !== undefined
  ) {
    const difference =
      Math.abs(
        propertyProfile.bathrooms -
          comparable.bathrooms,
      );

    if (difference === 1) {
      multiplier *=
        0.95;
    } else if (difference >= 2) {
      multiplier *=
        0.85;
    }
  }

  /*
   * Evitiamo di azzerare completamente
   * un comparable soltanto per il profilo.
   * Il provider similarity continua a
   * rappresentare il punto di partenza.
   */
  return clamp(
    multiplier,
    0.60,
    1,
  );
}
function formatSignedPercent(
  value: number,
) {
  if (
    value > 0
  ) {
    return `+${value}%`;
  }

  return `${value}%`;
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

