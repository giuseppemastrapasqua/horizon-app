import type {
  FinanceCalculationResult,
  FinanceRuleCategory,
  FinanceRuleOperation,
} from "@/lib/finance/formula/types";

import {
  calculatePropertyFinanceFormula,
} from "@/lib/finance/calculate-property-finance-formula";

type BookingChannel =
  | "BOOKING"
  | "AIRBNB"
  | "VRBO"
  | "DIRECT"
  | "OTHER";

type Input = {
  formulaId: string;
  grossRevenue: number;
  cleaningCost: number;
  otaCommissionPercent: number;
  propertyManagementCommissionPercent: number;
  currency: string;
  channel: BookingChannel;
};

export type BookingFinanceBreakdown = {
  grossBooking: number;

  otaCommission:
    | number
    | null;

  cleaningCost: number;

  grossProperty: number;

  managementCommission:
    | number
    | null;

  taxAmount:
    | number
    | null;

  otherAmount:
    | number
    | null;

  netProperty: number;
};

export async function buildBookingFinanceBreakdown({
  formulaId,
  grossRevenue,
  cleaningCost,
  otaCommissionPercent,
  propertyManagementCommissionPercent,
  currency,
  channel,
}: Input): Promise<BookingFinanceBreakdown> {
  const calculation =
    await calculatePropertyFinanceFormula({
      formulaId,
      grossRevenue,
      bookingCount: 1,
      cleaningCost,
      currency,
      channel,
    });
  const otaCommission =
    grossRevenue *
    (
      Math.max(
        0,
        otaCommissionPercent,
      ) /
      100
    );

  const calculatedCleaning =
    getCategorySignedAmount(
      calculation,
      "CLEANING",
    );

  const taxAmount =
    getCategorySignedAmount(
      calculation,
      "TAX",
    );

  const otherAmount =
    getCategorySignedAmount(
      calculation,
      "OTHER",
    );

  const effectiveCleaning =
    calculatedCleaning === null
      ? cleaningCost
      : Math.abs(
          calculatedCleaning,
        );

  /*
   * Lordo proprietà:
   * Lordo prenotazione
   * - Commissione OTA
   * - Pulizie
   *
   * Le due voci sono trattate
   * come costi, indipendentemente
   * dalla rappresentazione visiva.
   */
  const grossProperty =
    grossRevenue -
    Math.abs(
      otaCommission,
    ) -
    Math.abs(
      effectiveCleaning,
    );

  const normalizedGrossProperty =
    Math.max(
      0,
      grossProperty,
    );

  const managementCommission =
    normalizedGrossProperty *
    (
      Math.max(
        0,
        propertyManagementCommissionPercent,
      ) /
      100
    );

  const taxSignedAmount =
    taxAmount ?? 0;

  const otherSignedAmount =
    otherAmount ?? 0;

  const netProperty =
    normalizedGrossProperty -
    managementCommission +
    taxSignedAmount +
    otherSignedAmount;

  return {
    grossBooking:
      grossRevenue,

    otaCommission:
      Math.abs(
        otaCommission,
      ),

    cleaningCost:
      Math.abs(
        effectiveCleaning,
      ),

    grossProperty:
      normalizedGrossProperty,

    managementCommission:
      managementCommission,

    taxAmount:
      taxAmount === null
        ? null
        : Math.abs(
            taxAmount,
          ),

    /*
     * VARIE mantiene il segno.
     * Una regola OTHER in ADD
     * deve restare positiva;
     * una SUBTRACT negativa.
     */
    otherAmount,

    netProperty:
      netProperty,
  };
}

function getCategorySignedAmount(
  calculation:
    FinanceCalculationResult,
  category:
    FinanceRuleCategory,
) {
  const matchingRules =
    calculation.rules.filter(
      (rule) =>
        rule.category ===
        category,
    );

  if (
    matchingRules.length === 0
  ) {
    return null;
  }

  return matchingRules.reduce(
    (total, rule) =>
      total +
      getSignedRuleAmount(
        rule.operation,
        rule.calculatedAmount,
      ),
    0,
  );
}

function getSignedRuleAmount(
  operation:
    FinanceRuleOperation,
  amount: number,
) {
  return operation === "ADD"
    ? amount
    : -amount;
}



