import { describe, expect, it } from "vitest";

import { buildBookingAccountingPeriodWhere } from "./booking-accounting-period";

describe("buildBookingAccountingPeriodWhere", () => {
  it("usa il check-out per Booking e il check-in per gli altri canali", () => {
    const monthStart = new Date("2026-09-01T00:00:00.000Z");
    const nextMonthStart = new Date("2026-10-01T00:00:00.000Z");

    expect(
      buildBookingAccountingPeriodWhere({
        monthStart,
        nextMonthStart,
      })
    ).toEqual({
      OR: [
        {
          channel: "BOOKING",
          checkOut: {
            gte: monthStart,
            lt: nextMonthStart,
          },
        },
        {
          channel: {
            not: "BOOKING",
          },
          checkIn: {
            gte: monthStart,
            lt: nextMonthStart,
          },
        },
      ],
    });
  });
});
