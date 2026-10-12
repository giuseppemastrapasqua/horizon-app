import {
  decryptCredential,
} from "@/lib/security/credential-crypto";

import type {
  Ross1000CredentialProvider,
} from "./credential-provider";

export type Ross1000CredentialRecord = {
  usernameEncrypted: string;
  passwordEncrypted: string;
  keyVersion: number;
};

export interface Ross1000CredentialStore {
  findByPropertyId(
    propertyId: string,
  ): Promise<Ross1000CredentialRecord | null>;
}

export class PrismaRoss1000CredentialProvider
  implements Ross1000CredentialProvider
{
  constructor(
    private readonly store: Ross1000CredentialStore,
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
        "Account ROSS1000 non collegato alla struttura.",
      );
    }

    if (
      record.keyVersion !==
      this.supportedKeyVersion
    ) {
      throw new Error(
        "Versione chiave credenziali ROSS1000 non supportata.",
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
    };
  }
}
