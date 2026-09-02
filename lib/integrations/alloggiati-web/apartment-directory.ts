import {
  decryptCredential,
} from "@/lib/security/credential-crypto";

import {
  AlloggiatiWebAdapter,
} from "./adapter";
import {
  parseAlloggiatiApartmentList,
  type AlloggiatiApartment,
} from "./apartment-list-parser";
import type {
  AlloggiatiWebTransport,
} from "./transport";

export type AlloggiatiAccountCredentialRecord = {
  usernameEncrypted: string;
  passwordEncrypted: string;
  wsKeyEncrypted: string;
  keyVersion: number;
};

export interface AlloggiatiAccountStore {
  findByIdAndOwnerId(
    accountId: string,
    ownerId: string,
  ): Promise<AlloggiatiAccountCredentialRecord | null>;
}

export class AlloggiatiWebApartmentDirectory {
  constructor(
    private readonly store: AlloggiatiAccountStore,
    private readonly transport: AlloggiatiWebTransport,
    private readonly encryptionKey: string,
    private readonly supportedKeyVersion = 1,
  ) {}

  async listApartments(
    accountId: string,
    ownerId: string,
  ): Promise<AlloggiatiApartment[]> {
    const account =
      await this.store.findByIdAndOwnerId(
        accountId,
        ownerId,
      );

    if (!account) {
      throw new Error(
        "Account Alloggiati Web non disponibile.",
      );
    }

    if (
      account.keyVersion !==
      this.supportedKeyVersion
    ) {
      throw new Error(
        "Versione chiave credenziali Alloggiati Web non supportata.",
      );
    }

    const adapter =
      new AlloggiatiWebAdapter(
        this.transport,
        {
          username: decryptCredential(
            account.usernameEncrypted,
            this.encryptionKey,
          ),
          password: decryptCredential(
            account.passwordEncrypted,
            this.encryptionKey,
          ),
          wsKey: decryptCredential(
            account.wsKeyEncrypted,
            this.encryptionKey,
          ),
        },
      );

    const table =
      await adapter.getTable(
        "ListaAppartamenti",
      );

    return parseAlloggiatiApartmentList(
      table.csv,
    );
  }
}