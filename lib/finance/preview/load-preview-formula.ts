import { findFinanceFormulaForProperty } from "@/lib/finance/find-finance-formula";
import type {
  FinancePreviewFormula,
} from "@/lib/finance/preview/preview-types";

type LoadPreviewFormulaInput = {
  propertyId: string;
};

export async function loadPreviewFormula({
  propertyId,
}: LoadPreviewFormulaInput): Promise<FinancePreviewFormula> {
  return findFinanceFormulaForProperty(
    propertyId
  );
}