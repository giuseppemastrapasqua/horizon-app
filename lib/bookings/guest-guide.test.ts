import { afterEach, describe, expect, it, vi } from "vitest";
import { createGuestGuideReceipt, verifyGuestGuideReceipt } from "./guest-guide";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("guest guide receipt", () => {
  it("is scoped to the submitted booking link and expires with it", () => {
    vi.stubEnv("AUTH_SECRET", "guest-guide-test-secret");
    vi.useFakeTimers();
    const revokedAt = new Date();
    const expiresAt = new Date(Date.now() + 1000);
    const receipt = createGuestGuideReceipt("first-token-hash", revokedAt);
    expect(receipt).not.toBeNull();
    expect(verifyGuestGuideReceipt(receipt, "first-token-hash", { revokedAt, expiresAt })).toBe(true);
    expect(verifyGuestGuideReceipt(receipt, "other-token-hash", { revokedAt, expiresAt })).toBe(false);
    expect(verifyGuestGuideReceipt(receipt, "first-token-hash", {
      revokedAt: new Date(revokedAt.getTime() + 1), expiresAt,
    })).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(verifyGuestGuideReceipt(receipt, "first-token-hash", { revokedAt, expiresAt })).toBe(false);
  });
});
