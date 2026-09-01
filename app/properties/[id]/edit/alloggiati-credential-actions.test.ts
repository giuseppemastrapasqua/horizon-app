import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { randomBytes } from "node:crypto";

const requireRolesMock = vi.hoisted(() =>
  vi.fn(),
);

const propertyFindUniqueMock = vi.hoisted(() =>
  vi.fn(),
);

const credentialUpsertMock = vi.hoisted(() =>
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
    alloggiatiWebCredential: {
      upsert: credentialUpsertMock,
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
  saveAlloggiatiCredentialsAction,
} from "./alloggiati-credential-actions";

const ENV_NAME =
  "HORIZON_CREDENTIAL_ENCRYPTION_KEY";

function createFormData() {
  const formData = new FormData();

  formData.set(
    "propertyId",
    "property-1",
  );

  formData.set(
    "username",
    "test-user",
  );

  formData.set(
    "password",
    "test-password",
  );

  formData.set(
    "wsKey",
    "test-wskey",
  );

  return formData;
}

describe(
  "saveAlloggiatiCredentialsAction",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      process.env[ENV_NAME] =
        randomBytes(32).toString("base64");

      requireRolesMock.mockResolvedValue({
        id: "admin-1",
      });

      propertyFindUniqueMock.mockResolvedValue({
        id: "property-1",
      });

      credentialUpsertMock.mockResolvedValue({
        id: "credential-1",
      });
    });

    afterEach(() => {
      delete process.env[ENV_NAME];
    });

    it(
      "richiede SUPER_ADMIN",
      async () => {
        await saveAlloggiatiCredentialsAction(
          createFormData(),
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
            createFormData(),
          ),
        ).rejects.toThrow(
          "Accesso negato.",
        );

        expect(
          propertyFindUniqueMock,
        ).not.toHaveBeenCalled();

        expect(
          credentialUpsertMock,
        ).not.toHaveBeenCalled();
      },
    );
    it(
      "fallisce senza chiave di cifratura",
      async () => {
        delete process.env[ENV_NAME];

        await expect(
          saveAlloggiatiCredentialsAction(
            createFormData(),
          ),
        ).rejects.toThrow(
          "HORIZON_CREDENTIAL_ENCRYPTION_KEY non configurata.",
        );

        expect(
          credentialUpsertMock,
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
            createFormData(),
          ),
        ).rejects.toThrow(
          "Immobile non trovato.",
        );

        expect(
          credentialUpsertMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "salva solo credenziali cifrate",
      async () => {
        await saveAlloggiatiCredentialsAction(
          createFormData(),
        );

        expect(
          credentialUpsertMock,
        ).toHaveBeenCalledTimes(1);

        const call =
          credentialUpsertMock.mock.calls[0][0];

        const create = call.create;
        const update = call.update;

        expect(call.where).toEqual({
          propertyId: "property-1",
        });

        expect(
          create.usernameEncrypted,
        ).not.toBe("test-user");

        expect(
          create.passwordEncrypted,
        ).not.toBe("test-password");

        expect(
          create.wsKeyEncrypted,
        ).not.toBe("test-wskey");

        expect(
          decryptCredential(
            create.usernameEncrypted,
            process.env[ENV_NAME]!,
          ),
        ).toBe("test-user");

        expect(
          decryptCredential(
            create.passwordEncrypted,
            process.env[ENV_NAME]!,
          ),
        ).toBe("test-password");

        expect(
          decryptCredential(
            create.wsKeyEncrypted,
            process.env[ENV_NAME]!,
          ),
        ).toBe("test-wskey");

        expect(create.keyVersion).toBe(1);
        expect(update.keyVersion).toBe(1);

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
  },
);
