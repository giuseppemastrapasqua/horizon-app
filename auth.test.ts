import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const compareMock = vi.hoisted(() => vi.fn());
const userFindUniqueMock = vi.hoisted(() => vi.fn());
const consumeRateLimitMock = vi.hoisted(() => vi.fn());
const createRateLimitKeyMock = vi.hoisted(() => vi.fn());

type TestAuthConfig = {
  providers: Array<{
    authorize?: (
      credentials: Record<string, unknown>,
      request: Request,
    ) => Promise<unknown>;
  }>;
  callbacks: {
    jwt: (input: {
      token: Record<string, unknown>;
      user?: Record<string, unknown>;
    }) => Promise<unknown>;
  };
};
const captured = vi.hoisted(() => ({ config: null as TestAuthConfig | null }));
function getConfig() {
  if (!captured.config) throw new Error("Configurazione auth non disponibile.");
  return captured.config;
}

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
  default: (config: Record<string, unknown>) => ({
    id: "credentials",
    type: "credentials",
    ...config,
  }),
}));

vi.mock("next-auth", () => ({
  default: (config: TestAuthConfig) => {
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
  const provider = getConfig().providers[0];

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

    createRateLimitKeyMock.mockReturnValue("login:hashed-email");
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

    expect(compareMock).toHaveBeenCalledWith("correct-password", "stored-hash");

    expect(result).toEqual({
      id: "user-1",
      name: "Mario Rossi",
      email: "user@example.com",
      role: "SUPER_ADMIN",
      credentialVersion: createHash("sha256")
        .update("stored-hash")
        .digest("hex"),
    });
  });
});

describe("session authorization refresh", () => {
  beforeEach(() => userFindUniqueMock.mockReset());
  it("invalidates a JWT after the account is disabled or deleted", async () => {
    const jwt = getConfig().callbacks.jwt;
    userFindUniqueMock.mockResolvedValueOnce({
      id: "user-1",
      role: "OWNER",
      status: "DISABLED",
    });
    await expect(
      jwt({ token: { id: "user-1", role: "SUPER_ADMIN" } }),
    ).resolves.toBeNull();
    userFindUniqueMock.mockResolvedValueOnce(null);
    await expect(jwt({ token: { id: "user-1" } })).resolves.toBeNull();
  });
  it("replaces stale privilege and contact claims with current account data", async () => {
    userFindUniqueMock.mockResolvedValue({
      id: "user-1",
      role: "OWNER",
      status: "ACTIVE",
      fullName: "Owner",
      email: "owner@example.com",
      passwordHash: "stored-hash",
    });
    await expect(
      getConfig().callbacks.jwt({
        token: {
          id: "user-1",
          role: "SUPER_ADMIN",
          credentialVersion: createHash("sha256")
            .update("stored-hash")
            .digest("hex"),
        },
      }),
    ).resolves.toMatchObject({
      role: "OWNER",
      name: "Owner",
      email: "owner@example.com",
    });
  });
});

describe("credential version session revocation", () => {
  beforeEach(() => userFindUniqueMock.mockReset());
  const stamp = (value: string) =>
    createHash("sha256").update(value).digest("hex");
  const currentUser = {
    id: "user-1",
    role: "OWNER",
    status: "ACTIVE",
    passwordHash: "new-hash",
  };
  it("revokes an existing JWT when a password reset changes the stored hash", async () => {
    userFindUniqueMock.mockResolvedValue(currentUser);
    await expect(
      getConfig().callbacks.jwt({
        token: { id: "user-1", credentialVersion: stamp("old-hash") },
      }),
    ).resolves.toBeNull();
  });
  it("requires a fresh login for legacy unstamped JWTs", async () => {
    userFindUniqueMock.mockResolvedValue(currentUser);
    await expect(
      getConfig().callbacks.jwt({ token: { id: "user-1" } }),
    ).resolves.toBeNull();
  });
  it("accepts the hash version verified by credentials login", async () => {
    userFindUniqueMock.mockResolvedValue(currentUser);
    await expect(
      getConfig().callbacks.jwt({
        token: {},
        user: {
          id: "user-1",
          role: "OWNER",
          credentialVersion: stamp("new-hash"),
        },
      }),
    ).resolves.toMatchObject({
      id: "user-1",
      credentialVersion: stamp("new-hash"),
    });
  });
  it("rejects a password reset racing with credentials authorization", async () => {
    userFindUniqueMock.mockResolvedValue(currentUser);
    await expect(
      getConfig().callbacks.jwt({
        token: {},
        user: {
          id: "user-1",
          role: "OWNER",
          credentialVersion: stamp("old-hash"),
        },
      }),
    ).resolves.toBeNull();
  });
});
