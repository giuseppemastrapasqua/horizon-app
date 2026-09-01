import type {
  AlloggiatiWebCredential,
} from "@prisma/client";

import {
  decryptCredential,
} from "@/lib/security/credential-crypto";

import type {
  AlloggiatiWebCredentialProvider,
} from "./credential-provider";

type CredentialRecord = Pick<
  AlloggiatiWebCredential,
  | "usernameEncrypted"
  | "passwordEncrypted"
  | "wsKeyEncrypted"
  | "keyVersion"
>;

export interface AlloggiatiWebCredentialStore {
  findByPropertyId(
    propertyId: string,
  ): Promise<CredentialRecord | null>;
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
        "Credenziali Alloggiati Web non configurate per la struttura.",
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
