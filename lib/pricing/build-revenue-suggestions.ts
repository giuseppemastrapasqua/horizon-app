export type RevenueScenarioName =
  | "AGGRESSIVE"
  | "BALANCED"
  | "OCCUPANCY";

export type RevenueFactor = {
  code: string;
  label: string;
  multiplier: number;
};

export type RevenueDailyPrice = {
  date: string;
  basePrice: number;
  recommendedPrice: number;
  factors: RevenueFactor[];
};

export type RevenueSuggestion = {
  scenario: RevenueScenarioName;
  nightlyPrice: number;
  minimumStay: number;
  rationale: string;
};

export type BuildRevenueSuggestionsInput = {
  currentNightlyPrice: number;
  occupancyRate: number;
  freeNights: number;
  selectedNights: number;
  currentMinimumStay: number;

  startDate?: string;
  endDate?: string;
  today?: string;

  minimumPrice?: number;
  maximumPrice?: number;
};

export type RevenueSuggestions = {
  aggressive: RevenueSuggestion;
  balanced: RevenueSuggestion;
  occupancy: RevenueSuggestion;

  dailyPrices: RevenueDailyPrice[];
};

export function buildRevenueSuggestions(
  input: BuildRevenueSuggestionsInput,
): RevenueSuggestions {
  validateInput(input);

  const {
    currentNightlyPrice,
    occupancyRate,
    freeNights,
    selectedNights,
    currentMinimumStay,
  } = input;

  const startDate =
    input.startDate
      ? parseDate(input.startDate)
      : startOfToday();

  const endDate =
    input.endDate
      ? parseDate(input.endDate)
      : addDays(
          startDate,
          selectedNights - 1,
        );

  const today =
    input.today
      ? parseDate(input.today)
      : startOfToday();

  const minimumPrice =
    input.minimumPrice ??
    currentNightlyPrice * 0.7;

  const maximumPrice =
    input.maximumPrice ??
    currentNightlyPrice * 1.6;

  const dailyPrices:
    RevenueDailyPrice[] = [];

  let cursor =
    new Date(startDate);

  while (
    cursor <= endDate
  ) {
    const factors =
      buildDailyFactors({
        date: cursor,
        today,
        occupancyRate,
        freeNights,
        selectedNights,
      });

    const multiplier =
      factors.reduce(
        (
          total,
          factor,
        ) =>
          total *
          factor.multiplier,
        1,
      );

    const recommendedPrice =
      clampPrice(
        Math.round(
          currentNightlyPrice *
            multiplier,
        ),
        minimumPrice,
        maximumPrice,
      );

    dailyPrices.push({
      date:
        toDateKey(cursor),

      basePrice:
        currentNightlyPrice,

      recommendedPrice,

      factors,
    });

    cursor =
      addDays(
        cursor,
        1,
      );
  }

  const balancedPrice =
    Math.round(
      average(
        dailyPrices.map(
          (day) =>
            day.recommendedPrice,
        ),
      ),
    );

  const minimumStay =
    calculateMinimumStay({
      selectedNights,
      occupancyRate,
      currentMinimumStay,
    });

  return {
    balanced: {
      scenario:
        "BALANCED",

      nightlyPrice:
        balancedPrice,

      minimumStay,

      rationale:
        buildRationale({
          occupancyRate,
          freeNights,
          selectedNights,
          dailyPrices,
        }),
    },

    aggressive: {
      scenario:
        "AGGRESSIVE",

      nightlyPrice:
        clampPrice(
          Math.round(
            balancedPrice *
              1.08,
          ),
          minimumPrice,
          maximumPrice,
        ),

      minimumStay:
        Math.min(
          selectedNights,
          Math.max(
            minimumStay,
            selectedNights >= 5
              ? 3
              : 2,
          ),
        ),

      rationale:
        "Strategia orientata alla crescita dell'ADR rispetto al prezzo Revenue consigliato.",
    },

    occupancy: {
      scenario:
        "OCCUPANCY",

      nightlyPrice:
        clampPrice(
          Math.round(
            balancedPrice *
              0.92,
          ),
          minimumPrice,
          maximumPrice,
        ),

      minimumStay:
        Math.min(
          selectedNights,
          Math.max(
            1,
            minimumStay - 1,
          ),
        ),

      rationale:
        "Strategia orientata alla conversione e al riempimento della disponibilità residua.",
    },

    dailyPrices,
  };
}

function buildDailyFactors({
  date,
  today,
  occupancyRate,
  freeNights,
  selectedNights,
}: {
  date: Date;
  today: Date;
  occupancyRate: number;
  freeNights: number;
  selectedNights: number;
}): RevenueFactor[] {
  return [
    getSeasonalityFactor(
      date,
    ),

    getWeekdayFactor(
      date,
    ),

    getOccupancyFactor(
      occupancyRate,
    ),

    getAvailabilityFactor(
      freeNights,
    ),

    getLeadTimeFactor(
      differenceInDays(
        date,
        today,
      ),
    ),

    getStayLengthFactor(
      selectedNights,
    ),
  ];
}

function getSeasonalityFactor(
  date: Date,
): RevenueFactor {
  const month =
    date.getMonth() + 1;

  if (
    month === 7 ||
    month === 8
  ) {
    return factor(
      "SEASON_HIGH",
      "Alta stagione",
      1.12,
    );
  }

  if (
    month === 5 ||
    month === 6 ||
    month === 9 ||
    month === 10
  ) {
    return factor(
      "SEASON_MID",
      "Media stagione",
      1.05,
    );
  }

  if (
    month === 1 ||
    month === 2 ||
    month === 11
  ) {
    return factor(
      "SEASON_LOW",
      "Bassa stagione",
      0.95,
    );
  }

  return factor(
    "SEASON_NORMAL",
    "Stagionalità neutra",
    1,
  );
}

function getWeekdayFactor(
  date: Date,
): RevenueFactor {
  const weekday =
    date.getDay();

  if (weekday === 6) {
    return factor(
      "SATURDAY",
      "Sabato",
      1.12,
    );
  }

  if (weekday === 5) {
    return factor(
      "FRIDAY",
      "Venerdì",
      1.1,
    );
  }

  if (weekday === 0) {
    return factor(
      "SUNDAY",
      "Domenica",
      1.04,
    );
  }

  return factor(
    "WEEKDAY",
    "Giorno feriale",
    1,
  );
}

function getOccupancyFactor(
  occupancyRate: number,
): RevenueFactor {
  if (occupancyRate >= 90) {
    return factor(
      "OCCUPANCY_VERY_HIGH",
      "Occupazione molto alta",
      1.18,
    );
  }

  if (occupancyRate >= 75) {
    return factor(
      "OCCUPANCY_HIGH",
      "Occupazione alta",
      1.1,
    );
  }

  if (occupancyRate >= 55) {
    return factor(
      "OCCUPANCY_HEALTHY",
      "Occupazione sostenuta",
      1.04,
    );
  }

  if (occupancyRate < 30) {
    return factor(
      "OCCUPANCY_LOW",
      "Occupazione bassa",
      0.92,
    );
  }

  return factor(
    "OCCUPANCY_NORMAL",
    "Occupazione normale",
    1,
  );
}

function getAvailabilityFactor(
  freeNights: number,
): RevenueFactor {
  if (freeNights <= 5) {
    return factor(
      "LOW_AVAILABILITY",
      "Poche notti disponibili",
      1.1,
    );
  }

  if (freeNights >= 20) {
    return factor(
      "HIGH_AVAILABILITY",
      "Molte notti disponibili",
      0.94,
    );
  }

  return factor(
    "NORMAL_AVAILABILITY",
    "Disponibilità regolare",
    1,
  );
}

function getLeadTimeFactor(
  leadTimeDays: number,
): RevenueFactor {
  if (leadTimeDays <= 2) {
    return factor(
      "LAST_MINUTE",
      "Last minute",
      0.9,
    );
  }

  if (leadTimeDays <= 7) {
    return factor(
      "SHORT_LEAD",
      "Prenotazione ravvicinata",
      0.96,
    );
  }

  if (leadTimeDays >= 60) {
    return factor(
      "LONG_LEAD",
      "Prenotazione anticipata",
      1.05,
    );
  }

  return factor(
    "NORMAL_LEAD",
    "Lead time regolare",
    1,
  );
}

function getStayLengthFactor(
  selectedNights: number,
): RevenueFactor {
  if (selectedNights >= 7) {
    return factor(
      "LONG_STAY",
      "Soggiorno lungo",
      0.96,
    );
  }

  if (selectedNights === 1) {
    return factor(
      "ONE_NIGHT",
      "Soggiorno di una notte",
      1.08,
    );
  }

  return factor(
    "NORMAL_STAY",
    "Durata soggiorno regolare",
    1,
  );
}

function calculateMinimumStay({
  selectedNights,
  occupancyRate,
  currentMinimumStay,
}: {
  selectedNights: number;
  occupancyRate: number;
  currentMinimumStay: number;
}) {
  let suggested =
    currentMinimumStay;

  if (
    occupancyRate >= 75 &&
    selectedNights >= 3
  ) {
    suggested =
      Math.max(
        suggested,
        2,
      );
  }

  if (
    occupancyRate >= 85 &&
    selectedNights >= 5
  ) {
    suggested =
      Math.max(
        suggested,
        3,
      );
  }

  return Math.min(
    selectedNights,
    Math.max(
      1,
      suggested,
    ),
  );
}

function buildRationale({
  occupancyRate,
  freeNights,
  selectedNights,
  dailyPrices,
}: {
  occupancyRate: number;
  freeNights: number;
  selectedNights: number;
  dailyPrices: RevenueDailyPrice[];
}) {
  const weekendDays =
    dailyPrices.filter(
      (day) =>
        day.factors.some(
          (item) =>
            item.code ===
              "FRIDAY" ||
            item.code ===
              "SATURDAY",
        ),
    ).length;

  const reasons = [
    `Occupazione mese ${Math.round(
      occupancyRate,
    )}%`,
    `${freeNights} notti disponibili`,
    `${selectedNights} notti nel periodo`,
  ];

  if (weekendDays > 0) {
    reasons.push(
      `${weekendDays} notti con pressione weekend`,
    );
  }

  return reasons.join(
    " · ",
  );
}

function factor(
  code: string,
  label: string,
  multiplier: number,
): RevenueFactor {
  return {
    code,
    label,
    multiplier,
  };
}

function clampPrice(
  price: number,
  minimum: number,
  maximum: number,
) {
  return Math.round(
    Math.min(
      maximum,
      Math.max(
        minimum,
        price,
      ),
    ),
  );
}

function average(
  values: number[],
) {
  if (
    values.length === 0
  ) {
    return 0;
  }

  return (
    values.reduce(
      (sum, value) =>
        sum + value,
      0,
    ) / values.length
  );
}

function parseDate(
  value: string,
) {
  const date =
    new Date(
      `${value}T00:00:00`,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    throw new Error(
      "Data Revenue non valida.",
    );
  }

  return date;
}

function startOfToday() {
  const now =
    new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
}

function addDays(
  date: Date,
  days: number,
) {
  const result =
    new Date(date);

  result.setDate(
    result.getDate() +
      days,
  );

  return result;
}

function differenceInDays(
  left: Date,
  right: Date,
) {
  return Math.floor(
    (
      left.getTime() -
      right.getTime()
    ) /
      86_400_000,
  );
}

function toDateKey(
  date: Date,
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(
      2,
      "0",
    );

  const day =
    String(
      date.getDate(),
    ).padStart(
      2,
      "0",
    );

  return `${year}-${month}-${day}`;
}

function validateInput(
  input: BuildRevenueSuggestionsInput,
): void {
  if (
    !Number.isFinite(
      input.currentNightlyPrice,
    ) ||
    input.currentNightlyPrice <= 0
  ) {
    throw new Error(
      "Il prezzo base deve essere maggiore di zero.",
    );
  }

  if (
    input.occupancyRate < 0 ||
    input.occupancyRate > 100
  ) {
    throw new Error(
      "Il tasso di occupazione deve essere compreso tra 0 e 100.",
    );
  }

  if (
    input.freeNights < 0
  ) {
    throw new Error(
      "Le notti libere non possono essere negative.",
    );
  }

  if (
    !Number.isInteger(
      input.selectedNights,
    ) ||
    input.selectedNights < 1
  ) {
    throw new Error(
      "Il periodo selezionato deve contenere almeno una notte.",
    );
  }

  if (
    !Number.isInteger(
      input.currentMinimumStay,
    ) ||
    input.currentMinimumStay < 1
  ) {
    throw new Error(
      "Il minimum stay deve essere almeno 1.",
    );
  }
}
