export type StandardRateSource =
  | "CONFIGURED"
  | "MANUAL"
  | "AI";

type PriceOverride = {
  startDate: Date;
  endDate: Date;
  nightlyPrice: unknown;
  source?: string | null;
};

export function resolveStandardRateForDate({
  date,
  configuredPrice,
  priceOverrides,
}: {
  date: Date;
  configuredPrice: number;
  priceOverrides: PriceOverride[];
}) {
  const target =
    startOfDay(date);

  const matchingOverrides =
    priceOverrides.filter(
      (item) =>
        item.nightlyPrice !== null &&
        target >= startOfDay(item.startDate) &&
        target <= startOfDay(item.endDate),
    );

  /*
   * Precedenza unica Horizon:
   *
   * 1. MANUAL
   * 2. AI
   * 3. STANDARD configurata
   *
   * In questo modo tutte le aree
   * dell'app risolvono la Standard
   * effettiva nello stesso modo.
   */
  const override =
    matchingOverrides.find(
      (item) =>
        item.source === "MANUAL",
    ) ??
    matchingOverrides.find(
      (item) =>
        item.source === "AI",
    ) ??
    matchingOverrides[0] ??
    null;

  if (!override) {
    return {
      price: configuredPrice,
      source:
        "CONFIGURED" as StandardRateSource,
      override: null,
    };
  }

  const overridePrice =
    Number(override.nightlyPrice);

  if (
    !Number.isFinite(
      overridePrice,
    )
  ) {
    return {
      price: configuredPrice,
      source:
        "CONFIGURED" as StandardRateSource,
      override: null,
    };
  }

  const source:
    StandardRateSource =
      override.source === "AI"
        ? "AI"
        : override.source === "MANUAL"
          ? "MANUAL"
          : "CONFIGURED";

  return {
    price: overridePrice,
    source,
    override,
  };
}

export function calculateDerivedRatePrice(
  standardPrice: number,
  adjustmentPercentage: number,
) {
  return (
    Math.round(
      Math.max(
        0,
        standardPrice *
          (1 +
            adjustmentPercentage /
              100),
      ) *
        100,
    ) /
    100
  );
}

function startOfDay(
  value: Date,
) {
  const result =
    new Date(value);

  result.setHours(
    0,
    0,
    0,
    0,
  );

  return result;
}

