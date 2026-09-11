import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  hashMock,
  sendEmailMock,
  hashOperatorInviteTokenMock,
  isOperatorInviteUsableMock,
  outerInviteFindUniqueMock,
  transactionMock,
  txInviteFindUniqueMock,
  txInviteUpdateManyMock,
  txUserFindUniqueMock,
  txUserCreateMock,
  txUserUpdateMock,
  txAccessUpsertMock,
} = vi.hoisted(() => ({
  hashMock: vi.fn(),
  sendEmailMock: vi.fn(),
  hashOperatorInviteTokenMock: vi.fn(),
  isOperatorInviteUsableMock: vi.fn(),
  outerInviteFindUniqueMock: vi.fn(),
  transactionMock: vi.fn(),
  txInviteFindUniqueMock: vi.fn(),
  txInviteUpdateManyMock: vi.fn(),
  txUserFindUniqueMock: vi.fn(),
  txUserCreateMock: vi.fn(),
  txUserUpdateMock: vi.fn(),
  txAccessUpsertMock: vi.fn(),
}));

const tx = {
  propertyOperatorInvite: {
    findUnique: txInviteFindUniqueMock,
    updateMany: txInviteUpdateManyMock,
  },
  user: {
    findUnique: txUserFindUniqueMock,
    create: txUserCreateMock,
    update: txUserUpdateMock,
  },
  propertyAccess: {
    upsert: txAccessUpsertMock,
  },
};

vi.mock("bcryptjs", () => ({
  hash: hashMock,
}));

vi.mock("@/lib/notifications/email/send-email", () => ({
  sendEmail: sendEmailMock,
}));

vi.mock("@/lib/auth/property-operator-invite-token", () => ({
  hashOperatorInviteToken: hashOperatorInviteTokenMock,
  isOperatorInviteUsable: isOperatorInviteUsableMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    propertyOperatorInvite: {
      findUnique: outerInviteFindUniqueMock,
    },
    $transaction: transactionMock,
  },
}));

import { acceptPropertyOperatorInviteAction } from "./actions";

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
    email: "operator@example.com",
    fullName: "Mario Operatore",
    expiresAt: new Date(Date.now() + 60_000),
    acceptedAt: null,
    revokedAt: null,
  };
}

describe("accept property operator invite", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    hashMock.mockResolvedValue("bcrypt-hash");
    hashOperatorInviteTokenMock.mockReturnValue("token-hash");
    isOperatorInviteUsableMock.mockImplementation(
      (value) =>
        !value.acceptedAt &&
        !value.revokedAt &&
        value.expiresAt.getTime() > Date.now(),
    );

    outerInviteFindUniqueMock.mockResolvedValue(invite());
    txInviteFindUniqueMock.mockResolvedValue(invite());
    txInviteUpdateManyMock.mockResolvedValue({ count: 1 });
    txAccessUpsertMock.mockResolvedValue({});
    sendEmailMock.mockResolvedValue(undefined);

    transactionMock.mockImplementation(
      async (callback) => callback(tx),
    );
  });

  it("creates a new OPERATOR and grants OPERATOR property access", async () => {
    txUserFindUniqueMock.mockResolvedValue(null);
    txUserCreateMock.mockResolvedValue({ id: "user-1" });

    const result =
      await acceptPropertyOperatorInviteAction(form());

    expect(txUserCreateMock).toHaveBeenCalledWith({
      data: {
        fullName: "Mario Operatore",
        email: "operator@example.com",
        role: "OPERATOR",
        status: "ACTIVE",
        passwordHash: "bcrypt-hash",
      },
      select: {
        id: true,
      },
    });

    expect(txAccessUpsertMock).toHaveBeenCalledWith({
      where: {
        propertyId_userId: {
          propertyId: "property-1",
          userId: "user-1",
        },
      },
      update: {
        role: "OPERATOR",
        active: true,
      },
      create: {
        propertyId: "property-1",
        userId: "user-1",
        role: "OPERATOR",
        active: true,
      },
    });

    expect(result).toEqual({
      userId: "user-1",
      email: "operator@example.com",
    });
  });

  it.each(["OWNER", "MANAGER", "FINANCE_ADMIN", "SUPER_ADMIN"])(
    "rejects an existing %s account without granting access",
    async (role) => {
      txUserFindUniqueMock.mockResolvedValue({
        id: "existing-user",
        email: "operator@example.com",
        role,
        status: "ACTIVE",
        passwordHash: "existing-hash",
      });

      await expect(
        acceptPropertyOperatorInviteAction(form()),
      ).rejects.toThrow(
        "Questa email appartiene già a un account Horizon con un ruolo diverso da collaboratore operativo.",
      );

      expect(txUserCreateMock).not.toHaveBeenCalled();
      expect(txUserUpdateMock).not.toHaveBeenCalled();
      expect(txAccessUpsertMock).not.toHaveBeenCalled();
      expect(txInviteUpdateManyMock).not.toHaveBeenCalled();
    },
  );

  it("reuses an existing active OPERATOR without changing password", async () => {
    txUserFindUniqueMock.mockResolvedValue({
      id: "operator-existing",
      email: "operator@example.com",
      role: "OPERATOR",
      status: "ACTIVE",
      passwordHash: "existing-hash",
    });

    await acceptPropertyOperatorInviteAction(form());

    expect(txUserCreateMock).not.toHaveBeenCalled();
    expect(txUserUpdateMock).not.toHaveBeenCalled();

    expect(txAccessUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          propertyId_userId: {
            propertyId: "property-1",
            userId: "operator-existing",
          },
        },
      }),
    );
  });

  it("activates an existing OPERATOR without a password", async () => {
    txUserFindUniqueMock.mockResolvedValue({
      id: "operator-existing",
      email: "operator@example.com",
      role: "OPERATOR",
      status: "INACTIVE",
      passwordHash: null,
    });

    await acceptPropertyOperatorInviteAction(form());

    expect(txUserUpdateMock).toHaveBeenCalledWith({
      where: {
        id: "operator-existing",
      },
      data: {
        passwordHash: "bcrypt-hash",
        status: "ACTIVE",
      },
    });
  });

  it("blocks a suspended OPERATOR account", async () => {
    txUserFindUniqueMock.mockResolvedValue({
      id: "operator-existing",
      email: "operator@example.com",
      role: "OPERATOR",
      status: "SUSPENDED",
      passwordHash: "existing-hash",
    });

    await expect(
      acceptPropertyOperatorInviteAction(form()),
    ).rejects.toThrow(
      "richiede una verifica amministrativa",
    );

    expect(txAccessUpsertMock).not.toHaveBeenCalled();
    expect(txInviteUpdateManyMock).not.toHaveBeenCalled();
  });

  it("marks the invite as accepted atomically", async () => {
    txUserFindUniqueMock.mockResolvedValue(null);
    txUserCreateMock.mockResolvedValue({ id: "user-1" });

    await acceptPropertyOperatorInviteAction(form());

    expect(txInviteUpdateManyMock).toHaveBeenCalledWith({
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

  it("sends confirmation without exposing the password", async () => {
    txUserFindUniqueMock.mockResolvedValue(null);
    txUserCreateMock.mockResolvedValue({ id: "user-1" });

    await acceptPropertyOperatorInviteAction(form());

    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "operator@example.com",
        subject: "Horizon - Accesso collaboratore attivato",
        html: expect.stringContaining(
          "http://localhost:3000/login",
        ),
      }),
    );

    const emailCall = sendEmailMock.mock.calls[0]?.[0];
    expect(emailCall?.html).toContain("operator@example.com");
    expect(emailCall?.html).not.toContain("Password123!");
  });

  it("keeps activation valid when confirmation email fails", async () => {
    txUserFindUniqueMock.mockResolvedValue(null);
    txUserCreateMock.mockResolvedValue({ id: "user-1" });
    sendEmailMock.mockRejectedValueOnce(new Error("email down"));

    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result =
      await acceptPropertyOperatorInviteAction(form());

    expect(result).toEqual({
      userId: "user-1",
      email: "operator@example.com",
    });
    expect(txAccessUpsertMock).toHaveBeenCalled();
    expect(txInviteUpdateManyMock).toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      "Invio email attivazione collaboratore fallito.",
      expect.any(Error),
    );

    consoleError.mockRestore();
  });
});