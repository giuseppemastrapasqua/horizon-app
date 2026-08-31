import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireRoles: vi.fn(),
}));

vi.mock("@/lib/auth/property-owner-invite-token", () => ({
  createOwnerInviteToken: vi.fn(() => ({
    token: "public-token",
    tokenHash: "hashed-token",
    expiresAt: new Date("2026-09-03T00:00:00.000Z"),
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: {
      findUnique: vi.fn(),
    },
    propertyOwnerInvite: {
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { requireRoles } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

import {
  createPropertyOwnerInviteAction,
  resendPropertyOwnerInviteAction,
  revokePropertyOwnerInviteAction,
} from "./property-owner-invite-actions";

const mockedRequireRoles = vi.mocked(requireRoles);
const mockedPropertyFindUnique =
  vi.mocked(prisma.property.findUnique);
const mockedInviteFindFirst =
  vi.mocked(prisma.propertyOwnerInvite.findFirst);
const mockedInviteCreate =
  vi.mocked(prisma.propertyOwnerInvite.create);
const mockedInviteUpdateMany =
  vi.mocked(prisma.propertyOwnerInvite.updateMany);
const mockedInviteUpdate =
  vi.mocked(prisma.propertyOwnerInvite.update);

function makeFormData(values: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

describe("property owner invite actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedRequireRoles.mockResolvedValue({
      id: "admin-1",
      role: "SUPER_ADMIN",
    } as never);
  });

  it("creates an invite with normalized email and hashed token", async () => {
    mockedPropertyFindUnique.mockResolvedValue({
      id: "property-1",
    } as never);

    mockedInviteFindFirst.mockResolvedValue(null);

    mockedInviteCreate.mockResolvedValue({
      id: "invite-1",
      expiresAt: new Date("2026-09-03T00:00:00.000Z"),
    } as never);

    const result =
      await createPropertyOwnerInviteAction(
        makeFormData({
          propertyId: "property-1",
          fullName: "Mario Rossi",
          email: "  MARIO@EXAMPLE.COM ",
        }),
      );

    expect(mockedRequireRoles).toHaveBeenCalledWith([
      "SUPER_ADMIN",
    ]);

    expect(mockedInviteCreate).toHaveBeenCalledWith({
      data: {
        propertyId: "property-1",
        fullName: "Mario Rossi",
        email: "mario@example.com",
        tokenHash: "hashed-token",
        expiresAt: new Date("2026-09-03T00:00:00.000Z"),
      },
      select: {
        id: true,
        expiresAt: true,
      },
    });

    expect(result.invitePath).toBe(
      "/invite/owner/public-token",
    );
  });

  it("blocks a second active invite for the same property and email", async () => {
    mockedPropertyFindUnique.mockResolvedValue({
      id: "property-1",
    } as never);

    mockedInviteFindFirst.mockResolvedValue({
      id: "invite-existing",
    } as never);

    await expect(
      createPropertyOwnerInviteAction(
        makeFormData({
          propertyId: "property-1",
          fullName: "Mario Rossi",
          email: "mario@example.com",
        }),
      ),
    ).rejects.toThrow(
      "Esiste già un invito attivo",
    );

    expect(mockedInviteCreate).not.toHaveBeenCalled();
  });

  it("revokes a pending invite without deleting it", async () => {
    mockedInviteUpdateMany.mockResolvedValue({
      count: 1,
    } as never);

    await revokePropertyOwnerInviteAction(
      makeFormData({
        propertyId: "property-1",
        inviteId: "invite-1",
      }),
    );

    expect(mockedInviteUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "invite-1",
        propertyId: "property-1",
        acceptedAt: null,
        revokedAt: null,
      },
      data: {
        revokedAt: expect.any(Date),
      },
    });
  });

  it("rotates token and expiry when resending", async () => {
    mockedInviteFindFirst.mockResolvedValue({
      id: "invite-1",
      acceptedAt: null,
      revokedAt: null,
    } as never);

    const result =
      await resendPropertyOwnerInviteAction(
        makeFormData({
          propertyId: "property-1",
          inviteId: "invite-1",
        }),
      );

    expect(mockedInviteUpdate).toHaveBeenCalledWith({
      where: {
        id: "invite-1",
      },
      data: {
        tokenHash: "hashed-token",
        expiresAt: new Date("2026-09-03T00:00:00.000Z"),
      },
    });

    expect(result.invitePath).toBe(
      "/invite/owner/public-token",
    );
  });

  it("does not resend an accepted invite", async () => {
    mockedInviteFindFirst.mockResolvedValue({
      id: "invite-1",
      acceptedAt: new Date(),
      revokedAt: null,
    } as never);

    await expect(
      resendPropertyOwnerInviteAction(
        makeFormData({
          propertyId: "property-1",
          inviteId: "invite-1",
        }),
      ),
    ).rejects.toThrow(
      "Un invito già accettato non può essere reinviato.",
    );

    expect(mockedInviteUpdate).not.toHaveBeenCalled();
  });
});