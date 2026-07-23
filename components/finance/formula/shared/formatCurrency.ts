export function formatCurrency(
  amount: number,
  currency: string
) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
  }).format(amount);
}