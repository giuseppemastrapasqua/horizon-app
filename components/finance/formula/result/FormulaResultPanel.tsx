import { ResultAmount } from "./ResultAmount";
import { ResultHeader } from "./ResultHeader";
import { ResultNotice } from "./ResultNotice";
import { ResultRow } from "./ResultRow";

type FormulaResultPanelProps = {
  result: unknown;
  error: string | null;
};

export function FormulaResultPanel({
  result,
  error,
}: FormulaResultPanelProps) {
  return (
    <aside>
      <ResultHeader />

      {error && <p>{error}</p>}

     {!error ? (
  <>
    <ResultAmount
      amount={0}
      currency="EUR"
    />

    <ResultRow
      label="Anteprima"
      value="In costruzione"
    />
  </>
) : null}

      <ResultNotice />
    </aside>
  );
}