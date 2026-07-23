import {
  BookingFinancialSnapshot,
} from "../types";

type Input = {
  bookingId: string;

  grossRevenue: number;

  currency: string;

  otaCommission?: number;

  cleaningCost?: number;

  laundryCost?: number;

  utilitiesCost?: number;

  ownerPayout?: number;

  additionalCosts?: number;
};

export function calculateBookingFinancials(
  input: Input
): BookingFinancialSnapshot {

  const gross = input.grossRevenue;

  const ota = input.otaCommission ?? 0;

  const cleaning = input.cleaningCost ?? 0;

  const laundry = input.laundryCost ?? 0;

  const utilities = input.utilitiesCost ?? 0;

  const payout = input.ownerPayout ?? 0;

  const extra = input.additionalCosts ?? 0;

  const totalCosts =
    ota +
    cleaning +
    laundry +
    utilities +
    payout +
    extra;

  const netRevenue = gross - totalCosts;

  const margin =
    gross > 0
      ? (netRevenue / gross) * 100
      : 0;

  return {
    bookingId: input.bookingId,

    grossRevenue: money(
      gross,
      input.currency
    ),

    otaCommission: money(
      ota,
      input.currency
    ),

    cleaningCost: money(
      cleaning,
      input.currency
    ),

    laundryCost: money(
      laundry,
      input.currency
    ),

    utilitiesCost: money(
      utilities,
      input.currency
    ),

    ownerPayout: money(
      payout,
      input.currency
    ),

    additionalCosts: money(
      extra,
      input.currency
    ),

    netRevenue: money(
      netRevenue,
      input.currency
    ),

    marginPercentage: Number(
      margin.toFixed(2)
    ),
  };
}

function money(
  amount: number,
  currency: string
) {
  return {
    amount,
    currency,
  };
}