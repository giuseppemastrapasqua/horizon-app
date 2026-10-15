import { describe, expect, it } from "vitest";
import { monthlyPerformance } from "./monthly-performance";
const start = new Date("2026-10-01T00:00:00Z");
const end = new Date("2026-11-01T00:00:00Z");
const stay = {
  propertyId: "own",
  checkIn: new Date("2026-09-29T00:00:00Z"),
  checkOut: new Date("2026-10-02T00:00:00Z"),
  nights: 3,
  grossAmount: 300,
  currency: "EUR",
  bookingStatus: "CONFIRMED",
};

describe("monthly performance", () => {
  it("clips occupied nights but recognizes the whole stay at checkout", () => {
    const metrics = monthlyPerformance(["own"], [stay], start, end);
    expect(metrics.occupiedNights).toBe(1);
    expect(metrics.availableNights).toBe(31);
    expect(metrics.revenues).toEqual([
      { currency: "EUR", gross: 300, nights: 3, stays: 1 },
    ]);
  });
  it("does not recognize a stay checking out next month", () => {
    const metrics = monthlyPerformance(
      ["own"],
      [{ ...stay, checkIn: new Date("2026-10-30"), checkOut: end, nights: 2 }],
      start,
      end,
    );
    expect(metrics.occupiedNights).toBe(2);
    expect(metrics.revenues).toEqual([]);
  });
  it("ignores foreign and cancelled bookings and deduplicates overlapping nights", () => {
    const metrics = monthlyPerformance(
      ["own"],
      [
        stay,
        stay,
        { ...stay, propertyId: "foreign" },
        { ...stay, bookingStatus: "CANCELLED" },
      ],
      start,
      end,
    );
    expect(metrics.occupiedNights).toBe(1);
    expect(metrics.dailyOccupied[0]).toBe(1);
  });
  it("keeps different currencies separate", () => {
    const metrics = monthlyPerformance(
      ["own"],
      [stay, { ...stay, currency: "USD" }],
      start,
      end,
    );
    expect(metrics.revenues.map((item) => item.currency)).toEqual([
      "EUR",
      "USD",
    ]);
  });
});
