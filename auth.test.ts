import { beforeEach, describe, expect, it, vi } from "vitest";

const compareMock = vi.hoisted(() => vi.fn());
const userFindUniqueMock = vi.hoisted(() => vi.fn());
const consumeRateLimitMock = vi.hoisted(() => vi.fn());
const createRateLimitKeyMock = vi.hoisted(() => vi.fn());

const captured = vi.hoisted(() => ({
  config: null as any,
}));

vi.mock("bcryptjs", () => ({
  compare: compareMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: userFindUniqueMock,
    },
  },
}));

vi.mock("@/lib/security/rate-limiter", () => ({
  consumeRateLimit: consumeRateLimitMock,
  createRateLimitKey: createRateLimitKeyMock,
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: (config: any) => ({
    id: "credentials",
    type: "credentials",
    ...config,
  }),
}));

vi.mock("next-auth", () => ({
  default: (config: any) => {
    captured.config = config;

    return {
      handlers: {},
      auth: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    };
  },
}));

await import("./auth");

function getAuthorize() {
  const provider = captured.config.providers[0];

  if (!provider?.authorize) {
    throw new Error("Credentials authorize non trovato.");
  }

  return provider.authorize as (
    credentials: Record<string, unknown>,
    request: Request,
  ) => Promise<unknown>;
}

describe("login rate limit", () => {
  beforeEach(() => {
    compareMock.mockReset();
    userFindUniqueMock.mockReset();
    consumeRateLimitMock.mockReset();
    createRateLimitKeyMock.mockReset();

    createRateLimitKeyMock.mockReturnValue(
      "login:hashed-email",
    );
  });

  it("blocca il login prima di query utente e bcrypt quando il limite è superato", async () => {
    consumeRateLimitMock.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 300,
    });

    const authorize = getAuthorize();

    const result = await authorize(
      {
        email: "USER@Example.com",
        password: "wrong-password",
      },
      new Request("https://horizongest.it/api/auth/callback/credentials"),
    );

    expect(createRateLimitKeyMock).toHaveBeenCalledWith(
      "login",
      "user@example.com",
    );

    expect(consumeRateLimitMock).toHaveBeenCalledWith({
      key: "login:hashed-email",
      limit: 5,
      windowSeconds: 600,
    });

    expect(userFindUniqueMock).not.toHaveBeenCalled();
    expect(compareMock).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
  it("prosegue con il login normale quando il rate limit consente la richiesta", async () => {
    consumeRateLimitMock.mockResolvedValueOnce({
      allowed: true,
      remaining: 4,
      retryAfterSeconds: 0,
    });

    userFindUniqueMock.mockResolvedValueOnce({
      id: "user-1",
      fullName: "Mario Rossi",
      email: "user@example.com",
      passwordHash: "stored-hash",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    });

    compareMock.mockResolvedValueOnce(true);

    const authorize = getAuthorize();

    const result = await authorize(
      {
        email: "USER@Example.com",
        password: "correct-password",
      },
      new Request("https://horizongest.it/api/auth/callback/credentials"),
    );

    expect(userFindUniqueMock).toHaveBeenCalledWith({
      where: {
        email: "user@example.com",
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        passwordHash: true,
        role: true,
        status: true,
      },
    });

    expect(compareMock).toHaveBeenCalledWith(
      "correct-password",
      "stored-hash",
    );

    expect(result).toEqual({
      id: "user-1",
      name: "Mario Rossi",
      email: "user@example.com",
      role: "SUPER_ADMIN",
    });
  });
});
