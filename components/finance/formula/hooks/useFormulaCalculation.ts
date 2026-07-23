import { useMemo } from "react";

import {
  calculateFinanceFormula,
  type FinanceFormula,
} from "@/lib/finance";

type UseFormulaCalculationProps = {
  formula: FinanceFormula;
  formulas: FinanceFormula[];
  grossRevenue: number;
};

export function useFormulaCalculation({
  formula,
  formulas,
  grossRevenue,
}: UseFormulaCalculationProps) {
  return useMemo(() => {
    try {
      return {
        result: calculateFinanceFormula({
          formula,
          formulas,
          context: {
            grossRevenue,
          },
        }),
        error: null,
      };
    } catch (error) {
      return {
        result: null,
        error:
          error instanceof Error
            ? error.message
            : "Errore durante il calcolo.",
      };
    }
  }, [formula, formulas, grossRevenue]);
}