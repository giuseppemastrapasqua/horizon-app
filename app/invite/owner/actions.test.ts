import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("bcryptjs", () => ({
  hash: vi.fn(async () => "bcrypt-hash"),
}));

vi.mock("@/lib/auth/property-owner-invite-token", () => ({
  hashOwnerInviteToken: vi.fn(() => "token-hash"),
  isOwnerInviteUsable: vi.fn(
    (invite) =>
      !invite.acceptedAt &&
      !invite.revokedAt &&
      invite.expiresAt.getTime() > Date.now(),
  ),
}));

const tx = {
  propertyOwnerInvite: {
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  propertyAccess: {
    upsert: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    propertyOwnerInvite: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(
      async (callback) => callback(tx),
    ),
  },
}));

import { prisma } from "@/lib/prisma";

import {
  acceptPropertyOwnerInviteAction,
} from "./actions";

const outerInviteFindUnique =
  vi.mocked(prisma.propertyOwnerInvite.findUnique);

function form() {
  const data = new FormData();
  data.set("token", "public-token");
  data.set("password", "Password123!");
  data.set("confirmPassword", "Password123!");
  return data;
}

function invite() {
  return {
    id: "invite-1",
    propertyId: "property-1",
    email: "owner@example.com",
    fullName: "Mario Rossi",
    expiresAt: new Date(Date.now() + 60_000),
    acceptedAt: null,
    revokedAt: null,
  };
}

describe("accept property owner invite", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    outerInviteFindUnique.mockResolvedValue(
      invite() as never,
    );

    tx.propertyOwnerInvite.findUnique.mockResolvedValue(
      invite(),
    );

    tx.propertyOwnerInvite.updateMany.mockResolvedValue({
      count: 1,
    });

    tx.propertyAccess.upsert.mockResolvedValue({});
  });

  it("creates a new OWNER and grants property access", async () => {
    tx.user.findUnique.mockResolvedValue(null);

    tx.user.create.mockResolvedValue({
      id: "user-1",
    });

    const result =
      await acceptPropertyOwnerInviteAction(form());

    expect(tx.user.create).toHaveBeenCalledWith({
      data: {
        fullName: "Mario Rossi",
        email: "owner@example.com",
        role: "OWNER",
        status: "ACTIVE",
        passwordHash: "bcrypt-hash",
      },
      select: {
        id: true,
      },
    });

    expect(tx.propertyAccess.upsert).toHaveBeenCalledWith({
      where: {
        propertyId_userId: {
          propertyId: "property-1",
          userId: "user-1",
        },
      },
      update: {
        role: "OWNER",
        active: true,
      },
      create: {
        propertyId: "property-1",
        userId: "user-1",
        role: "OWNER",
        active: true,
      },
    });

    expect(result.email).toBe(
      "owner@example.com",
    );
  });

  it("reuses an active existing account without changing its password or role", async () => {
    tx.user.findUnique.mockResolvedValue({
      id: "user-existing",
      email: "owner@example.com",
      role: "MANAGER",
      status: "ACTIVE",
      passwordHash: "existing-hash",
    });

    await acceptPropertyOwnerInviteAction(form());

    expect(tx.user.create).not.toHaveBeenCalled();
    expect(tx.user.update).not.toHaveBeenCalled();

    expect(tx.propertyAccess.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          propertyId_userId: {
            propertyId: "property-1",
            userId: "user-existing",
          },
        },
      }),
    );
  });

  it("activates an existing account without a password", async () => {
    tx.user.findUnique.mockResolvedValue({
      id: "user-existing",
      email: "owner@example.com",
      role: "OWNER",
      status: "INACTIVE",
      passwordHash: null,
    });

    await acceptPropertyOwnerInviteAction(form());

    expect(tx.user.update).toHaveBeenCalledWith({
      where: {
        id: "user-existing",
      },
      data: {
        passwordHash: "bcrypt-hash",
        status: "ACTIVE",
      },
    });
  });

  it("blocks suspended accounts", async () => {
    tx.user.findUnique.mockResolvedValue({
      id: "user-existing",
      email: "owner@example.com",
      role: "OWNER",
      status: "SUSPENDED",
      passwordHash: "existing-hash",
    });

    await expect(
      acceptPropertyOwnerInviteAction(form()),
    ).rejects.toThrow(
      "richiede una verifica amministrativa",
    );

    expect(
      tx.propertyAccess.upsert,
    ).not.toHaveBeenCalled();
  });

  it("marks the invite as accepted", async () => {
    tx.user.findUnique.mockResolvedValue(null);

    tx.user.create.mockResolvedValue({
      id: "user-1",
    });

    await acceptPropertyOwnerInviteAction(form());

    expect(
      tx.propertyOwnerInvite.updateMany,
    ).toHaveBeenCalledWith({
      where: {
        id: "invite-1",
        acceptedAt: null,
        revokedAt: null,
        expiresAt: {
          gt: expect.any(Date),
        },
      },
      data: {
        acceptedAt: expect.any(Date),
      },
    });
  });
});