import type { Prisma } from "@prisma/client";

import type { calculatePropertyFinanceFormula } from "@/lib/finance/calculate-property-finance-formula";
import type { findFinanceFormulaForProperty } from "@/lib/finance/find-finance-formula";

export type BuildFinancePreviewInput = {
  propertyId: string;
  referenceMonth: Date;
};

export const financePreviewPropertySelect = {
  id: true,
  name: true,
  address: true,
  city: true,
  zone: true,
  cleaningCost: true,

  owner: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },

  bookings: {
    select: {
      id: true,
      guestName: true,
      channel: true,
      checkIn: true,
      checkOut: true,
      nights: true,
      grossAmount: true,
      currency: true,
      bookingStatus: true,
    },
  },
} satisfies Prisma.PropertySelect;

export type FinancePreviewProperty =
  Prisma.PropertyGetPayload<{
    select: typeof financePreviewPropertySelect;
  }>;

export type FinancePreviewFormula =
  Awaited<
    ReturnType<
      typeof findFinanceFormulaForProperty
    >
  >;

export type FinancePreviewCalculation =
  Awaited<
    ReturnType<
      typeof calculatePropertyFinanceFormula
    >
  >;

export type FinancePreview = {
  property: FinancePreviewProperty;
  owner: FinancePreviewProperty["owner"];
  bookings: FinancePreviewProperty["bookings"];
  formula: FinancePreviewFormula;
  referenceMonth: Date;
  nextMonthStart: Date;
  grossRevenue: number;
  totalNights: number;
  currency: string;
  calculation:
    | FinancePreviewCalculation
    | null;
};