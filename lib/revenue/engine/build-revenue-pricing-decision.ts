import type {
  RevenuePricingContribution,
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
   * la baseline Ã¨ il mercato.
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

  const leadTimePressure =
    centeredSignal(
      signalSet,
      "LEAD_TIME",
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
  const contributions:
    RevenuePricingContribution[] =
      [
        pricingContribution({
          code:
            "MARKET_DEMAND",

          label:
            "Domanda mercato",

          pressure:
            demandPressure,

          weight:
            0.22,
        }),

        pricingContribution({
          code:
            "MARKET_OCCUPANCY",

          label:
            "Occupazione mercato",

          pressure:
            marketOccupancyPressure,

          weight:
            0.18,
        }),

        pricingContribution({
          code:
            "COMPETITOR_AVAILABILITY",

          label:
            "Disponibilità competitor",

          pressure:
            competitorPressure,

          weight:
            0.13,
        }),

        pricingContribution({
          code:
            "PROPERTY_OCCUPANCY",

          label:
            "Occupazione struttura",

          pressure:
            propertyOccupancyPressure,

          weight:
            0.10,
        }),

        pricingContribution({
          code:
            "BOOKING_PACE",

          label:
            "Booking pace",

          pressure:
            bookingPacePressure,

          weight:
            0.12,
        }),

        pricingContribution({
          code:
            "EVENT_PRESSURE",

          label:
            "Pressione eventi",

          pressure:
            eventPressure,

          weight:
            0.10,
        }),

        pricingContribution({
          code:
            "LEAD_TIME",

          label:
            "Lead time",

          pressure:
            leadTimePressure,

          weight:
            0.10,
        }),

        pricingContribution({
          code:
            "CALENDAR_GAP",

          label:
            "Gap calendario",

          pressure:
            gapPressure,

          weight:
            0.05,
        }),
      ];

  const rawPressure =
    contributions.reduce(
      (
        total,
        contribution,
      ) =>
        total +
        contribution.contribution,
      0,
    );

  /*
   * Evitiamo movimenti estremi
   * nella prima versione.
   *
   * Il motore puÃ² spostarsi
   * al massimo Â±20% rispetto
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

  contributions.push({
    code:
      "STRATEGY",

    label:
      `Strategia ${strategy}`,

    pressure:
      rawPressure,

    weight:
      1,

    contribution:
      strategyAdjustment,

    adjustmentPercent:
      roundPercent(
        strategyAdjustment *
          100,
      ),
  });

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

    contributions,

    explanation:
      buildExplanation(
        signalSet,
        strategy,
        contributions,
      ),

    signals:
      signalSet,
  };
}

function pricingContribution({
  code,
  label,
  pressure,
  weight,
}: {
  code:
    RevenueSignal["code"];

  label:
    string;

  pressure:
    number;

  weight:
    number;
}): RevenuePricingContribution {
  const contribution =
    pressure *
    weight;

  return {
    code,
    label,
    pressure:
      roundNumber(
        pressure,
      ),

    weight,

    contribution:
      roundNumber(
        contribution,
      ),

    /*
     * rawPressure viene successivamente
     * trasformato in marketAdjustment
     * moltiplicandolo per 20%.
     *
     * Questo valore mostra quindi
     * l'impatto percentuale indicativo
     * del singolo driver sul prezzo.
     */
    adjustmentPercent:
      roundPercent(
        contribution *
          20,
      ),
  };
}

function roundNumber(
  value: number,
) {
  return Math.round(
    value *
      10000,
  ) /
    10000;
}

function roundPercent(
  value: number,
) {
  return Math.round(
    value *
      10,
  ) /
    10;
}
function getStrategyAdjustment(
  strategy: RevenueStrategy,
  pressure: number,
) {
  switch (strategy) {
    case "OCCUPANCY":
      /*
       * PiÃ¹ conservativo sul prezzo,
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

  contributions:
    RevenuePricingContribution[],
) {
  const explanations:
    string[] = [];

  /*
   * L'explainability deve derivare
   * dallo stesso calcolo che genera
   * il prezzo.
   *
   * Ordiniamo quindi i driver per
   * impatto economico assoluto,
   * non per semplice HIGH / LOW.
   */
  const economicDrivers =
    contributions
      .filter(
        (contribution) =>
          contribution.code !==
            "STRATEGY" &&
          Math.abs(
            contribution
              .adjustmentPercent,
          ) >= 0.1,
      )
      .sort(
        (left, right) =>
          Math.abs(
            right.adjustmentPercent,
          ) -
          Math.abs(
            left.adjustmentPercent,
          ),
      );

  const positiveDrivers =
    economicDrivers
      .filter(
        (contribution) =>
          contribution
            .adjustmentPercent >
          0,
      )
      .slice(
        0,
        3,
      );

  const negativeDrivers =
    economicDrivers
      .filter(
        (contribution) =>
          contribution
            .adjustmentPercent <
          0,
      )
      .slice(
        0,
        2,
      );

  for (
    const contribution
    of positiveDrivers
  ) {
    const signal =
      signalSet.signals.find(
        (candidate) =>
          candidate.code ===
          contribution.code,
      );

    explanations.push(
      [
        `${contribution.label}: ${formatExplanationPercent(
          contribution
            .adjustmentPercent,
        )} sul prezzo.`,

        signal?.explanation,
      ]
        .filter(Boolean)
        .join(" "),
    );
  }

  for (
    const contribution
    of negativeDrivers
  ) {
    const signal =
      signalSet.signals.find(
        (candidate) =>
          candidate.code ===
          contribution.code,
      );

    explanations.push(
      [
        `${contribution.label}: ${formatExplanationPercent(
          contribution
            .adjustmentPercent,
        )} sul prezzo.`,

        signal?.explanation,
      ]
        .filter(Boolean)
        .join(" "),
    );
  }

  const strategyContribution =
    contributions.find(
      (contribution) =>
        contribution.code ===
        "STRATEGY",
    );

  const strategyEffect =
    strategyContribution &&
    Math.abs(
      strategyContribution
        .adjustmentPercent,
    ) >= 0.1
      ? ` Impatto strategia ${formatExplanationPercent(
          strategyContribution
            .adjustmentPercent,
        )}.`
      : "";

  if (
    strategy === "OCCUPANCY"
  ) {
    explanations.push(
      `Strategia Occupancy: priorità alla probabilità di conversione.${strategyEffect}`,
    );
  }

  if (
    strategy === "BALANCED"
  ) {
    explanations.push(
      `Strategia Balanced: equilibrio tra prezzo e probabilità di vendita.${strategyEffect}`,
    );
  }

  if (
    strategy === "ADR"
  ) {
    explanations.push(
      `Strategia ADR: protezione del valore della notte in presenza di domanda sufficiente.${strategyEffect}`,
    );
  }

  return explanations;
}

function formatExplanationPercent(
  value: number,
) {
  if (
    value > 0
  ) {
    return `+${value}%`;
  }

  return `${value}%`;
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



