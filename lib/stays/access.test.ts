import { afterEach, describe, expect, it, vi } from "vitest";
import { hasStaysAccess, parseStayQuery, safePhotoUrl, staysPropertyIds } from "./access";
afterEach(() => vi.unstubAllEnvs());
describe("Stays service boundary", () => {
  it("fails closed and requires its own bearer token", () => {
    vi.stubEnv("STAYS_SERVICE_TOKEN", "a".repeat(64));
    expect(hasStaysAccess(new Request("https://horizon.test"))).toBe(false);
    expect(hasStaysAccess(new Request("https://horizon.test", { headers: { authorization: "Bearer " + "b".repeat(64) } }))).toBe(false);
    expect(hasStaysAccess(new Request("https://horizon.test", { headers: { authorization: "Bearer " + "a".repeat(64) } }))).toBe(true);
    vi.stubEnv("STAYS_SERVICE_TOKEN", "");
    expect(hasStaysAccess(new Request("https://horizon.test"))).toBe(false);
  });
  it("requires an explicit property allowlist", () => {
    vi.stubEnv("STAYS_PROPERTY_IDS", ""); expect(staysPropertyIds()).toEqual([]);
    vi.stubEnv("STAYS_PROPERTY_IDS", "one, two"); expect(staysPropertyIds()).toEqual(["one", "two"]);
  });
  it("rejects invalid, reversed, incomplete, oversized dates and guests", () => {
    for (const q of ["from=2027-02-30&to=2027-03-04", "from=2027-02-01", "from=2027-02-01&to=2027-02-01", "from=2027-01-01&to=2027-12-31", "guests=1.5"])
      expect(() => parseStayQuery(new URL("https://horizon.test?" + q))).toThrow();
    expect(parseStayQuery(new URL("https://horizon.test?from=2027-01-01&to=2027-01-03&guests=4")).guests).toBe(4);
  });
  it("excludes historical missing uploads and unapproved photo hosts", () => {
    expect(safePhotoUrl("/uploads/private.jpg")).toBeNull();
    expect(safePhotoUrl("https://example.org/photo.jpg")).toBeNull();
    expect(safePhotoUrl("https://anyzciwyxkfrheavqjpf.supabase.co/storage/v1/object/public/property-images/photo.jpg")).toContain("/photo.jpg");
  });
});
