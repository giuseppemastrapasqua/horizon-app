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

type VatMode =
  | "NONE"
  | "EXCLUDED"
  | "INCLUDED";

type Input = {
  formulaId?: string | null;
  grossRevenue: number;
  cleaningCost: number;
  otaCommissionPercent: number;
  propertyManagementCommissionPercent: number;
  propertyManagementCommissionVatPercent?: number;
  propertyManagementCommissionVatMode?: VatMode;
  currency: string;
  channel: BookingChannel;
};

export type BookingFinanceBreakdown = {
  grossBooking: number;
  otaCommission: number | null;
  cleaningCost: number;
  grossProperty: number;
  managementCommission: number | null;
  managementCommissionTaxableBase: number;
  managementCommissionVat: number;
  managementCommissionTotal: number;
  taxAmount: number | null;
  otherAmount: number | null;
  netProperty: number;
};

const F24_RATE = 0.21;

export async function buildBookingFinanceBreakdown({
  formulaId,
  grossRevenue,
  cleaningCost,
  otaCommissionPercent,
  propertyManagementCommissionPercent,
  propertyManagementCommissionVatPercent = 0,
  propertyManagementCommissionVatMode = "NONE",
  currency,
  channel,
}: Input): Promise<BookingFinanceBreakdown> {
  const calculation = formulaId
    ? await calculatePropertyFinanceFormula({
        formulaId,
        grossRevenue,
        bookingCount: 1,
        cleaningCost,
        currency,
        channel,
      })
    : null;

  const otaCommission =
    grossRevenue *
    (Math.max(0, otaCommissionPercent) / 100);

  const calculatedCleaning = calculation
    ? getCategorySignedAmount(calculation, "CLEANING")
    : null;

  const otherAmount = calculation
    ? getCategorySignedAmount(calculation, "OTHER")
    : null;

  const effectiveCleaning =
    calculatedCleaning === null
      ? cleaningCost
      : Math.abs(calculatedCleaning);

  const grossProperty = Math.max(
    0,
    grossRevenue -
      Math.abs(otaCommission) -
      Math.abs(effectiveCleaning),
  );

  const managementCommission =
    grossProperty *
    (Math.max(0, propertyManagementCommissionPercent) / 100);

  const vatRate =
    Math.max(0, propertyManagementCommissionVatPercent) / 100;

  const managementCommissionTaxableBase =
    propertyManagementCommissionVatMode === "INCLUDED" && vatRate > 0
      ? managementCommission / (1 + vatRate)
      : managementCommission;

  const managementCommissionVat =
    propertyManagementCommissionVatMode === "NONE"
      ? 0
      : propertyManagementCommissionVatMode === "INCLUDED"
        ? managementCommission - managementCommissionTaxableBase
        : managementCommissionTaxableBase * vatRate;

  const managementCommissionTotal =
    propertyManagementCommissionVatMode === "EXCLUDED"
      ? managementCommissionTaxableBase + managementCommissionVat
      : managementCommission;

  const f24Base = Math.max(
    0,
    grossProperty - managementCommissionTotal,
  );

  const taxAmount = f24Base * F24_RATE;
  const otherSignedAmount = otherAmount ?? 0;

  const netProperty =
    f24Base - taxAmount + otherSignedAmount;

  return {
    grossBooking: grossRevenue,
    otaCommission: Math.abs(otaCommission),
    cleaningCost: Math.abs(effectiveCleaning),
    grossProperty,
    managementCommission,
    managementCommissionTaxableBase,
    managementCommissionVat,
    managementCommissionTotal,
    taxAmount,
    otherAmount,
    netProperty,
  };
}

function getCategorySignedAmount(
  calculation: FinanceCalculationResult,
  category: FinanceRuleCategory,
) {
  const matchingRules = calculation.rules.filter(
    (rule) => rule.category === category,
  );

  if (matchingRules.length === 0) {
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
  operation: FinanceRuleOperation,
  amount: number,
) {
  return operation === "ADD" ? amount : -amount;
}
