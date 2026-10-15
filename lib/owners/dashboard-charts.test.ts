import { describe, expect, it } from "vitest";
import { buildOwnerCharts, ownerChartWindow } from "./dashboard-charts";
const now = new Date("2026-10-15T12:00:00Z");
const booking = { propertyId: "own", checkIn: new Date("2026-09-30"), checkOut: new Date("2026-10-02"), nights: 2, channel: "BOOKING", currency: "EUR", grossAmount: 360 };
describe("owner portfolio charts", () => {
  it("uses exactly twelve calendar months across a year boundary", () => {
    expect(ownerChartWindow(now)).toEqual({ from: new Date("2025-11-01"), to: new Date("2026-11-01") });
  });
  it("splits nights across months but attributes gross to checkout and deduplicates occupied nights", () => {
    const result = buildOwnerCharts(["own"], [booking, booking], [], now);
    expect(result.occupancy[10].nights).toBe(1);
    expect(result.occupancy[11].nights).toBe(1);
    expect(result.financial[0].months[10].gross).toBe(0);
    expect(result.financial[0].months[11]).toMatchObject({ gross: 720, adr: 180, net: null });
  });
  it("keeps currencies separate and excludes foreign property bookings", () => {
    const result = buildOwnerCharts(["own"], [booking, { ...booking, currency: "USD", grossAmount: 100 }, { ...booking, propertyId: "foreign", grossAmount: 99999 }], [], now);
    expect(result.financial.map(group => [group.currency, group.months[11].gross])).toEqual([["EUR", 360], ["USD", 100]]);
  });
  it("uses saved totals including adjustments and does not fabricate missing report months", () => {
    const result = buildOwnerCharts(["own"], [], [{ referenceMonth: new Date("2026-10-01"), currency: "EUR", finalAmount: "123.45", adjustments: [{ amount: "-3.45" }] }], now);
    expect(result.financial[0].months[11].net).toBe(120);
    expect(result.financial[0].months[10].net).toBeNull();
    expect(result.occupancy[11].value).toBe(0);
  });
});
