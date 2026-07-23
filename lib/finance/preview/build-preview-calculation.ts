import { calculatePropertyFinanceFormula } from "@/lib/finance/calculate-property-finance-formula";
import type {
  FinancePreviewCalculation,
  FinancePreviewFormula,
} from "@/lib/finance/preview/preview-types";

type BuildPreviewCalculationInput = {
  formula: FinancePreviewFormula;
  grossRevenue: number;
  currency: string;
  bookingCount: number;
  cleaningCost: number;
};

export async function buildPreviewCalculation({
  formula,
  grossRevenue,
  currency,
  bookingCount,
  cleaningCost,
}: BuildPreviewCalculationInput): Promise<
  FinancePreviewCalculation | null
> {
  if (!formula) {
    return null;
  }

  return calculatePropertyFinanceFormula({
    formulaId: formula.id,
    grossRevenue,
    currency,
    bookingCount,
    cleaningCost,
  });
}