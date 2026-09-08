export const BOOKING_HISTORICAL_CUTOFF =
  new Date("2026-01-01T00:00:00.000Z");

export type BookingHistoricalRecord = {
  externalBookingId: string;
  guestName: string;
  grossAmount: number;
  currency: string;
  checkIn: Date;
  checkOut: Date;
};

export type ExistingBookingForHistoricalMatch = {
  id: string;
  externalBookingId: string | null;
  checkIn: Date;
  checkOut: Date;
  guestDataManuallyEdited: boolean;
  pricingDataManuallyEdited: boolean;
};

export type BookingHistoricalMatch =
  | {
      kind: "BEFORE_CUTOFF";
    }
  | {
      kind: "MATCH_BY_EXTERNAL_ID";
      bookingId: string;
    }
  | {
      kind: "MATCH_BY_DATES";
      bookingId: string;
    }
  | {
      kind: "AMBIGUOUS";
      bookingIds: string[];
    }
  | {
      kind: "MISSING";
    };

export function matchBookingHistoricalRecord(
  record: BookingHistoricalRecord,
  existingBookings: ExistingBookingForHistoricalMatch[],
): BookingHistoricalMatch {
  if (record.checkOut <= BOOKING_HISTORICAL_CUTOFF) {
    return {
      kind: "BEFORE_CUTOFF",
    };
  }

  const externalId = record.externalBookingId.trim();

  if (externalId) {
    const byExternalId = existingBookings.filter(
      (booking) =>
        booking.externalBookingId?.trim() === externalId,
    );

    if (byExternalId.length === 1) {
      return {
        kind: "MATCH_BY_EXTERNAL_ID",
        bookingId: byExternalId[0].id,
      };
    }

    if (byExternalId.length > 1) {
      return {
        kind: "AMBIGUOUS",
        bookingIds: byExternalId.map((booking) => booking.id),
      };
    }
  }

  const byDates = existingBookings.filter(
    (booking) =>
      sameInstant(booking.checkIn, record.checkIn) &&
      sameInstant(booking.checkOut, record.checkOut),
  );

  if (byDates.length === 1) {
    return {
      kind: "MATCH_BY_DATES",
      bookingId: byDates[0].id,
    };
  }

  if (byDates.length > 1) {
    return {
      kind: "AMBIGUOUS",
      bookingIds: byDates.map((booking) => booking.id),
    };
  }

  return {
    kind: "MISSING",
  };
}

function sameInstant(
  first: Date,
  second: Date,
): boolean {
  return first.getTime() === second.getTime();
}