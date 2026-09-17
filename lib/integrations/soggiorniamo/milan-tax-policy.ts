export type MilanShortRentalTaxPolicy = {
  municipalityCode: "F205";
  accommodationType: "SHORT_RENTAL";
  effectiveFrom: string;
  effectiveTo: string;
  nightlyRate: number;
  maximumTaxableNights: number;
};

export type MilanTaxCalculationInput = {
  checkIn: Date;
  nights: number;
  guestTypeCode: number;
};

export type MilanTaxCalculation =
  | {
      status: "CALCULATED";
      guestTypeCode: 1 | 2 | 13;
      tariff: number;
      taxableNights: number;
      taxAmount: number;
      reason:
        | "ORDINARY_RATE"
        | "MINOR_EXEMPT"
        | "MILAN_RESIDENT_EXCLUDED";
    }
  | {
      status: "REVIEW_REQUIRED";
      guestTypeCode: number;
      tariff: null;
      taxableNights: null;
      taxAmount: null;
      reason:
        | "INTERMEDIARY_TAX_HANDLING_REQUIRED"
        | "UNSUPPORTED_GUEST_TYPE";
    };

const MILAN_2026_POLICIES: readonly MilanShortRentalTaxPolicy[] = [
  {
    municipalityCode: "F205",
    accommodationType: "SHORT_RENTAL",
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-03-31",
    nightlyRate: 9.5,
    maximumTaxableNights: 14,
  },
  {
    municipalityCode: "F205",
    accommodationType: "SHORT_RENTAL",
    effectiveFrom: "2026-04-01",
    effectiveTo: "2026-12-31",
    nightlyRate: 9.5,
    maximumTaxableNights: 14,
  },
];

function utcDateKey(date: Date) {
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid check-in date.");
  }

  return date.toISOString().slice(0, 10);
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function resolveMilanShortRentalTaxPolicy(
  checkIn: Date,
): MilanShortRentalTaxPolicy {
  const dateKey = utcDateKey(checkIn);

  const policy = MILAN_2026_POLICIES.find(
    (candidate) =>
      dateKey >= candidate.effectiveFrom &&
      dateKey <= candidate.effectiveTo,
  );

  if (!policy) {
    throw new Error(
      `No Milan short-rental tourist-tax policy configured for ${dateKey}.`,
    );
  }

  return policy;
}

export function calculateMilanShortRentalTax(
  input: MilanTaxCalculationInput,
): MilanTaxCalculation {
  if (
    !Number.isInteger(input.nights) ||
    input.nights < 0
  ) {
    throw new Error(
      "Nights must be a non-negative integer.",
    );
  }

  const policy =
    resolveMilanShortRentalTaxPolicy(
      input.checkIn,
    );

  if (input.guestTypeCode === 2) {
    return {
      status: "CALCULATED",
      guestTypeCode: 2,
      tariff: 0,
      taxableNights: 0,
      taxAmount: 0,
      reason: "MINOR_EXEMPT",
    };
  }

  if (input.guestTypeCode === 13) {
    return {
      status: "CALCULATED",
      guestTypeCode: 13,
      tariff: 0,
      taxableNights: 0,
      taxAmount: 0,
      reason: "MILAN_RESIDENT_EXCLUDED",
    };
  }

  if (input.guestTypeCode === 14) {
    return {
      status: "REVIEW_REQUIRED",
      guestTypeCode: 14,
      tariff: null,
      taxableNights: null,
      taxAmount: null,
      reason:
        "INTERMEDIARY_TAX_HANDLING_REQUIRED",
    };
  }

  if (input.guestTypeCode !== 1) {
    return {
      status: "REVIEW_REQUIRED",
      guestTypeCode: input.guestTypeCode,
      tariff: null,
      taxableNights: null,
      taxAmount: null,
      reason: "UNSUPPORTED_GUEST_TYPE",
    };
  }

  const taxableNights = Math.min(
    input.nights,
    policy.maximumTaxableNights,
  );

  return {
    status: "CALCULATED",
    guestTypeCode: 1,
    tariff: policy.nightlyRate,
    taxableNights,
    taxAmount: roundMoney(
      taxableNights * policy.nightlyRate,
    ),
    reason: "ORDINARY_RATE",
  };
}
