import { describe, expect, it } from "vitest";
import {
  createReportBookingSnapshot,
  readReportBookingSnapshot,
} from "./report-booking-snapshot";

const booking = {
  id: "booking-1",
  checkIn: new Date("2026-09-29T00:00:00Z"),
  checkOut: new Date("2026-10-02T00:00:00Z"),
  nights: 3,
  guests: 2,
  channel: "DIRECT",
  currency: "EUR",
  guestName: "Private guest",
  guestEmail: "private@example.com",
};
const breakdown = {
  grossBooking: 500,
  otaCommission: 0,
  cleaningCost: 50,
  grossProperty: 450,
  managementCommission: 90,
  managementCommissionTaxableBase: 90,
  managementCommissionVat: 19.8,
  managementCommissionTotal: 109.8,
  taxAmount: 94.5,
  otherAmount: null,
  netProperty: 245.7,
};

describe("saved report booking detail", () => {
  it("preserves the calculation without personal guest data", () => {
    const detail = createReportBookingSnapshot([booking], [breakdown]);
    expect(JSON.stringify(detail)).not.toContain("Private guest");
    expect(JSON.stringify(detail)).not.toContain("private@example.com");
    booking.guests = 4;
    const saved = readReportBookingSnapshot({ bookingDetail: detail });
    expect(saved?.[0].guests).toBe(2);
    expect(saved?.[0].breakdown.netProperty).toBe(245.7);
    expect(saved?.[0].checkOut).toEqual(new Date("2026-10-02T00:00:00Z"));
    expect(saved?.[0].guestName).not.toContain("Private");
  });
  it("distinguishes a legacy report from a corrupt saved snapshot", () => {
    expect(readReportBookingSnapshot({ type: "HORIZON_STANDARD" })).toBeNull();
    expect(
      readReportBookingSnapshot({
        bookingDetail: { version: 1, bookings: [] },
      }),
    ).toEqual([]);
    expect(() =>
      readReportBookingSnapshot({
        bookingDetail: { version: 2, bookings: [] },
      }),
    ).toThrow("non valido");
  });
  it("rejects missing breakdowns and nonfinite money", () => {
    expect(() => createReportBookingSnapshot([booking], [])).toThrow(
      "incompleto",
    );
    expect(() =>
      createReportBookingSnapshot(
        [booking],
        [{ ...breakdown, netProperty: Infinity }],
      ),
    ).toThrow();
  });
});
