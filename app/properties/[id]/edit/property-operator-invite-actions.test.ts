import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireRolesMock,
  propertyFindUniqueMock,
  inviteFindFirstMock,
  inviteCreateMock,
  inviteUpdateMock,
  inviteUpdateManyMock,
  userFindUniqueMock,
  accessFindFirstMock,
  accessUpdateManyMock,
  transactionMock,
  revalidatePathMock,
  createOperatorInviteTokenMock,
  sendEmailMock,
} = vi.hoisted(() => ({
  requireRolesMock: vi.fn(),
  propertyFindUniqueMock: vi.fn(),
  inviteFindFirstMock: vi.fn(),
  inviteCreateMock: vi.fn(),
  inviteUpdateMock: vi.fn(),
  inviteUpdateManyMock: vi.fn(),
  userFindUniqueMock: vi.fn(),
  accessFindFirstMock: vi.fn(),
  accessUpdateManyMock: vi.fn(),
  transactionMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  createOperatorInviteTokenMock: vi.fn(),
  sendEmailMock: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireRoles: requireRolesMock,
}));

vi.mock("@/lib/auth/property-operator-invite-token", () => ({
  createOperatorInviteToken: createOperatorInviteTokenMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: {
      findUnique: propertyFindUniqueMock,
    },
    propertyOperatorInvite: {
      findFirst: inviteFindFirstMock,
      create: inviteCreateMock,
      update: inviteUpdateMock,
      updateMany: inviteUpdateManyMock,
    },
    user: {
      findUnique: userFindUniqueMock,
    },
    propertyAccess: {
      findFirst: accessFindFirstMock,
      updateMany: accessUpdateManyMock,
    },
    $transaction: transactionMock,
  },
}));

vi.mock("@/lib/notifications/email/send-email", () => ({
  sendEmail: sendEmailMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

import {
  createPropertyOperatorInviteAction,
  resendPropertyOperatorInviteAction,
  revokeAcceptedOperatorAccessAction,
  revokePropertyOperatorInviteAction,
} from "./property-operator-invite-actions";

function createFormData() {
  const formData = new FormData();

  formData.set("propertyId", "property-1");
  formData.set("fullName", "Mario Operatore");
  formData.set("email", "OPERATOR@example.com");
  formData.set("phone", "+39 333 1234567");

  return formData;
}

function createInviteActionFormData() {
  const formData = new FormData();

  formData.set("propertyId", "property-1");
  formData.set("inviteId", "invite-1");

  return formData;
}

describe("createPropertyOperatorInviteAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    requireRolesMock.mockResolvedValue(undefined);

    propertyFindUniqueMock.mockResolvedValue({
      id: "property-1",
      name: "Duomo Test",
    });

    inviteFindFirstMock.mockResolvedValue(null);
    userFindUniqueMock.mockResolvedValue(null);
    accessFindFirstMock.mockResolvedValue(null);
    sendEmailMock.mockResolvedValue({ id: "email-1" });

    createOperatorInviteTokenMock.mockReturnValue({
      token: "raw-token",
      tokenHash: "hashed-token",
      expiresAt: new Date("2026-09-12T08:00:00.000Z"),
    });

    inviteCreateMock.mockResolvedValue({
      id: "invite-1",
      expiresAt: new Date("2026-09-12T08:00:00.000Z"),
    });
  });

  it("richiede il ruolo SUPER_ADMIN", async () => {
    await createPropertyOperatorInviteAction(createFormData());

    expect(requireRolesMock).toHaveBeenCalledWith([
      "SUPER_ADMIN",
    ]);
  });

  it("crea un invito collaboratore normalizzando email e dati", async () => {
    const result =
      await createPropertyOperatorInviteAction(createFormData());

    expect(inviteCreateMock).toHaveBeenCalledWith({
      data: {
        propertyId: "property-1",
        fullName: "Mario Operatore",
        email: "operator@example.com",
        phone: "+39 333 1234567",
        tokenHash: "hashed-token",
        expiresAt: new Date("2026-09-12T08:00:00.000Z"),
      },
      select: {
        id: true,
        expiresAt: true,
      },
    });

    expect(result).toEqual({
      inviteId: "invite-1",
      invitePath: "/invite/operator/raw-token",
      expiresAt: new Date("2026-09-12T08:00:00.000Z"),
      emailSent: true,
    });

    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/properties/property-1/edit",
    );

    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/properties/property-1",
    );
  });

  it("mantiene valido l'invito se l'email fallisce", async () => {
    sendEmailMock.mockRejectedValue(
      new Error("Resend temporaneamente non disponibile"),
    );

    const result =
      await createPropertyOperatorInviteAction(createFormData());

    expect(inviteCreateMock).toHaveBeenCalledTimes(1);

    expect(result).toEqual({
      inviteId: "invite-1",
      invitePath: "/invite/operator/raw-token",
      expiresAt: new Date("2026-09-12T08:00:00.000Z"),
      emailSent: false,
    });
  });

  it("rifiuta un invito attivo duplicato", async () => {
    inviteFindFirstMock.mockResolvedValue({
      id: "invite-existing",
    });

    await expect(
      createPropertyOperatorInviteAction(createFormData()),
    ).rejects.toThrow(
      "Esiste già un invito collaboratore attivo per questa email e questa struttura.",
    );

    expect(inviteCreateMock).not.toHaveBeenCalled();
  });

  it("rifiuta un account Horizon con ruolo diverso da OPERATOR", async () => {
    userFindUniqueMock.mockResolvedValue({
      id: "owner-1",
      role: "OWNER",
    });

    await expect(
      createPropertyOperatorInviteAction(createFormData()),
    ).rejects.toThrow(
      "Questa email appartiene già a un account Horizon con un ruolo diverso da collaboratore operativo.",
    );

    expect(inviteCreateMock).not.toHaveBeenCalled();
  });

  it("rifiuta un OPERATOR che ha già accesso attivo alla struttura", async () => {
    userFindUniqueMock.mockResolvedValue({
      id: "operator-1",
      role: "OPERATOR",
    });

    accessFindFirstMock.mockResolvedValue({
      id: "access-1",
    });

    await expect(
      createPropertyOperatorInviteAction(createFormData()),
    ).rejects.toThrow(
      "Questo collaboratore ha già accesso attivo alla struttura.",
    );

    expect(inviteCreateMock).not.toHaveBeenCalled();
  });
});

describe("resendPropertyOperatorInviteAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    requireRolesMock.mockResolvedValue(undefined);

    inviteFindFirstMock.mockResolvedValue({
      id: "invite-1",
      email: "operator@example.com",
      fullName: "Mario Operatore",
      acceptedAt: null,
      revokedAt: null,
      property: {
        name: "Duomo Test",
      },
    });

    createOperatorInviteTokenMock.mockReturnValue({
      token: "new-raw-token",
      tokenHash: "new-hashed-token",
      expiresAt: new Date("2026-09-13T08:00:00.000Z"),
    });

    inviteUpdateMock.mockResolvedValue({
      id: "invite-1",
    });

    sendEmailMock.mockResolvedValue({
      id: "email-2",
    });
  });

  it("rigenera token e reinvia l'email", async () => {
    const result =
      await resendPropertyOperatorInviteAction(
        createInviteActionFormData(),
      );

    expect(inviteUpdateMock).toHaveBeenCalledWith({
      where: {
        id: "invite-1",
      },
      data: {
        tokenHash: "new-hashed-token",
        expiresAt: new Date("2026-09-13T08:00:00.000Z"),
      },
    });

    expect(sendEmailMock).toHaveBeenCalledTimes(1);

    expect(result).toEqual({
      inviteId: "invite-1",
      invitePath: "/invite/operator/new-raw-token",
      expiresAt: new Date("2026-09-13T08:00:00.000Z"),
      emailSent: true,
    });
  });

  it("rifiuta il reinvio di un invito già accettato", async () => {
    inviteFindFirstMock.mockResolvedValue({
      id: "invite-1",
      email: "operator@example.com",
      fullName: "Mario Operatore",
      acceptedAt: new Date("2026-09-10T08:00:00.000Z"),
      revokedAt: null,
      property: {
        name: "Duomo Test",
      },
    });

    await expect(
      resendPropertyOperatorInviteAction(
        createInviteActionFormData(),
      ),
    ).rejects.toThrow(
      "Un invito già accettato non può essere reinviato.",
    );

    expect(inviteUpdateMock).not.toHaveBeenCalled();
  });
});

describe("revokePropertyOperatorInviteAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    requireRolesMock.mockResolvedValue(undefined);

    inviteUpdateManyMock.mockResolvedValue({
      count: 1,
    });
  });

  it("revoca un invito pending", async () => {
    await revokePropertyOperatorInviteAction(
      createInviteActionFormData(),
    );

    expect(inviteUpdateManyMock).toHaveBeenCalledWith({
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
});

describe("revokeAcceptedOperatorAccessAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    requireRolesMock.mockResolvedValue(undefined);

    inviteFindFirstMock.mockResolvedValue({
      email: "operator@example.com",
    });

    userFindUniqueMock.mockResolvedValue({
      id: "operator-1",
      role: "OPERATOR",
    });

    accessUpdateManyMock.mockResolvedValue({
      count: 1,
    });

    inviteUpdateManyMock.mockResolvedValue({
      count: 1,
    });

    transactionMock.mockImplementation(
      async (
        callback: (tx: {
          propertyAccess: {
            updateMany: typeof accessUpdateManyMock;
          };
          propertyOperatorInvite: {
            updateMany: typeof inviteUpdateManyMock;
          };
        }) => Promise<unknown>,
      ) =>
        callback({
          propertyAccess: {
            updateMany: accessUpdateManyMock,
          },
          propertyOperatorInvite: {
            updateMany: inviteUpdateManyMock,
          },
        }),
    );
  });

  it("revoca solo l'accesso OPERATOR della struttura", async () => {
    await revokeAcceptedOperatorAccessAction(
      createInviteActionFormData(),
    );

    expect(accessUpdateManyMock).toHaveBeenCalledWith({
      where: {
        propertyId: "property-1",
        userId: "operator-1",
        role: "OPERATOR",
        active: true,
      },
      data: {
        active: false,
      },
    });

    expect(inviteUpdateManyMock).toHaveBeenCalledWith({
      where: {
        id: "invite-1",
        propertyId: "property-1",
        acceptedAt: {
          not: null,
        },
        revokedAt: null,
      },
      data: {
        revokedAt: expect.any(Date),
      },
    });
  });

  it("rifiuta la revoca se l'account non è OPERATOR", async () => {
    userFindUniqueMock.mockResolvedValue({
      id: "manager-1",
      role: "MANAGER",
    });

    await expect(
      revokeAcceptedOperatorAccessAction(
        createInviteActionFormData(),
      ),
    ).rejects.toThrow(
      "L'account associato non è un collaboratore operativo.",
    );

    expect(transactionMock).not.toHaveBeenCalled();
  });
});