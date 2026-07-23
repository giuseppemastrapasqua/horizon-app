import { formatCurrency } from "../shared/formatCurrency";

type ResultAmountProps = {
  amount: number;
  currency: string;
};

export function ResultAmount({
  amount,
  currency,
}: ResultAmountProps) {
  return (
    <div
      style={{
        marginTop: "16px",
        fontSize: "34px",
        fontWeight: 800,
        letterSpacing: "-0.04em",
        color: "#4338ca",
      }}
    >
      {formatCurrency(amount, currency)}
    </div>
  );
}