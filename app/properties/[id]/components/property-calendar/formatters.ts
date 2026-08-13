import type {
  CalendarBooking,
} from "./types";

export function formatCompactMoney(
  amount: number,
) {
  return new Intl.NumberFormat(
    "it-IT",
    {
      style:
        "currency",

      currency:
        "EUR",

      maximumFractionDigits:
        0,
    },
  ).format(
    amount,
  );
}

export function formatDateRange(
  booking:
    CalendarBooking,
) {
  return `${new Date(
    booking.checkIn,
  ).toLocaleDateString(
    "it-IT",
  )} → ${new Date(
    booking.checkOut,
  ).toLocaleDateString(
    "it-IT",
  )}`;
}

export function formatMoney(
  amount: number,
  currency: string,
) {
  return new Intl.NumberFormat(
    "it-IT",
    {
      style:
        "currency",

      currency:
        currency ||
        "EUR",
    },
  ).format(
    amount,
  );
}
