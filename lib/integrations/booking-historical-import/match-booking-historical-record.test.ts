import { describe, expect, it } from "vitest";

import {
  matchBookingHistoricalRecord,
  type BookingHistoricalRecord,
  type ExistingBookingForHistoricalMatch,
} from "./match-booking-historical-record";

function record(
  overrides: Partial<BookingHistoricalRecord> = {},
): BookingHistoricalRecord {
  return {
    externalBookingId: "BOOKING-123",
    guestName: "Mario Rossi",
    grossAmount: 780,
    currency: "EUR",
    checkIn: new Date("2026-07-16T00:00:00.000Z"),
    checkOut: new Date("2026-07-18T00:00:00.000Z"),
    ...overrides,
  };
}

function existing(
  overrides: Partial<ExistingBookingForHistoricalMatch> = {},
): ExistingBookingForHistoricalMatch {
  return {
    id: "booking-1",
    externalBookingId: "ICAL-UID-1",
    checkIn: new Date("2026-07-16T00:00:00.000Z"),
    checkOut: new Date("2026-07-18T00:00:00.000Z"),
    guestDataManuallyEdited: false,
    pricingDataManuallyEdited: false,
    ...overrides,
  };
}

describe("matchBookingHistoricalRecord", () => {
  it("esclude soggiorni conclusi entro il cutoff", () => {
    expect(
      matchBookingHistoricalRecord(
        record({
          checkIn: new Date("2025-12-29T00:00:00.000Z"),
          checkOut: new Date("2026-01-01T00:00:00.000Z"),
        }),
        [],
      ),
    ).toEqual({
      kind: "BEFORE_CUTOFF",
    });
  });

  it("preferisce il match per externalBookingId", () => {
    expect(
      matchBookingHistoricalRecord(
        record(),
        [
          existing({
            id: "booking-by-dates",
          }),
          existing({
            id: "booking-by-id",
            externalBookingId: "BOOKING-123",
            checkIn: new Date("2026-08-01T00:00:00.000Z"),
            checkOut: new Date("2026-08-03T00:00:00.000Z"),
          }),
        ],
      ),
    ).toEqual({
      kind: "MATCH_BY_EXTERNAL_ID",
      bookingId: "booking-by-id",
    });
  });

  it("usa le date quando UID iCal e ID Booking sono diversi", () => {
    expect(
      matchBookingHistoricalRecord(
        record(),
        [existing()],
      ),
    ).toEqual({
      kind: "MATCH_BY_DATES",
      bookingId: "booking-1",
    });
  });

  it("segnala match per date ambiguo", () => {
    expect(
      matchBookingHistoricalRecord(
        record(),
        [
          existing({
            id: "booking-1",
          }),
          existing({
            id: "booking-2",
          }),
        ],
      ),
    ).toEqual({
      kind: "AMBIGUOUS",
      bookingIds: [
        "booking-1",
        "booking-2",
      ],
    });
  });

  it("segnala una prenotazione storica assente", () => {
    expect(
      matchBookingHistoricalRecord(
        record(),
        [],
      ),
    ).toEqual({
      kind: "MISSING",
    });
  });
});