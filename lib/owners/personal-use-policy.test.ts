import { describe, expect, it } from "vitest";
import {
  assertPersonalUseLimit,
  parsePersonalUseDate,
} from "./personal-use-policy";
const day = parsePersonalUseDate;

describe("owner personal use limit", () => {
  it("validates dates without normalizing invalid calendar days", () => {
    expect(() => day("2026-02-30")).toThrow();
    expect(() => day("2026-1-1")).toThrow();
    expect(day("2028-02-29").getUTCDate()).toBe(29);
  });
  it("counts inclusive days and rejects 31 days", () => {
    expect(() =>
      assertPersonalUseLimit(day("2026-10-01"), day("2026-10-30"), []),
    ).not.toThrow();
    expect(() =>
      assertPersonalUseLimit(day("2026-10-01"), day("2026-10-31"), []),
    ).toThrow();
  });
  it("enforces annual portfolio totals and deduplicates overlapping days", () => {
    const periods = [
      { startDate: day("2026-01-01"), endDate: day("2026-01-20") },
    ];
    expect(() =>
      assertPersonalUseLimit(day("2026-10-01"), day("2026-10-11"), periods),
    ).toThrow("30 giorni");
    expect(() =>
      assertPersonalUseLimit(day("2026-01-10"), day("2026-01-30"), periods),
    ).not.toThrow();
  });
  it("splits use at the year boundary", () => {
    expect(() =>
      assertPersonalUseLimit(day("2026-12-25"), day("2027-01-10"), [
        { startDate: day("2026-01-01"), endDate: day("2026-01-23") },
      ]),
    ).not.toThrow();
    expect(() =>
      assertPersonalUseLimit(day("2026-12-25"), day("2027-01-11"), [
        { startDate: day("2027-02-01"), endDate: day("2027-02-20") },
      ]),
    ).toThrow();
  });
});
