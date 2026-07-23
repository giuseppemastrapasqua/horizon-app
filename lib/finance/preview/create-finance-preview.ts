import type {
  FinancePreview,
  FinancePreviewCalculation,
  FinancePreviewFormula,
  FinancePreviewProperty,
} from "@/lib/finance/preview/preview-types";

type CreateFinancePreviewInput = {
  property: FinancePreviewProperty;
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

export function createFinancePreview({
  property,
  formula,
  referenceMonth,
  nextMonthStart,
  grossRevenue,
  totalNights,
  currency,
  calculation,
}: CreateFinancePreviewInput): FinancePreview {
  return {
    property,
    owner: property.owner,
    bookings: property.bookings,
    formula,
    referenceMonth,
    nextMonthStart,
    grossRevenue,
    totalNights,
    currency,
    calculation,
  };
}