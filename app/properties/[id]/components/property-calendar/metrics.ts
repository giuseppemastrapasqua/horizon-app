import type {
  CalendarBooking,
  CalendarMetrics,
} from "./types";

import {
  addDays,
  dateKey,
  differenceInDays,
  startOfDay,
} from "./utils/dates";

export function calculateMetricsForMonth(
  bookings:
    CalendarBooking[],
  month: Date,
) {
  return calculateMetrics({
    bookings:
      bookings.filter(
        (booking) =>
          overlapsMonth(
            booking,
            month,
          ),
      ),

    month,
  });
}

export function calculateMetrics({
  bookings,
  month,
}: {
  bookings:
    CalendarBooking[];

  month: Date;
}): CalendarMetrics {
  const monthStart =
    new Date(
      month.getFullYear(),
      month.getMonth(),
      1,
    );

  const monthEnd =
    new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      1,
    );

  const occupied =
    new Set<string>();

  let grossRevenue = 0;

  for (
    const booking
    of bookings
  ) {
    grossRevenue +=
      booking.grossAmount;

    const bookingStart =
      startOfDay(
        new Date(
          booking.checkIn,
        ),
      );

    const bookingEnd =
      startOfDay(
        new Date(
          booking.checkOut,
        ),
      );

    let cursor =
      bookingStart >
      monthStart
        ? bookingStart
        : monthStart;

    const end =
      bookingEnd <
      monthEnd
        ? bookingEnd
        : monthEnd;

    while (
      cursor < end
    ) {
      occupied.add(
        dateKey(
          cursor,
        ),
      );

      cursor =
        addDays(
          cursor,
          1,
        );
    }
  }

  const daysInMonth =
    differenceInDays(
      monthEnd,
      monthStart,
    );

  const occupiedNights =
    occupied.size;

  const freeNights =
    Math.max(
      0,
      daysInMonth -
        occupiedNights,
    );

  const occupancyRate =
    daysInMonth > 0
      ? Math.round(
          (
            occupiedNights /
            daysInMonth
          ) *
            100,
        )
      : 0;

  return {
    occupiedNights,
    freeNights,
    occupancyRate,

    bookingsCount:
      bookings.length,

    grossRevenue,

    currency:
      bookings[0]
        ?.currency ??
      "EUR",
  };
}

export function overlapsMonth(
  booking:
    CalendarBooking,
  month: Date,
) {
  const monthStart =
    new Date(
      month.getFullYear(),
      month.getMonth(),
      1,
    );

  const monthEnd =
    new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      1,
    );

  const checkIn =
    new Date(
      booking.checkIn,
    );

  const checkOut =
    new Date(
      booking.checkOut,
    );

  return (
    checkIn <
      monthEnd &&
    checkOut >
      monthStart
  );
}

