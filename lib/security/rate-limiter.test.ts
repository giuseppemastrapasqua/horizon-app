import { beforeEach, describe, expect, it, vi } from "vitest";

const queryRawMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: queryRawMock,
  },
}));

import { consumeRateLimit, createRateLimitKey } from "./rate-limiter";

describe("createRateLimitKey", () => {
  it("crea una chiave deterministica senza esporre l'identificatore", () => {
    const identifier = "user@example.com";

    const first = createRateLimitKey("login", identifier);
    const second = createRateLimitKey("login", identifier);

    expect(first).toBe(second);
    expect(first).toMatch(/^login:[a-f0-9]{64}$/);
    expect(first).not.toContain(identifier);
  });

  it("separa lo stesso identificatore tra scope diversi", () => {
    const identifier = "user@example.com";

    expect(createRateLimitKey("login", identifier)).not.toBe(
      createRateLimitKey("password-reset", identifier),
    );
  });
});
describe("consumeRateLimit", () => {
  beforeEach(() => {
    queryRawMock.mockReset();
  });

  it("consente la richiesta quando il bucket resta entro il limite", async () => {
    queryRawMock.mockResolvedValueOnce([
      {
        count: 2,
        expiresAt: new Date("2026-09-19T08:11:00.000Z"),
      },
    ]);

    const result = await consumeRateLimit({
      key: "login:test-key",
      limit: 5,
      windowSeconds: 60,
    });

    expect(result).toEqual({
      allowed: true,
      remaining: 3,
      retryAfterSeconds: 0,
    });

    expect(queryRawMock).toHaveBeenCalledOnce();
  });

  it("blocca la richiesta quando il bucket supera il limite", async () => {
    queryRawMock.mockResolvedValueOnce([
      {
        count: 6,
        expiresAt: new Date(Date.now() + 30_000),
      },
    ]);

    const result = await consumeRateLimit({
      key: "login:test-key",
      limit: 5,
      windowSeconds: 60,
    });

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(30);
  });
  it("rifiuta una chiave vuota senza interrogare il database", async () => {
    await expect(
      consumeRateLimit({
        key: "   ",
        limit: 5,
        windowSeconds: 60,
      }),
    ).rejects.toThrow("Rate limit key non valida.");

    expect(queryRawMock).not.toHaveBeenCalled();
  });

  it("rifiuta un limite non positivo senza interrogare il database", async () => {
    await expect(
      consumeRateLimit({
        key: "login:test-key",
        limit: 0,
        windowSeconds: 60,
      }),
    ).rejects.toThrow("Rate limit non valido.");

    expect(queryRawMock).not.toHaveBeenCalled();
  });

  it("rifiuta una finestra non positiva senza interrogare il database", async () => {
    await expect(
      consumeRateLimit({
        key: "login:test-key",
        limit: 5,
        windowSeconds: 0,
      }),
    ).rejects.toThrow("Rate limit window non valida.");

    expect(queryRawMock).not.toHaveBeenCalled();
  });
});
