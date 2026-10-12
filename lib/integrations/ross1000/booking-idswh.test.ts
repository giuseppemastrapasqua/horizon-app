import { describe, expect, it } from "vitest";

import { buildRoss1000BookingIdswh } from "./booking-idswh";

describe("buildRoss1000BookingIdswh", () => {
  it("generates a deterministic 20-character booking idswh", () => {
    const first = buildRoss1000BookingIdswh("booking-123");
    const second = buildRoss1000BookingIdswh("booking-123");

    expect(first).toBe(second);
    expect(first).toHaveLength(20);
    expect(first.startsWith("R")).toBe(true);
  });

  it("generates different idswh values for different bookings", () => {
    expect(
      buildRoss1000BookingIdswh("booking-123"),
    ).not.toBe(
      buildRoss1000BookingIdswh("booking-456"),
    );
  });

  it("normalizes surrounding whitespace", () => {
    expect(
      buildRoss1000BookingIdswh(" booking-123 "),
    ).toBe(
      buildRoss1000BookingIdswh("booking-123"),
    );
  });

  it("rejects an empty booking id", () => {
    expect(() =>
      buildRoss1000BookingIdswh("   "),
    ).toThrow(
      "ROSS1000: identificativo interno prenotazione obbligatorio.",
    );
  });
});
