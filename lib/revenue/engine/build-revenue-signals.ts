import type {
  RevenueNightContext,
  RevenueSignal,
  RevenueSignalSet,
  RevenueSignalStrength,
} from "./revenue-engine-types";

export function buildRevenueSignals(
  context: RevenueNightContext,
): RevenueSignalSet {
  const signals: RevenueSignal[] = [
    marketPriceSignal(
      context.market.medianPrice,
    ),

    marketOccupancySignal(
      context.market.occupancy,
    ),

    marketDemandSignal(
      context.market.demandIndex,
    ),

    competitorAvailabilitySignal(
      context.market.competitorAvailability,
    ),

    propertyOccupancySignal(
      context.property.occupancy,
    ),

    bookingPaceSignal(
      context.property.bookingPace,
    ),

    leadTimeSignal(
      context.calendar.leadTimeDays,
    ),

    calendarGapSignal(
      context.calendar.gapBeforeNights,
      context.calendar.gapAfterNights,
    ),

    eventSignal(
      context.event.score,
    ),
  ];

  const marketConfidence =
    clampPercent(
      context.market.confidence ??
      0,
    );

  const availableSignals =
    signals.filter(
      (signal) =>
        signal.value !== null,
    ).length;

  const coverage =
    signals.length === 0
      ? 0
      : (
          availableSignals /
          signals.length
        ) *
        100;

  const overallConfidence =
    Math.round(
      marketConfidence *
        0.7 +
      coverage *
        0.3,
    );

  const warnings:
    string[] = [];

  if (
    context.market.medianPrice ===
    null
  ) {
    warnings.push(
      "Prezzo di mercato non disponibile.",
    );
  }

  if (
    context.market.occupancy ===
    null
  ) {
    warnings.push(
      "Occupazione di mercato non disponibile.",
    );
  }

  if (
    overallConfidence < 50
  ) {
    warnings.push(
      "Confidenza insufficiente per una raccomandazione tariffaria affidabile.",
    );
  }

  return {
    date:
      context.date,

    signals,

    overallConfidence,

    usable:
      overallConfidence >= 50 &&
      context.market.medianPrice !==
        null,

    warnings,
  };
}

function marketPriceSignal(
  value: number | null,
): RevenueSignal {
  return buildSignal({
    code:
      "MARKET_PRICE",

    label:
      "Prezzo mercato",

    value,

    normalizedValue:
      null,

    strength:
      value === null
        ? "NEUTRAL"
        : "HIGH",

    explanation:
      value === null
        ? "Prezzo di mercato non disponibile."
        : `Mediana mercato ${Math.round(
            value,
          )} €.`,

    source:
      "MARKET",
  });
}

function marketOccupancySignal(
  value: number | null,
): RevenueSignal {
  return buildSignal({
    code:
      "MARKET_OCCUPANCY",

    label:
      "Occupazione mercato",

    value,

    normalizedValue:
      value === null
        ? null
        : clamp01(
            value / 100,
          ),

    strength:
      occupancyStrength(
        value,
      ),

    explanation:
      value === null
        ? "Occupazione mercato non disponibile."
        : `Occupazione mercato ${Math.round(
            value,
          )}%.`,

    source:
      "MARKET",
  });
}

function marketDemandSignal(
  value: number | null,
): RevenueSignal {
  return buildSignal({
    code:
      "MARKET_DEMAND",

    label:
      "Domanda mercato",

    value,

    normalizedValue:
      value === null
        ? null
        : clamp01(
            value,
          ),

    strength:
      normalizedStrength(
        value,
      ),

    explanation:
      value === null
        ? "Indice domanda non disponibile."
        : `Indice domanda ${(value * 100).toFixed(
            0,
          )}%.`,

    source:
      "MARKET",
  });
}

function competitorAvailabilitySignal(
  value: number | null,
): RevenueSignal {
  let strength:
    RevenueSignalStrength =
    "NEUTRAL";

  if (
    value !== null
  ) {
    if (value <= 5) {
      strength =
        "VERY_HIGH";
    } else if (
      value <= 15
    ) {
      strength =
        "HIGH";
    } else if (
      value >= 50
    ) {
      strength =
        "LOW";
    }
  }

  return buildSignal({
    code:
      "COMPETITOR_AVAILABILITY",

    label:
      "Disponibilità competitor",

    value,

    normalizedValue:
      value === null
        ? null
        : 1 -
          clamp01(
            value / 50,
          ),

    strength,

    explanation:
      value === null
        ? "Disponibilità competitor non disponibile."
        : `${Math.round(
            value,
          )} disponibilità concorrenti rilevate.`,

    source:
      "MARKET",
  });
}

function propertyOccupancySignal(
  value: number | null,
): RevenueSignal {
  return buildSignal({
    code:
      "PROPERTY_OCCUPANCY",

    label:
      "Occupazione struttura",

    value,

    normalizedValue:
      value === null
        ? null
        : clamp01(
            value / 100,
          ),

    strength:
      occupancyStrength(
        value,
      ),

    explanation:
      value === null
        ? "Occupazione struttura non disponibile."
        : `Occupazione struttura ${Math.round(
            value,
          )}%.`,

    source:
      "PROPERTY",
  });
}

function bookingPaceSignal(
  value: number | null,
): RevenueSignal {
  let strength:
    RevenueSignalStrength =
    "NEUTRAL";

  if (
    value !== null
  ) {
    if (value >= 1.25) {
      strength =
        "VERY_HIGH";
    } else if (
      value >= 1.1
    ) {
      strength =
        "HIGH";
    } else if (
      value <= 0.75
    ) {
      strength =
        "LOW";
    }
  }

  return buildSignal({
    code:
      "BOOKING_PACE",

    label:
      "Booking pace",

    value,

    normalizedValue:
      value === null
        ? null
        : clamp01(
            value / 1.5,
          ),

    strength,

    explanation:
      value === null
        ? "Booking pace non disponibile."
        : `Booking pace ${value.toFixed(
            2,
          )}x rispetto al riferimento.`,

    source:
      "PROPERTY",
  });
}

function leadTimeSignal(
  value: number | null,
): RevenueSignal {
  let strength:
    RevenueSignalStrength =
    "NEUTRAL";

  if (
    value !== null
  ) {
    if (value <= 2) {
      strength =
        "LOW";
    } else if (
      value <= 7
    ) {
      strength =
        "LOW";
    } else if (
      value >= 45
    ) {
      strength =
        "HIGH";
    }
  }

  return buildSignal({
    code:
      "LEAD_TIME",

    label:
      "Lead time",

    value,

    normalizedValue:
      value === null
        ? null
        : clamp01(
            value / 60,
          ),

    strength,

    explanation:
      value === null
        ? "Lead time non disponibile."
        : `${Math.round(
            value,
          )} giorni alla data.`,

    source:
      "CALENDAR",
  });
}

function calendarGapSignal(
  gapBefore:
    number | null,

  gapAfter:
    number | null,
): RevenueSignal {
  const values =
    [
      gapBefore,
      gapAfter,
    ].filter(
      (
        value,
      ): value is number =>
        value !== null,
    );

  const smallestGap =
    values.length > 0
      ? Math.min(
          ...values,
        )
      : null;

  let strength:
    RevenueSignalStrength =
    "NEUTRAL";

  if (
    smallestGap !== null
  ) {
    if (
      smallestGap === 1
    ) {
      strength =
        "VERY_LOW";
    } else if (
      smallestGap === 2
    ) {
      strength =
        "LOW";
    }
  }

  return buildSignal({
    code:
      "CALENDAR_GAP",

    label:
      "Gap calendario",

    value:
      smallestGap,

    normalizedValue:
      smallestGap === null
        ? null
        : clamp01(
            smallestGap / 7,
          ),

    strength,

    explanation:
      smallestGap === null
        ? "Nessun dato sui gap di calendario."
        : `Gap minimo ${smallestGap} notti.`,

    source:
      "CALENDAR",
  });
}

function eventSignal(
  value: number | null,
): RevenueSignal {
  return buildSignal({
    code:
      "EVENT_PRESSURE",

    label:
      "Pressione eventi",

    value,

    normalizedValue:
      value === null
        ? null
        : clamp01(
            value,
          ),

    strength:
      normalizedStrength(
        value,
      ),

    explanation:
      value === null
        ? "Nessun segnale eventi disponibile."
        : `Pressione eventi ${(value * 100).toFixed(
            0,
          )}%.`,

    source:
      "EVENT",
  });
}

function buildSignal(
  signal: RevenueSignal,
) {
  return signal;
}

function occupancyStrength(
  value: number | null,
): RevenueSignalStrength {
  if (value === null) {
    return "NEUTRAL";
  }

  if (value >= 90) {
    return "VERY_HIGH";
  }

  if (value >= 75) {
    return "HIGH";
  }

  if (value <= 30) {
    return "LOW";
  }

  return "NEUTRAL";
}

function normalizedStrength(
  value: number | null,
): RevenueSignalStrength {
  if (value === null) {
    return "NEUTRAL";
  }

  if (value >= 0.85) {
    return "VERY_HIGH";
  }

  if (value >= 0.65) {
    return "HIGH";
  }

  if (value <= 0.25) {
    return "LOW";
  }

  return "NEUTRAL";
}

function clamp01(
  value: number,
) {
  return Math.max(
    0,
    Math.min(
      1,
      value,
    ),
  );
}

function clampPercent(
  value: number,
) {
  return Math.max(
    0,
    Math.min(
      100,
      value,
    ),
  );
}
