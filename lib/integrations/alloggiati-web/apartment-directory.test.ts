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
  AlloggiatiWebApartmentDirectory,
} from "./apartment-directory";
import type {
  AlloggiatiWebTransport,
} from "./transport";

const encryptionKey =
  Buffer.alloc(32, 7).toString("base64");

function createTransport() {
  return {
    authenticate: vi.fn(
      async () => ({
        token: "token-123",
      }),
    ),
    getTable: vi.fn(
      async () => ({
        csv:
          "IdAppartamento;Descrizione\n123;Casa Centro",
      }),
    ),
    validateSubmission: vi.fn(),
    submit: vi.fn(),
    getReceipt: vi.fn(),
  } as unknown as AlloggiatiWebTransport;
}

function encryptedAccount() {
  return {
    usernameEncrypted:
      encryptCredential(
        "user",
        encryptionKey,
      ),
    passwordEncrypted:
      encryptCredential(
        "password",
        encryptionKey,
      ),
    wsKeyEncrypted:
      encryptCredential(
        "wskey",
        encryptionKey,
      ),
    keyVersion: 1,
  };
}

describe(
  "AlloggiatiWebApartmentDirectory",
  () => {
    it(
      "restituisce gli appartamenti dell account",
      async () => {
        const store = {
          findByIdAndOwnerId: vi.fn(
            async () =>
              encryptedAccount(),
          ),
        };

        const transport =
          createTransport();

        const directory =
          new AlloggiatiWebApartmentDirectory(
            store,
            transport,
            encryptionKey,
          );

        await expect(
          directory.listApartments(
            "account-1",
            "owner-1",
          ),
        ).resolves.toEqual([
          {
            apartmentId: "123",
            description: "Casa Centro",
          },
        ]);

        expect(
          store.findByIdAndOwnerId,
        ).toHaveBeenCalledWith(
          "account-1",
          "owner-1",
        );

        expect(
          transport.authenticate,
        ).toHaveBeenCalledWith({
          username: "user",
          password: "password",
          wsKey: "wskey",
        });

        expect(
          transport.getTable,
        ).toHaveBeenCalledWith(
          {
            token: "token-123",
          },
          "ListaAppartamenti",
        );
      },
    );

    it(
      "blocca account di altro owner",
      async () => {
        const store = {
          findByIdAndOwnerId: vi.fn(
            async () => null,
          ),
        };

        const transport =
          createTransport();

        const directory =
          new AlloggiatiWebApartmentDirectory(
            store,
            transport,
            encryptionKey,
          );

        await expect(
          directory.listApartments(
            "account-1",
            "owner-2",
          ),
        ).rejects.toThrow(
          "Account Alloggiati Web non disponibile.",
        );

        expect(
          transport.authenticate,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rifiuta versioni chiave non supportate",
      async () => {
        const store = {
          findByIdAndOwnerId: vi.fn(
            async () => ({
              ...encryptedAccount(),
              keyVersion: 2,
            }),
          ),
        };

        const transport =
          createTransport();

        const directory =
          new AlloggiatiWebApartmentDirectory(
            store,
            transport,
            encryptionKey,
          );

        await expect(
          directory.listApartments(
            "account-1",
            "owner-1",
          ),
        ).rejects.toThrow(
          "Versione chiave credenziali Alloggiati Web non supportata.",
        );

        expect(
          transport.authenticate,
        ).not.toHaveBeenCalled();
      },
    );
  },
);