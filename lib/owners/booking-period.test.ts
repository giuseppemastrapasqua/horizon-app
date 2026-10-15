import { describe, expect, it } from "vitest";
import { ownerBookingPeriod } from "./booking-period";
describe("OWNER booking period", () => {
  it("includes ongoing stays, includes the final selected night and excludes checkout-only overlap", () => {
    expect(ownerBookingPeriod("2026-10-01", "2026-10-31")).toEqual({ checkOut: { gt: new Date("2026-10-01T00:00:00Z") }, checkIn: { lt: new Date("2026-11-01T00:00:00Z") } });
  });
  it("supports open-ended filters", () => { expect(ownerBookingPeriod()).toEqual({}); expect(ownerBookingPeriod("2026-10-01")).toHaveProperty("checkOut"); expect(ownerBookingPeriod(undefined, "2026-10-31")).toHaveProperty("checkIn"); });
  it.each([["2026-02-30", "2026-03-01"], ["2026-10-31", "2026-10-01"], ["bad", undefined]])("rejects invalid or reversed dates", (from, to) => { expect(() => ownerBookingPeriod(from, to)).toThrow(); });
});
