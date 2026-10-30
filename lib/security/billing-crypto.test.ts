import { afterEach, expect, it, vi } from "vitest";
import { protectBilling, revealBilling, revealInvoice } from "./billing-crypto";
afterEach(() => vi.unstubAllEnvs());
it("encrypts fiscal fields with authenticated encryption and keeps routing metadata", () => {
  vi.stubEnv("HORIZON_BILLING_ENCRYPTION_KEY", Buffer.alloc(32, 7).toString("base64"));
  const profile = { ownerId: "test", entityType: "PRIVATE", taxCode: "SYNTHETIC", address: "Test address", email: "test@example.invalid", pec: null };
  const saved = protectBilling(profile);
  expect(saved.taxCode).not.toContain("SYNTHETIC"); expect(saved.entityType).toBe("PRIVATE");
  expect(revealBilling(saved)).toEqual(profile);
  expect(revealInvoice({ recipient: saved })).toEqual({ recipient: profile });
  const corrupted = { ...saved, taxCode: saved.taxCode.slice(0, -4) + "AAAA" };
  expect(() => revealBilling(corrupted)).toThrow();
  vi.stubEnv("HORIZON_BILLING_ENCRYPTION_KEY", "");
  expect(() => revealBilling(saved)).toThrow(); expect(() => protectBilling(profile)).toThrow();
});
