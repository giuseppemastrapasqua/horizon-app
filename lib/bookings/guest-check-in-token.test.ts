import { describe, expect, it } from "vitest";
import {
  calculateGuestCheckInLinkExpiry,
  generateGuestCheckInToken,
  hashGuestCheckInToken,
  isGuestCheckInLinkUsable,
} from "./guest-check-in-token";

describe("guest check-in token", () => {
  it("genera token casuali e salva solo un hash stabile", () => {
    const first = generateGuestCheckInToken();
    const second = generateGuestCheckInToken();

    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThanOrEqual(40);
    expect(hashGuestCheckInToken(first)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashGuestCheckInToken(first)).toBe(hashGuestCheckInToken(first));
  });

  it("scade 24 ore dopo il checkout", () => {
    const checkOut = new Date("2026-09-10T10:00:00.000Z");

    expect(calculateGuestCheckInLinkExpiry(checkOut).toISOString()).toBe(
      "2026-09-11T10:00:00.000Z",
    );
  });

  it("rifiuta link revocati o scaduti", () => {
    const now = new Date("2026-09-08T10:00:00.000Z");

    expect(
      isGuestCheckInLinkUsable({
        expiresAt: new Date("2026-09-09T10:00:00.000Z"),
        revokedAt: null,
        now,
      }),
    ).toBe(true);

    expect(
      isGuestCheckInLinkUsable({
        expiresAt: new Date("2026-09-09T10:00:00.000Z"),
        revokedAt: new Date("2026-09-08T09:00:00.000Z"),
        now,
      }),
    ).toBe(false);

    expect(
      isGuestCheckInLinkUsable({
        expiresAt: now,
        revokedAt: null,
        now,
      }),
    ).toBe(false);
  });
});
