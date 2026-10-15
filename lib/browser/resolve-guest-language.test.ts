import { describe, expect, it } from "vitest";
import { resolveGuestLanguage } from "./resolve-guest-language";

describe("guest language preference", () => {
  it("preserves a supported guest choice before browser defaults", () => {
    expect(resolveGuestLanguage("fr", "en-GB")).toBe("fr");
  });
  it("falls back to browser language when storage is unavailable or invalid", () => {
    expect(resolveGuestLanguage(null, "es-MX")).toBe("es");
    expect(resolveGuestLanguage("invalid", "pt-BR")).toBe("pt");
  });
  it("defaults to Italian for unsupported locales", () => {
    expect(resolveGuestLanguage(null, "de-DE")).toBe("it");
  });
});
