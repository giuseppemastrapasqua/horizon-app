import type {
  RevenuePricingDecision,
  RevenueSignal,
  RevenueSignalSet,
  RevenueStrategy,
} from "./revenue-engine-types";

export function buildRevenuePricingDecision({
  signalSet,
  strategy,
}: {
  signalSet: RevenueSignalSet;
  strategy: RevenueStrategy;
}): RevenuePricingDecision {
  if (!signalSet.usable) {
    throw new Error(
      "Dati insufficienti per produrre una raccomandazione Revenue affidabile.",
    );
  }

  const marketPrice =
    getSignalValue(
      signalSet,
      "MARKET_PRICE",
    );

  if (
    marketPrice === null ||
    marketPrice <= 0
  ) {
    throw new Error(
      "Prezzo di mercato non disponibile.",
    );
  }

  /*
   * Ogni componente rappresenta
   * pressione positiva o negativa
   * sul prezzo.
   *
   * Non partiamo dal prezzo del PM:
   * la baseline è il mercato.
   */
  const demandPressure =
    centeredSignal(
      signalSet,
      "MARKET_DEMAND",
    );

  const marketOccupancyPressure =
    centeredSignal(
      signalSet,
      "MARKET_OCCUPANCY",
    );

  const competitorPressure =
    centeredSignal(
      signalSet,
      "COMPETITOR_AVAILABILITY",
    );

  const propertyOccupancyPressure =
    centeredSignal(
      signalSet,
      "PROPERTY_OCCUPANCY",
    );

  const bookingPacePressure =
    centeredSignal(
      signalSet,
      "BOOKING_PACE",
    );

  const eventPressure =
    centeredSignal(
      signalSet,
      "EVENT_PRESSURE",
    );

  const gapPressure =
    calendarGapPressure(
      signalSet,
    );

  /*
   * I pesi iniziali sono espliciti
   * e versionabili.
   *
   * In futuro saranno calibrati
   * sui risultati reali Horizon.
   */
  const rawPressure =
    demandPressure * 0.25 +
    marketOccupancyPressure * 0.20 +
    competitorPressure * 0.15 +
    propertyOccupancyPressure * 0.10 +
    bookingPacePressure * 0.15 +
    eventPressure * 0.10 +
    gapPressure * 0.05;

  /*
   * Evitiamo movimenti estremi
   * nella prima versione.
   *
   * Il motore può spostarsi
   * al massimo ±20% rispetto
   * al riferimento di mercato
   * prima della strategia.
   */
  const marketAdjustment =
    clamp(
      rawPressure * 0.20,
      -0.20,
      0.20,
    );

  const strategyAdjustment =
    getStrategyAdjustment(
      strategy,
      rawPressure,
    );

  const totalAdjustment =
    clamp(
      marketAdjustment +
        strategyAdjustment,
      -0.25,
      0.25,
    );

  const recommendedPrice =
    roundPrice(
      marketPrice *
        (1 + totalAdjustment),
    );

  const rangeWidth =
    getRangeWidth(
      signalSet.overallConfidence,
    );

  const recommendedRange = {
    min:
      roundPrice(
        recommendedPrice *
          (1 - rangeWidth),
      ),

    max:
      roundPrice(
        recommendedPrice *
          (1 + rangeWidth),
      ),
  };

  return {
    date:
      signalSet.date,

    strategy,

    marketReference:
      roundPrice(
        marketPrice,
      ),

    recommendedPrice,

    recommendedRange,

    confidence:
      signalSet.overallConfidence,

    adjustmentPercent:
      Math.round(
        totalAdjustment *
          1000,
      ) / 10,

    explanation:
      buildExplanation(
        signalSet,
        strategy,
      ),

    signals:
      signalSet,
  };
}

function getStrategyAdjustment(
  strategy: RevenueStrategy,
  pressure: number,
) {
  switch (strategy) {
    case "OCCUPANCY":
      /*
       * Più conservativo sul prezzo,
       * soprattutto con pressione
       * debole.
       */
      return pressure < 0
        ? -0.06
        : -0.03;

    case "ADR":
      /*
       * Protegge ADR solo quando
       * i segnali non sono negativi.
       */
      return pressure > 0
        ? 0.05
        : 0;

    case "BALANCED":
    default:
      return 0;
  }
}

function centeredSignal(
  signalSet:
    RevenueSignalSet,

  code:
    RevenueSignal["code"],
) {
  const signal =
    signalSet.signals.find(
      (candidate) =>
        candidate.code ===
        code,
    );

  if (
    signal?.normalizedValue ===
    null ||
    signal?.normalizedValue ===
    undefined
  ) {
    return 0;
  }

  /*
   * 0   -> -1
   * 0.5 ->  0
   * 1   -> +1
   */
  return (
    signal.normalizedValue -
    0.5
  ) * 2;
}

function calendarGapPressure(
  signalSet:
    RevenueSignalSet,
) {
  const signal =
    signalSet.signals.find(
      (candidate) =>
        candidate.code ===
        "CALENDAR_GAP",
    );

  if (
    signal?.value === null ||
    signal?.value === undefined
  ) {
    return 0;
  }

  if (
    signal.value <= 1
  ) {
    return -1;
  }

  if (
    signal.value === 2
  ) {
    return -0.6;
  }

  if (
    signal.value === 3
  ) {
    return -0.2;
  }

  return 0;
}

function getSignalValue(
  signalSet:
    RevenueSignalSet,

  code:
    RevenueSignal["code"],
) {
  return (
    signalSet.signals.find(
      (signal) =>
        signal.code ===
        code,
    )?.value ??
    null
  );
}

function getRangeWidth(
  confidence: number,
) {
  if (
    confidence >= 90
  ) {
    return 0.04;
  }

  if (
    confidence >= 75
  ) {
    return 0.06;
  }

  if (
    confidence >= 60
  ) {
    return 0.08;
  }

  return 0.10;
}

function buildExplanation(
  signalSet:
    RevenueSignalSet,

  strategy:
    RevenueStrategy,
) {
  const explanations:
    string[] = [];

  const positiveSignals =
    signalSet.signals.filter(
      (signal) =>
        signal.strength ===
          "HIGH" ||
        signal.strength ===
          "VERY_HIGH",
    );

  const negativeSignals =
    signalSet.signals.filter(
      (signal) =>
        signal.strength ===
          "LOW" ||
        signal.strength ===
          "VERY_LOW",
    );

  for (
    const signal
    of positiveSignals.slice(
      0,
      3,
    )
  ) {
    explanations.push(
      `${signal.label}: pressione positiva.`,
    );
  }

  for (
    const signal
    of negativeSignals.slice(
      0,
      2,
    )
  ) {
    explanations.push(
      `${signal.label}: pressione negativa.`,
    );
  }

  if (
    strategy === "OCCUPANCY"
  ) {
    explanations.push(
      "Strategia Occupancy: priorità alla probabilità di conversione.",
    );
  }

  if (
    strategy === "BALANCED"
  ) {
    explanations.push(
      "Strategia Balanced: equilibrio tra prezzo e probabilità di vendita.",
    );
  }

  if (
    strategy === "ADR"
  ) {
    explanations.push(
      "Strategia ADR: protezione del valore della notte in presenza di domanda sufficiente.",
    );
  }

  return explanations;
}

function roundPrice(
  value: number,
) {
  return Math.max(
    1,
    Math.round(value),
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
