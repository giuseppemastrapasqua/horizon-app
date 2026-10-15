import { describe, expect, it } from "vitest";

import { buildRoss1000GuestIdswh } from "./guest-idswh";

describe("buildRoss1000GuestIdswh", () => {
  it("builds a stable 20-character identifier", () => {
    const first = buildRoss1000GuestIdswh("guest-123");
    const second = buildRoss1000GuestIdswh("guest-123");

    expect(first).toBe(second);
    expect(first).toHaveLength(20);
    expect(first).toMatch(/^H[0-9a-f]{19}$/);
  });

  it("builds different identifiers for different guests", () => {
    expect(buildRoss1000GuestIdswh("guest-123")).not.toBe(
      buildRoss1000GuestIdswh("guest-456"),
    );
  });

  it("normalizes surrounding whitespace", () => {
    expect(buildRoss1000GuestIdswh(" guest-123 ")).toBe(
      buildRoss1000GuestIdswh("guest-123"),
    );
  });

  it("rejects an empty internal guest identifier", () => {
    expect(() => buildRoss1000GuestIdswh("   ")).toThrow(
      "ROSS1000: identificativo interno ospite obbligatorio.",
    );
  });
});
