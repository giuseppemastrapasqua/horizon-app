import { describe, expect, it } from "vitest";
import { BookingStatus, BookingOperationalStatus } from "@prisma/client";
import { buildPropertyMetrics } from "./build-property-metrics";

describe("property metrics", () => {
  it("excludes cancellations from every booking metric and uses checkout for revenue", () => {
    const stay = { grossAmount: 100, checkIn: new Date("2026-10-20"), checkOut: new Date("2026-10-22"), nights: 2, bookingStatus: BookingStatus.CONFIRMED, operationalStatus: BookingOperationalStatus.OK };
    const crossing = { ...stay, grossAmount: 200, checkIn: new Date("2026-10-30"), checkOut: new Date("2026-11-02"), nights: 3 };
    const input = { bookings: [stay, crossing], tasks: [], documents: [], now: new Date("2026-10-29T12:00:00Z") };
    const expected = buildPropertyMetrics(input);
    expect(expected.currentMonthRevenue).toBe(100);
    expect(expected.futureBookingsCount).toBe(1);
    expect(buildPropertyMetrics({ ...input, bookings: [...input.bookings, { ...crossing, grossAmount: 9000, bookingStatus: BookingStatus.CANCELLED, operationalStatus: BookingOperationalStatus.DOCUMENTS_PENDING }] })).toEqual(expected);
  });
});
