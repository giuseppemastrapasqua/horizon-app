import {
  randomBytes,
} from "node:crypto";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  encryptCredential,
} from "@/lib/security/credential-crypto";

import {
  PrismaAlloggiatiWebCredentialProvider,
} from "./prisma-credential-provider";

function createKey(): string {
  return randomBytes(32).toString("base64");
}

describe(
  "PrismaAlloggiatiWebCredentialProvider",
  () => {
    it(
      "decifra le credenziali della struttura",
      async () => {
        const key = createKey();

        const store = {
          findByPropertyId: vi.fn(
            async () => ({
              usernameEncrypted:
                encryptCredential(
                  "user-1",
                  key,
                ),
              passwordEncrypted:
                encryptCredential(
                  "password-1",
                  key,
                ),
              wsKeyEncrypted:
                encryptCredential(
                  "wskey-1",
                  key,
                ),
              keyVersion: 1,
            }),
          ),
        };

        const provider =
          new PrismaAlloggiatiWebCredentialProvider(
            store,
            key,
          );

        await expect(
          provider.getCredentials({
            propertyId: "property-1",
          }),
        ).resolves.toEqual({
          username: "user-1",
          password: "password-1",
          wsKey: "wskey-1",
        });

        expect(
          store.findByPropertyId,
        ).toHaveBeenCalledWith(
          "property-1",
        );
      },
    );

    it(
      "rifiuta una struttura senza credenziali",
      async () => {
        const store = {
          findByPropertyId: vi.fn(
            async () => null,
          ),
        };

        const provider =
          new PrismaAlloggiatiWebCredentialProvider(
            store,
            createKey(),
          );

        await expect(
          provider.getCredentials({
            propertyId: "property-1",
          }),
        ).rejects.toThrow(
          "Credenziali Alloggiati Web non configurate per la struttura.",
        );
      },
    );

    it(
      "rifiuta una versione chiave non supportata",
      async () => {
        const key = createKey();

        const store = {
          findByPropertyId: vi.fn(
            async () => ({
              usernameEncrypted: "unused",
              passwordEncrypted: "unused",
              wsKeyEncrypted: "unused",
              keyVersion: 2,
            }),
          ),
        };

        const provider =
          new PrismaAlloggiatiWebCredentialProvider(
            store,
            key,
          );

        await expect(
          provider.getCredentials({
            propertyId: "property-1",
          }),
        ).rejects.toThrow(
          "Versione chiave credenziali Alloggiati Web non supportata.",
        );
      },
    );

    it(
      "fallisce con una chiave di cifratura errata",
      async () => {
        const encryptionKey =
          createKey();

        const store = {
          findByPropertyId: vi.fn(
            async () => ({
              usernameEncrypted:
                encryptCredential(
                  "user-1",
                  encryptionKey,
                ),
              passwordEncrypted:
                encryptCredential(
                  "password-1",
                  encryptionKey,
                ),
              wsKeyEncrypted:
                encryptCredential(
                  "wskey-1",
                  encryptionKey,
                ),
              keyVersion: 1,
            }),
          ),
        };

        const provider =
          new PrismaAlloggiatiWebCredentialProvider(
            store,
            createKey(),
          );

        await expect(
          provider.getCredentials({
            propertyId: "property-1",
          }),
        ).rejects.toThrow();
      },
    );
  },
);
