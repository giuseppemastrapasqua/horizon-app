import { randomBytes } from "node:crypto";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const requireRolesMock = vi.hoisted(() =>
  vi.fn(),
);

const propertyFindUniqueMock = vi.hoisted(() =>
  vi.fn(),
);

const accountCreateMock = vi.hoisted(() =>
  vi.fn(),
);

const accountFindFirstMock = vi.hoisted(() =>
  vi.fn(),
);

const connectionCreateMock = vi.hoisted(() =>
  vi.fn(),
);

const revalidatePathMock = vi.hoisted(() =>
  vi.fn(),
);

vi.mock("@/lib/auth/guards", () => ({
  requireRoles: requireRolesMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: {
      findUnique: propertyFindUniqueMock,
    },
    ross1000Account: {
      create: accountCreateMock,
      findFirst: accountFindFirstMock,
    },
    ross1000Property: {
      create: connectionCreateMock,
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

import {
  decryptCredential,
} from "@/lib/security/credential-crypto";

import {
  linkExistingRoss1000AccountAction,
  saveRoss1000CredentialsAction,
} from "./ross1000-credential-actions";

const ENV_NAME =
  "HORIZON_CREDENTIAL_ENCRYPTION_KEY";

function createNewAccountFormData() {
  const formData = new FormData();

  formData.set("propertyId", "property-1");
  formData.set(
    "accountName",
    "ROSS1000 Lombardia",
  );
  formData.set(
    "structureCode",
    "STRUCTURE-001",
  );
  formData.set("roomsAvailable", "1");
  formData.set("bedsAvailable", "4");
  formData.set("username", "test-user");
  formData.set(
    "password",
    "test-password",
  );

  return formData;
}

function createExistingAccountFormData() {
  const formData = new FormData();

  formData.set("propertyId", "property-1");
  formData.set("accountId", "account-1");
  formData.set("roomsAvailable", "1");
  formData.set("bedsAvailable", "4");
  formData.set(
    "structureCode",
    "STRUCTURE-002",
  );

  return formData;
}

function mockAvailableProperty() {
  propertyFindUniqueMock.mockResolvedValue({
    id: "property-1",
    ownerId: "owner-1",
    ross1000Property: null,
  });
}

describe("ROSS1000 credential actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    process.env[ENV_NAME] =
      randomBytes(32).toString("base64");

    requireRolesMock.mockResolvedValue({
      id: "admin-1",
    });

    mockAvailableProperty();

    accountCreateMock.mockResolvedValue({
      id: "account-new",
    });

    accountFindFirstMock.mockResolvedValue({
      id: "account-1",
    });

    connectionCreateMock.mockResolvedValue({
      id: "connection-1",
    });
  });

  afterEach(() => {
    delete process.env[ENV_NAME];
  });

  it("richiede SUPER_ADMIN", async () => {
    await saveRoss1000CredentialsAction(
      createNewAccountFormData(),
    );

    expect(
      requireRolesMock,
    ).toHaveBeenCalledWith([
      "SUPER_ADMIN",
    ]);
  });

  it("blocca utenti non SUPER_ADMIN prima di Prisma", async () => {
    requireRolesMock.mockRejectedValue(
      new Error("Accesso negato."),
    );

    await expect(
      saveRoss1000CredentialsAction(
        createNewAccountFormData(),
      ),
    ).rejects.toThrow("Accesso negato.");

    expect(
      propertyFindUniqueMock,
    ).not.toHaveBeenCalled();

    expect(
      accountCreateMock,
    ).not.toHaveBeenCalled();
  });

  it("fallisce senza chiave di cifratura", async () => {
    delete process.env[ENV_NAME];

    await expect(
      saveRoss1000CredentialsAction(
        createNewAccountFormData(),
      ),
    ).rejects.toThrow(
      "HORIZON_CREDENTIAL_ENCRYPTION_KEY non configurata.",
    );

    expect(
      accountCreateMock,
    ).not.toHaveBeenCalled();
  });

  it("fallisce se l'immobile non esiste", async () => {
    propertyFindUniqueMock.mockResolvedValue(
      null,
    );

    await expect(
      saveRoss1000CredentialsAction(
        createNewAccountFormData(),
      ),
    ).rejects.toThrow(
      "Immobile non trovato.",
    );

    expect(
      accountCreateMock,
    ).not.toHaveBeenCalled();
  });

  it("impedisce un secondo collegamento", async () => {
    propertyFindUniqueMock.mockResolvedValue({
      id: "property-1",
      ownerId: "owner-1",
      ross1000Property: {
        accountId: "account-existing",
      },
    });

    await expect(
      saveRoss1000CredentialsAction(
        createNewAccountFormData(),
      ),
    ).rejects.toThrow(
      "La struttura è già collegata a un account ROSS1000.",
    );

    expect(
      accountCreateMock,
    ).not.toHaveBeenCalled();
  });

  it("crea account cifrato e collega il codice struttura", async () => {
    await saveRoss1000CredentialsAction(
      createNewAccountFormData(),
    );

    const call =
      accountCreateMock.mock.calls[0][0];

    const data = call.data;

    expect(data.ownerId).toBe("owner-1");
    expect(data.name).toBe(
      "ROSS1000 Lombardia",
    );

    expect(
      data.properties.create,
    ).toEqual({
      propertyId: "property-1",
      structureCode: "STRUCTURE-001",
      roomsAvailable: 1,
      bedsAvailable: 4,
    });

    expect(
      data.usernameEncrypted,
    ).not.toBe("test-user");

    expect(
      data.passwordEncrypted,
    ).not.toBe("test-password");

    expect(
      decryptCredential(
        data.usernameEncrypted,
        process.env[ENV_NAME]!,
      ),
    ).toBe("test-user");

    expect(
      decryptCredential(
        data.passwordEncrypted,
        process.env[ENV_NAME]!,
      ),
    ).toBe("test-password");

    expect(data.keyVersion).toBe(1);

    expect(
      JSON.stringify(call),
    ).not.toContain('"test-password"');

    expect(
      revalidatePathMock,
    ).toHaveBeenCalledWith(
      "/properties/property-1/edit",
    );
  });

  it("rifiuta account esistente di altro owner", async () => {
    accountFindFirstMock.mockResolvedValue(
      null,
    );

    await expect(
      linkExistingRoss1000AccountAction(
        createExistingAccountFormData(),
      ),
    ).rejects.toThrow(
      "Account ROSS1000 non disponibile per questa struttura.",
    );

    expect(
      accountFindFirstMock,
    ).toHaveBeenCalledWith({
      where: {
        id: "account-1",
        ownerId: "owner-1",
      },
      select: {
        id: true,
      },
    });

    expect(
      connectionCreateMock,
    ).not.toHaveBeenCalled();
  });

  it("collega account esistente senza leggere credenziali", async () => {
    await linkExistingRoss1000AccountAction(
      createExistingAccountFormData(),
    );

    expect(
      connectionCreateMock,
    ).toHaveBeenCalledWith({
      data: {
        propertyId: "property-1",
        accountId: "account-1",
        structureCode: "STRUCTURE-002",
        roomsAvailable: 1,
        bedsAvailable: 4,
      },
    });

    expect(
      accountCreateMock,
    ).not.toHaveBeenCalled();

    expect(
      revalidatePathMock,
    ).toHaveBeenCalledWith(
      "/properties/property-1/edit",
    );
  });
  it("rifiuta un numero negativo di camere/unità disponibili", async () => {
    const formData = createNewAccountFormData();
    formData.set("roomsAvailable", "-1");

    await expect(
      saveRoss1000CredentialsAction(formData),
    ).rejects.toThrow(
      "Numero camere/unità disponibili non valido.",
    );

    expect(accountCreateMock).not.toHaveBeenCalled();
  });

  it("rifiuta un numero non intero di letti disponibili", async () => {
    const formData = createExistingAccountFormData();
    formData.set("bedsAvailable", "4.5");

    await expect(
      linkExistingRoss1000AccountAction(formData),
    ).rejects.toThrow(
      "Numero letti disponibili non valido.",
    );

    expect(connectionCreateMock).not.toHaveBeenCalled();
  });
});
