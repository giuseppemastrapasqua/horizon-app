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
    alloggiatiWebAccount: {
      create: accountCreateMock,
      findFirst: accountFindFirstMock,
    },
    alloggiatiWebProperty: {
      create: connectionCreateMock,
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

const listApartmentsMock = vi.hoisted(() =>
  vi.fn(),
);

vi.mock(
  "@/lib/integrations/alloggiati-web/runtime-apartment-directory",
  () => ({
    createRuntimeAlloggiatiWebApartmentDirectory:
      () => ({
        listApartments:
          listApartmentsMock,
      }),
  }),
);

const discoverApartmentsMock = vi.hoisted(() =>
  vi.fn(),
);

vi.mock(
  "@/lib/integrations/alloggiati-web/apartment-discovery",
  () => ({
    discoverAlloggiatiApartments:
      discoverApartmentsMock,
  }),
);

import {
  decryptCredential,
} from "@/lib/security/credential-crypto";

import {
  discoverAlloggiatiApartmentsAction,
  linkExistingAlloggiatiAccountAction,
  listAlloggiatiApartmentsAction,
  saveAlloggiatiCredentialsAction,
} from "./alloggiati-credential-actions";

const ENV_NAME =
  "HORIZON_CREDENTIAL_ENCRYPTION_KEY";

function createNewAccountFormData() {
  const formData = new FormData();

  formData.set("propertyId", "property-1");
  formData.set(
    "accountName",
    "Account Alloggiati Milano",
  );
  formData.set("apartmentId", "123");
  formData.set("username", "test-user");
  formData.set("password", "test-password");
  formData.set("wsKey", "test-wskey");

  return formData;
}

function createExistingAccountFormData() {
  const formData = new FormData();

  formData.set("propertyId", "property-1");
  formData.set("accountId", "account-1");
  formData.set("apartmentId", "456");

  return formData;
}

function mockAvailableProperty() {
  propertyFindUniqueMock.mockResolvedValue({
    id: "property-1",
    ownerId: "owner-1",
    alloggiatiWebProperty: null,
  });
}

describe(
  "Alloggiati Web credential actions",
  () => {
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

      listApartmentsMock.mockResolvedValue([
        {
          apartmentId: "123",
          description: "Casa Centro",
        },
        {
          apartmentId: "456",
          description: "Casa Mare",
        },
      ]);

      discoverApartmentsMock.mockResolvedValue([
        {
          apartmentId: "123",
          description: "Casa Centro",
        },
        {
          apartmentId: "456",
          description: "Casa Mare",
        },
      ]);
    });

    afterEach(() => {
      delete process.env[ENV_NAME];
    });

    it(
      "richiede SUPER_ADMIN per creare un account",
      async () => {
        await saveAlloggiatiCredentialsAction(
          createNewAccountFormData(),
        );

        expect(
          requireRolesMock,
        ).toHaveBeenCalledWith([
          "SUPER_ADMIN",
        ]);
      },
    );

    it(
      "blocca utenti non SUPER_ADMIN prima di Prisma",
      async () => {
        requireRolesMock.mockRejectedValue(
          new Error("Accesso negato."),
        );

        await expect(
          saveAlloggiatiCredentialsAction(
            createNewAccountFormData(),
          ),
        ).rejects.toThrow(
          "Accesso negato.",
        );

        expect(
          propertyFindUniqueMock,
        ).not.toHaveBeenCalled();

        expect(
          accountCreateMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "fallisce senza chiave di cifratura",
      async () => {
        delete process.env[ENV_NAME];

        await expect(
          saveAlloggiatiCredentialsAction(
            createNewAccountFormData(),
          ),
        ).rejects.toThrow(
          "HORIZON_CREDENTIAL_ENCRYPTION_KEY non configurata.",
        );

        expect(
          accountCreateMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rifiuta IdAppartamento non numerico per nuovo account",
      async () => {
        const formData =
          createNewAccountFormData();

        formData.set(
          "apartmentId",
          "APT-123",
        );

        await expect(
          saveAlloggiatiCredentialsAction(
            formData,
          ),
        ).rejects.toThrow(
          "IdAppartamento Alloggiati Web non valido.",
        );

        expect(
          propertyFindUniqueMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "fallisce se l'immobile non esiste",
      async () => {
        propertyFindUniqueMock.mockResolvedValue(
          null,
        );

        await expect(
          saveAlloggiatiCredentialsAction(
            createNewAccountFormData(),
          ),
        ).rejects.toThrow(
          "Immobile non trovato.",
        );

        expect(
          accountCreateMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "impedisce un secondo collegamento creando un account",
      async () => {
        propertyFindUniqueMock.mockResolvedValue({
          id: "property-1",
          ownerId: "owner-1",
          alloggiatiWebProperty: {
            accountId: "account-existing",
          },
        });

        await expect(
          saveAlloggiatiCredentialsAction(
            createNewAccountFormData(),
          ),
        ).rejects.toThrow(
          "La struttura è già collegata a un account Alloggiati Web.",
        );

        expect(
          accountCreateMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "crea account cifrato con nome esplicito e collega IdAppartamento",
      async () => {
        await saveAlloggiatiCredentialsAction(
          createNewAccountFormData(),
        );

        expect(
          accountCreateMock,
        ).toHaveBeenCalledTimes(1);

        const call =
          accountCreateMock.mock.calls[0][0];

        const data = call.data;

        expect(data.ownerId).toBe(
          "owner-1",
        );

        expect(data.name).toBe(
          "Account Alloggiati Milano",
        );

        expect(
          data.properties.create,
        ).toEqual({
          propertyId: "property-1",
          apartmentId: "123",
        });

        expect(
          data.usernameEncrypted,
        ).not.toBe("test-user");

        expect(
          data.passwordEncrypted,
        ).not.toBe("test-password");

        expect(
          data.wsKeyEncrypted,
        ).not.toBe("test-wskey");

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

        expect(
          decryptCredential(
            data.wsKeyEncrypted,
            process.env[ENV_NAME]!,
          ),
        ).toBe("test-wskey");

        expect(data.keyVersion).toBe(1);

        expect(
          JSON.stringify(call),
        ).not.toContain(
          '"test-password"',
        );

        expect(
          JSON.stringify(call),
        ).not.toContain(
          '"test-wskey"',
        );

        expect(
          revalidatePathMock,
        ).toHaveBeenCalledWith(
          "/properties/property-1/edit",
        );
      },
    );

    it(
      "richiede SUPER_ADMIN per collegare un account esistente",
      async () => {
        await linkExistingAlloggiatiAccountAction(
          createExistingAccountFormData(),
        );

        expect(
          requireRolesMock,
        ).toHaveBeenCalledWith([
          "SUPER_ADMIN",
        ]);
      },
    );

    it(
      "rifiuta IdAppartamento non numerico per account esistente",
      async () => {
        const formData =
          createExistingAccountFormData();

        formData.set(
          "apartmentId",
          "APT-456",
        );

        await expect(
          linkExistingAlloggiatiAccountAction(
            formData,
          ),
        ).rejects.toThrow(
          "IdAppartamento Alloggiati Web non valido.",
        );

        expect(
          propertyFindUniqueMock,
        ).not.toHaveBeenCalled();

        expect(
          connectionCreateMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "impedisce un secondo collegamento con account esistente",
      async () => {
        propertyFindUniqueMock.mockResolvedValue({
          id: "property-1",
          ownerId: "owner-1",
          alloggiatiWebProperty: {
            accountId: "account-existing",
          },
        });

        await expect(
          linkExistingAlloggiatiAccountAction(
            createExistingAccountFormData(),
          ),
        ).rejects.toThrow(
          "La struttura è già collegata a un account Alloggiati Web.",
        );

        expect(
          accountFindFirstMock,
        ).not.toHaveBeenCalled();

        expect(
          connectionCreateMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rifiuta un account non disponibile per l'owner della struttura",
      async () => {
        accountFindFirstMock.mockResolvedValue(
          null,
        );

        await expect(
          linkExistingAlloggiatiAccountAction(
            createExistingAccountFormData(),
          ),
        ).rejects.toThrow(
          "Account Alloggiati Web non disponibile per questa struttura.",
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
      },
    );

    it(
      "collega un account esistente autorizzato senza leggere credenziali",
      async () => {
        await linkExistingAlloggiatiAccountAction(
          createExistingAccountFormData(),
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
        ).toHaveBeenCalledWith({
          data: {
            propertyId: "property-1",
            accountId: "account-1",
            apartmentId: "456",
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
      },
    );

    it(
      "richiede SUPER_ADMIN per leggere ListaAppartamenti",
      async () => {
        await listAlloggiatiApartmentsAction(
          "property-1",
          "account-1",
        );

        expect(
          requireRolesMock,
        ).toHaveBeenCalledWith([
          "SUPER_ADMIN",
        ]);
      },
    );

    it(
      "blocca discovery senza propertyId",
      async () => {
        await expect(
          listAlloggiatiApartmentsAction(
            " ",
            "account-1",
          ),
        ).rejects.toThrow(
          "Identificativo immobile mancante.",
        );

        expect(
          propertyFindUniqueMock,
        ).not.toHaveBeenCalled();

        expect(
          listApartmentsMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "blocca discovery senza accountId",
      async () => {
        await expect(
          listAlloggiatiApartmentsAction(
            "property-1",
            " ",
          ),
        ).rejects.toThrow(
          "Account Alloggiati Web obbligatorio.",
        );

        expect(
          propertyFindUniqueMock,
        ).not.toHaveBeenCalled();

        expect(
          listApartmentsMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "blocca discovery per immobile inesistente",
      async () => {
        propertyFindUniqueMock.mockResolvedValue(
          null,
        );

        await expect(
          listAlloggiatiApartmentsAction(
            "property-1",
            "account-1",
          ),
        ).rejects.toThrow(
          "Immobile non trovato.",
        );

        expect(
          listApartmentsMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "restituisce ListaAppartamenti usando owner della struttura",
      async () => {
        const result =
          await listAlloggiatiApartmentsAction(
            " property-1 ",
            " account-1 ",
          );

        expect(
          propertyFindUniqueMock,
        ).toHaveBeenCalledWith({
          where: {
            id: "property-1",
          },
          select: {
            ownerId: true,
          },
        });

        expect(
          listApartmentsMock,
        ).toHaveBeenCalledWith(
          "account-1",
          "owner-1",
        );

        expect(result).toEqual([
          {
            apartmentId: "123",
            description: "Casa Centro",
          },
          {
            apartmentId: "456",
            description: "Casa Mare",
          },
        ]);

        expect(
          accountCreateMock,
        ).not.toHaveBeenCalled();

        expect(
          connectionCreateMock,
        ).not.toHaveBeenCalled();

        expect(
          revalidatePathMock,
        ).not.toHaveBeenCalled();
      },
    );
    it("richiede SUPER_ADMIN per discovery con nuove credenziali", async () => {
      requireRolesMock.mockRejectedValueOnce(
        new Error("Forbidden"),
      );

      const formData = new FormData();
      formData.set("username", "utente");
      formData.set("password", "password");
      formData.set("wsKey", "ws-key");

      await expect(
        discoverAlloggiatiApartmentsAction(
          formData,
        ),
      ).rejects.toThrow("Forbidden");

      expect(
        discoverApartmentsMock,
      ).not.toHaveBeenCalled();
    });

    it("richiede username per discovery con nuove credenziali", async () => {
      const formData = new FormData();
      formData.set("password", "password");
      formData.set("wsKey", "ws-key");

      await expect(
        discoverAlloggiatiApartmentsAction(
          formData,
        ),
      ).rejects.toThrow(
        "Username Alloggiati Web obbligatorio.",
      );

      expect(
        discoverApartmentsMock,
      ).not.toHaveBeenCalled();
    });

    it("richiede password per discovery con nuove credenziali", async () => {
      const formData = new FormData();
      formData.set("username", "utente");
      formData.set("wsKey", "ws-key");

      await expect(
        discoverAlloggiatiApartmentsAction(
          formData,
        ),
      ).rejects.toThrow(
        "Password Alloggiati Web obbligatoria.",
      );

      expect(
        discoverApartmentsMock,
      ).not.toHaveBeenCalled();
    });

    it("richiede WSKEY per discovery con nuove credenziali", async () => {
      const formData = new FormData();
      formData.set("username", "utente");
      formData.set("password", "password");

      await expect(
        discoverAlloggiatiApartmentsAction(
          formData,
        ),
      ).rejects.toThrow(
        "WSKEY Alloggiati Web obbligatoria.",
      );

      expect(
        discoverApartmentsMock,
      ).not.toHaveBeenCalled();
    });

    it("scopre ListaAppartamenti senza persistere le nuove credenziali", async () => {
      const formData = new FormData();
      formData.set("username", " utente ");
      formData.set("password", " password ");
      formData.set("wsKey", " ws-key ");

      const result =
        await discoverAlloggiatiApartmentsAction(
          formData,
        );

      expect(
        discoverApartmentsMock,
      ).toHaveBeenCalledWith({
        username: "utente",
        password: "password",
        wsKey: "ws-key",
      });

      expect(result).toEqual([
        {
          apartmentId: "123",
          description: "Casa Centro",
        },
        {
          apartmentId: "456",
          description: "Casa Mare",
        },
      ]);

      expect(
        accountCreateMock,
      ).not.toHaveBeenCalled();

      expect(
        connectionCreateMock,
      ).not.toHaveBeenCalled();

      expect(
        revalidatePathMock,
      ).not.toHaveBeenCalled();
    });  },
);