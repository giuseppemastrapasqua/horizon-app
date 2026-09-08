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
    user: {
      findUnique: vi.fn(),
    },
    propertyAccess: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    propertyOwnerInvite: {
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(async (operations) => Promise.all(operations)),
  },
}));

import { requireRoles } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

import {
  createPropertyOwnerInviteAction,
  deleteSuperAdminOwnerInviteAction,
  revokeAcceptedOwnerAccessAction,
  resendPropertyOwnerInviteAction,
  revokePropertyOwnerInviteAction,
} from "./property-owner-invite-actions";

const mockedRequireRoles = vi.mocked(requireRoles);
const mockedPropertyFindUnique =
  vi.mocked(prisma.property.findUnique);
const mockedUserFindUnique =
  vi.mocked(prisma.user.findUnique);
const mockedPropertyAccessFindFirst =
  vi.mocked(prisma.propertyAccess.findFirst);
const mockedPropertyAccessUpdateMany =
  vi.mocked(prisma.propertyAccess.updateMany);
const mockedInviteFindFirst =
  vi.mocked(prisma.propertyOwnerInvite.findFirst);
const mockedInviteCreate =
  vi.mocked(prisma.propertyOwnerInvite.create);
const mockedInviteUpdateMany =
  vi.mocked(prisma.propertyOwnerInvite.updateMany);
const mockedInviteUpdate =
  vi.mocked(prisma.propertyOwnerInvite.update);
const mockedInviteDeleteMany =
  vi.mocked(prisma.propertyOwnerInvite.deleteMany);
const mockedTransaction = vi.mocked(prisma.$transaction);

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
      "Esiste",
    );

    expect(mockedInviteCreate).not.toHaveBeenCalled();
  });

  it("blocks an invite when the email belongs to a SUPER_ADMIN", async () => {
    mockedPropertyFindUnique.mockResolvedValue({
      id: "property-1",
    } as never);

    mockedInviteFindFirst.mockResolvedValue(null);
    mockedUserFindUnique.mockResolvedValue({
      id: "admin-1",
      role: "SUPER_ADMIN",
    } as never);

    await expect(
      createPropertyOwnerInviteAction(
        makeFormData({
          propertyId: "property-1",
          fullName: "Admin Test",
          email: "admin@example.com",
        }),
      ),
    ).rejects.toThrow(
      "Il Super Admin dispone",
    );

    expect(mockedPropertyAccessFindFirst).not.toHaveBeenCalled();
    expect(mockedInviteCreate).not.toHaveBeenCalled();
  });

  it("blocks a new invite when the email already has active OWNER access", async () => {
    mockedPropertyFindUnique.mockResolvedValue({
      id: "property-1",
    } as never);

    mockedInviteFindFirst.mockResolvedValue(null);

    mockedUserFindUnique.mockResolvedValue({
      id: "owner-1",
    } as never);

    mockedPropertyAccessFindFirst.mockResolvedValue({
      id: "access-1",
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
      "Questo proprietario ha",
    );

    expect(mockedPropertyAccessFindFirst).toHaveBeenCalledWith({
      where: {
        propertyId: "property-1",
        userId: "owner-1",
        role: "OWNER",
        active: true,
      },
      select: { id: true },
    });

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

  it("allows a new invite after a previous invite was revoked", async () => {
    mockedPropertyFindUnique.mockResolvedValue({
      id: "property-1",
    } as never);

    mockedInviteFindFirst.mockResolvedValue(null);
    mockedUserFindUnique.mockResolvedValue(null);

    mockedInviteCreate.mockResolvedValue({
      id: "invite-new",
      expiresAt: new Date("2026-09-03T00:00:00.000Z"),
    } as never);

    const result = await createPropertyOwnerInviteAction(
      makeFormData({
        propertyId: "property-1",
        fullName: "Mario Rossi",
        email: "mario@example.com",
      }),
    );

    expect(mockedInviteCreate).toHaveBeenCalledTimes(1);
    expect(result.inviteId).toBe("invite-new");
  });

  it("deletes a SUPER_ADMIN owner invite and disables the accidental OWNER access", async () => {
    mockedInviteFindFirst.mockResolvedValue({
      id: "invite-admin",
      email: "admin@example.com",
    } as never);

    mockedUserFindUnique.mockResolvedValue({
      id: "admin-1",
      role: "SUPER_ADMIN",
    } as never);

    mockedInviteDeleteMany.mockResolvedValue({
      count: 3,
    } as never);

    mockedPropertyAccessUpdateMany.mockResolvedValue({
      count: 1,
    } as never);

    await deleteSuperAdminOwnerInviteAction(
      makeFormData({
        propertyId: "property-1",
        inviteId: "invite-admin",
      }),
    );

    expect(mockedInviteDeleteMany).toHaveBeenCalledWith({
      where: {
        propertyId: "property-1",
        email: "admin@example.com",
      },
    });

    expect(mockedPropertyAccessUpdateMany).toHaveBeenCalledWith({
      where: {
        propertyId: "property-1",
        userId: "admin-1",
        role: "OWNER",
        active: true,
      },
      data: {
        active: false,
      },
    });

    expect(mockedTransaction).toHaveBeenCalledTimes(1);
  });

  it("revokes OWNER access from an accepted invite", async () => {
    mockedInviteFindFirst.mockResolvedValue({
      email: "owner@example.com",
    } as never);
    mockedUserFindUnique.mockResolvedValue({
      id: "owner-1",
      role: "OWNER",
    } as never);
    mockedPropertyAccessUpdateMany.mockResolvedValue({
      count: 1,
    } as never);
    mockedInviteUpdateMany.mockResolvedValue({
      count: 1,
    } as never);

    await revokeAcceptedOwnerAccessAction(
      makeFormData({
        propertyId: "property-1",
        inviteId: "invite-accepted",
      }),
    );

    expect(mockedInviteFindFirst).toHaveBeenCalledWith({
      where: {
        id: "invite-accepted",
        propertyId: "property-1",
        acceptedAt: { not: null },
        revokedAt: null,
      },
      select: { email: true },
    });

    expect(mockedPropertyAccessUpdateMany).toHaveBeenCalledWith({
      where: {
        propertyId: "property-1",
        userId: "owner-1",
        role: "OWNER",
        active: true,
      },
      data: { active: false },
    });

    expect(mockedInviteUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "invite-accepted",
        propertyId: "property-1",
        acceptedAt: { not: null },
        revokedAt: null,
      },
      data: {
        revokedAt: expect.any(Date),
      },
    });

    expect(mockedTransaction).toHaveBeenCalledTimes(1);
  });

  it("does not revoke SUPER_ADMIN access from an accepted invite", async () => {
    mockedInviteFindFirst.mockResolvedValue({
      email: "admin@example.com",
    } as never);
    mockedUserFindUnique.mockResolvedValue({
      id: "admin-1",
      role: "SUPER_ADMIN",
    } as never);

    await expect(
      revokeAcceptedOwnerAccessAction(
        makeFormData({
          propertyId: "property-1",
          inviteId: "invite-accepted",
        }),
      ),
    ).rejects.toThrow("Il Super Admin dispone");

    expect(mockedPropertyAccessUpdateMany).not.toHaveBeenCalled();
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
      "Un invito",
    );

    expect(mockedInviteUpdate).not.toHaveBeenCalled();
  });
});
