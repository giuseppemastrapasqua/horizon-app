import type { FinanceCalculationResult } from "@/lib/finance/formula/types";

import { formatCurrency } from "../shared/formatCurrency";
import { ResultAmount } from "./ResultAmount";
import { ResultHeader } from "./ResultHeader";
import { ResultNotice } from "./ResultNotice";
import { ResultRow } from "./ResultRow";

type FormulaResultPanelProps = {
  result: FinanceCalculationResult | null;
  error: string | null;
};

export function FormulaResultPanel({
  result,
  error,
}: FormulaResultPanelProps) {
  return (
    <aside>
      <ResultHeader />

      {error ? <p role="alert">{error}</p> : null}

      {!error && result ? (
        <>
          <ResultAmount
            amount={result.finalAmount}
            currency={result.currency}
          />

          <ResultRow
            label="Formula"
            value={result.formulaName}
          />

          <ResultRow
            label="Ricavo lordo"
            value={formatCurrency(
              result.grossRevenue,
              result.currency,
            )}
          />

          <ResultRow
            label="Regole applicate"
            value={String(result.rules.length)}
            muted
          />
        </>
      ) : null}

      {!error && !result ? (
        <ResultRow
          label="Anteprima"
          value="Inserisci un importo per calcolare il risultato"
          muted
        />
      ) : null}

      <ResultNotice />
    </aside>
  );
}