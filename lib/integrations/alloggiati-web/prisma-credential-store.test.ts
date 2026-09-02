import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    alloggiatiWebProperty: {
      findUnique: mocks.findUnique,
    },
  },
}));

import {
  PrismaAlloggiatiWebCredentialStore,
} from "./prisma-credential-store";

describe(
  "PrismaAlloggiatiWebCredentialStore",
  () => {
    beforeEach(() => {
      mocks.findUnique.mockReset();
    });

    it(
      "legge le credenziali cifrate dall'account collegato alla struttura",
      async () => {
        mocks.findUnique.mockResolvedValue({
          account: {
            usernameEncrypted: "user-cipher",
            passwordEncrypted: "password-cipher",
            wsKeyEncrypted: "wskey-cipher",
            keyVersion: 1,
          },
        });

        const store =
          new PrismaAlloggiatiWebCredentialStore();

        await expect(
          store.findByPropertyId(
            "property-1",
          ),
        ).resolves.toEqual({
          usernameEncrypted: "user-cipher",
          passwordEncrypted: "password-cipher",
          wsKeyEncrypted: "wskey-cipher",
          keyVersion: 1,
        });

        expect(
          mocks.findUnique,
        ).toHaveBeenCalledWith({
          where: {
            propertyId: "property-1",
          },
          select: {
            account: {
              select: {
                usernameEncrypted: true,
                passwordEncrypted: true,
                wsKeyEncrypted: true,
                keyVersion: true,
              },
            },
          },
        });
      },
    );

    it(
      "restituisce null se la struttura non ha un account collegato",
      async () => {
        mocks.findUnique.mockResolvedValue(null);

        const store =
          new PrismaAlloggiatiWebCredentialStore();

        await expect(
          store.findByPropertyId(
            "property-1",
          ),
        ).resolves.toBeNull();
      },
    );
  },
);