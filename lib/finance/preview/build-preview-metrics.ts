import type {
  FinancePreviewProperty,
} from "@/lib/finance/preview/preview-types";

type BuildPreviewMetricsInput = {
  bookings: FinancePreviewProperty["bookings"];
};

export function buildPreviewMetrics({
  bookings,
}: BuildPreviewMetricsInput) {
  const grossRevenue = bookings.reduce(
    (total, booking) =>
      total + Number(booking.grossAmount),
    0
  );

  const totalNights = bookings.reduce(
    (total, booking) =>
      total + booking.nights,
    0
  );

  const currency =
    bookings[0]?.currency ?? "EUR";

  return {
    grossRevenue,
    totalNights,
    currency,
  };
}