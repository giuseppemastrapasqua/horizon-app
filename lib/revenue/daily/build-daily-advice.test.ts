import { describe, expect, it } from "vitest";
import { buildDailyAdvice, type DailyAdviceInput } from "./build-daily-advice";
const date = (key: string) => new Date(`${key}T00:00:00Z`);
const input = (): DailyAdviceInput => ({ from: date("2026-10-16"), to: date("2026-10-18"), now: date("2026-10-15"), baseForTwo: 100, floor: null, ceiling: null, extraGuestFee: 20, guests: 4, maxGuests: 6, stays: [], blocks: [], market: [] });
describe("daily internal pricing advice", () => {
  it("prices nights separately and charges supplements only from the third guest", () => {
    const rows = buildDailyAdvice(input());
    expect(rows).toHaveLength(3);
    expect(rows[0].base).not.toBe(rows[2].base);
    expect(rows.every((row) => row.selectedPrice === row.base! + 40)).toBe(true);
    expect(buildDailyAdvice({ ...input(), guests: 1 })[0].selectedPrice).toBe(rows[0].base);
  });
  it("deduplicates occupied nights and excludes checkout day", () => {
    const stay = { checkIn: date("2026-10-16"), checkOut: date("2026-10-18"), bookedAt: null };
    const rows = buildDailyAdvice({ ...input(), stays: [stay, stay], blocks: [{ startDate: date("2026-10-17"), endDate: date("2026-10-19") }] });
    expect(rows[0].occupancy).toBe(7);
    expect(rows[0].blockedNights).toBe(2);
    expect(rows.map((row) => row.status)).toEqual(["Prenotata", "Prenotata", "Bloccata"]);
  });
  it("never bases prices on mock or expired market observations", () => {
    const market = { date: date("2026-10-16"), capturedAt: date("2026-10-15"), provider: "LOCAL", currency: "EUR", marketMedianPrice: 999, confidence: 99 };
    const original = buildDailyAdvice(input())[0];
    expect(buildDailyAdvice({ ...input(), market: [market] })[0]).toEqual(original);
    expect(buildDailyAdvice({ ...input(), market: [{ ...market, provider: "AIRDNA", capturedAt: date("2026-10-01") }] })[0]).toEqual(original);
  });
  it("requires a two-person anchor even with market data of unknown occupancy basis", () => {
    const rows = buildDailyAdvice({ ...input(), baseForTwo: null, market: [{ date: date("2026-10-16"), capturedAt: date("2026-10-15"), provider: "AIRDNA", currency: "EUR", marketMedianPrice: 999, confidence: 99 }] });
    expect(rows[0].base).toBeNull();
    expect(rows[0].confidence).toBe("Non disponibile");
  });
  it("enforces manager limits and capacity", () => {
    const rows = buildDailyAdvice({ ...input(), floor: 120, ceiling: 130 });
    expect(rows.every((row) => row.base === 120 && row.limited)).toBe(true);
    expect(() => buildDailyAdvice({ ...input(), guests: 7 })).toThrow();
    expect(() => buildDailyAdvice({ ...input(), floor: 120, ceiling: 100 })).toThrow();
  });
  it("does not invent pickup from missing booking dates", () => {
    const stay = { checkIn: date("2026-10-20"), checkOut: date("2026-10-21"), bookedAt: null };
    expect(buildDailyAdvice({ ...input(), stays: [stay, stay, stay] })[0].pickup).toBe(0);
  });
  it("does not discount low occupancy when calendar completeness is unknown", () => {
    const rows = buildDailyAdvice(input());
    expect(rows.every((row) => row.factors.every((factor) => factor.percent >= 0))).toBe(true);
    expect(buildDailyAdvice({ ...input(), calendarComplete: true })[0].base).toBeLessThan(rows[0].base!);
  });
  it("rejects invalid and excessively long ranges", () => {
    expect(() => buildDailyAdvice({ ...input(), to: date("2026-10-01") })).toThrow();
    expect(() => buildDailyAdvice({ ...input(), to: date("2027-10-01") })).toThrow();
    expect(() => buildDailyAdvice({ ...input(), baseForTwo: NaN })).toThrow();
  });
});
