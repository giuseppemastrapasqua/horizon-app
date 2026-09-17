import {
  calculateMilanShortRentalTax,
} from "./milan-tax-policy";

export type ManualFiscalDecisionRepository = {
  upsert(input: {
    where: {
      bookingGuestId: string;
    };
    create: {
      bookingGuestId: string;
      guestTypeCode: number;
      tariff: number;
      taxAmount: number;
      intermediary: string | null;
      source: "MANUAL";
      status: "CLASSIFIED";
      reason: string;
    };
    update: {
      guestTypeCode: number;
      tariff: number;
      taxAmount: number;
      intermediary: string | null;
      source: "MANUAL";
      status: "CLASSIFIED";
      reason: string;
    };
  }): Promise<unknown>;
};

export type ManualFiscalDecisionInput = {
  bookingGuestId: string;
  checkIn: Date;
  checkOut: Date;
  guestTypeCode: number;
  intermediary?: string | null;

  /**
   * Required for classifications whose tax treatment
   * Horizon cannot safely derive automatically.
   */
  tariff?: number;
  taxAmount?: number;
};

function calendarNights(
  checkIn: Date,
  checkOut: Date,
) {
  const start = Date.UTC(
    checkIn.getUTCFullYear(),
    checkIn.getUTCMonth(),
    checkIn.getUTCDate(),
  );

  const end = Date.UTC(
    checkOut.getUTCFullYear(),
    checkOut.getUTCMonth(),
    checkOut.getUTCDate(),
  );

  const nights =
    (end - start) / (24 * 60 * 60 * 1000);

  if (
    !Number.isInteger(nights) ||
    nights < 1
  ) {
    throw new Error(
      "Booking check-out must be after check-in.",
    );
  }

  return nights;
}

function requireExplicitMoney(
  input: ManualFiscalDecisionInput,
) {
  if (
    input.tariff === undefined ||
    input.taxAmount === undefined
  ) {
    throw new Error(
      "Explicit tariff and taxAmount are required for this fiscal classification.",
    );
  }

  if (
    !Number.isFinite(input.tariff) ||
    input.tariff < 0 ||
    !Number.isFinite(input.taxAmount) ||
    input.taxAmount < 0
  ) {
    throw new Error(
      "Tariff and taxAmount must be non-negative finite numbers.",
    );
  }

  return {
    tariff: input.tariff,
    taxAmount: input.taxAmount,
  };
}

export async function persistManualFiscalDecision(
  input: ManualFiscalDecisionInput,
  repository: ManualFiscalDecisionRepository,
) {
  const nights = calendarNights(
    input.checkIn,
    input.checkOut,
  );

  let tariff: number;
  let taxAmount: number;
  let reason: string;

  if (input.guestTypeCode === 1) {
    const tax =
      calculateMilanShortRentalTax({
        checkIn: input.checkIn,
        nights,
        guestTypeCode: 1,
      });

    if (tax.status !== "CALCULATED") {
      throw new Error(
        "Ordinary Milan tourist tax could not be calculated.",
      );
    }

    tariff = tax.tariff;
    taxAmount = tax.taxAmount;
    reason = "MANUAL_ORDINARY_RATE";
  } else {
    const explicit =
      requireExplicitMoney(input);

    tariff = explicit.tariff;
    taxAmount = explicit.taxAmount;
    reason = "MANUAL_FISCAL_CLASSIFICATION";
  }

  const intermediary =
    input.intermediary?.trim() || null;

  const data = {
    guestTypeCode: input.guestTypeCode,
    tariff,
    taxAmount,
    intermediary,
    source: "MANUAL" as const,
    status: "CLASSIFIED" as const,
    reason,
  };

  await repository.upsert({
    where: {
      bookingGuestId:
        input.bookingGuestId,
    },
    create: {
      bookingGuestId:
        input.bookingGuestId,
      ...data,
    },
    update: data,
  });

  return {
    bookingGuestId:
      input.bookingGuestId,
    ...data,
  };
}
