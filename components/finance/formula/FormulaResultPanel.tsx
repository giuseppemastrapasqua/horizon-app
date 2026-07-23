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
      <h2>Anteprima formula</h2>

      {error ? <p>{error}</p> : null}

      {!error &&
      result !== null &&
      result !== undefined ? (
        <pre>
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </aside>
  );
}