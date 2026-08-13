export type RevenueSignalStrength =
  | "VERY_LOW"
  | "LOW"
  | "NEUTRAL"
  | "HIGH"
  | "VERY_HIGH";

export type RevenueSignalCode =
  | "MARKET_PRICE"
  | "MARKET_OCCUPANCY"
  | "MARKET_DEMAND"
  | "COMPETITOR_AVAILABILITY"
  | "PROPERTY_OCCUPANCY"
  | "BOOKING_PACE"
  | "LEAD_TIME"
  | "CALENDAR_GAP"
  | "EVENT_PRESSURE"
  | "DATA_CONFIDENCE";

export type RevenueSignal = {
  code: RevenueSignalCode;

  label: string;

  value:
    number | null;

  normalizedValue:
    number | null;

  strength:
    RevenueSignalStrength;

  explanation: string;

  source:
    "MARKET"
    | "PROPERTY"
    | "CALENDAR"
    | "EVENT"
    | "SYSTEM";
};

export type RevenueNightContext = {
  propertyId: string;

  date: Date;

  market: {
    medianPrice:
      number | null;

    occupancy:
      number | null;

    demandIndex:
      number | null;

    competitorAvailability:
      number | null;

    confidence:
      number | null;
  };

  property: {
    occupancy:
      number | null;

    bookingPace:
      number | null;
  };

  calendar: {
    leadTimeDays:
      number | null;

    gapBeforeNights:
      number | null;

    gapAfterNights:
      number | null;
  };

  event: {
    score:
      number | null;
  };
};

export type RevenueSignalSet = {
  date: Date;

  signals:
    RevenueSignal[];

  overallConfidence:
    number;

  usable:
    boolean;

  warnings:
    string[];
};

export type RevenueStrategy =
  | "OCCUPANCY"
  | "BALANCED"
  | "ADR";

export type RevenuePriceRange = {
  min: number;
  max: number;
};

export type RevenuePricingDecision = {
  date: Date;

  strategy:
    RevenueStrategy;

  marketReference:
    number;

  recommendedPrice:
    number;

  recommendedRange:
    RevenuePriceRange;

  confidence:
    number;

  adjustmentPercent:
    number;

  explanation:
    string[];

  signals:
    RevenueSignalSet;
};
