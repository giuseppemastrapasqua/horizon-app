import { useMemo } from "react";

import {
  type FinanceFormula,
  type FinanceRule,
} from "@/lib/finance";

type UseFormulaProps = {
  formulaName: string;
  rules: FinanceRule[];
};

export function useFormula({
  formulaName,
  rules,
}: UseFormulaProps): FinanceFormula {
  return useMemo(
    () => ({
      id: "formula-preview",
      name: formulaName,
      description:
        "Formula di prova non ancora salvata.",
      currency: "EUR",
      rules,
    }),
    [formulaName, rules]
  );
}