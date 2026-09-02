import {
  decryptCredential,
} from "@/lib/security/credential-crypto";

import type {
  AlloggiatiWebCredentialProvider,
} from "./credential-provider";

export type AlloggiatiWebCredentialRecord = {
  usernameEncrypted: string;
  passwordEncrypted: string;
  wsKeyEncrypted: string;
  keyVersion: number;
};

export interface AlloggiatiWebCredentialStore {
  findByPropertyId(
    propertyId: string,
  ): Promise<AlloggiatiWebCredentialRecord | null>;
}

export class PrismaAlloggiatiWebCredentialProvider
  implements AlloggiatiWebCredentialProvider
{
  constructor(
    private readonly store:
      AlloggiatiWebCredentialStore,
    private readonly encryptionKey: string,
    private readonly supportedKeyVersion = 1,
  ) {}

  async getCredentials(
    context: {
      propertyId: string;
    },
  ) {
    const record =
      await this.store.findByPropertyId(
        context.propertyId,
      );

    if (!record) {
      throw new Error(
        "Account Alloggiati Web non collegato alla struttura.",
      );
    }

    if (
      record.keyVersion !==
      this.supportedKeyVersion
    ) {
      throw new Error(
        "Versione chiave credenziali Alloggiati Web non supportata.",
      );
    }

    return {
      username: decryptCredential(
        record.usernameEncrypted,
        this.encryptionKey,
      ),
      password: decryptCredential(
        record.passwordEncrypted,
        this.encryptionKey,
      ),
      wsKey: decryptCredential(
        record.wsKeyEncrypted,
        this.encryptionKey,
      ),
    };
  }
}