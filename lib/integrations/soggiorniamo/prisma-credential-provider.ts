import {
  decryptCredential,
} from "@/lib/security/credential-crypto";

import {
  prismaSoggiorniamoCredentialStore,
} from "./prisma-credential-store";
import type {
  SoggiorniamoCredentialStore,
} from "./prisma-credential-store";

export type SoggiorniamoCredentials = {
  authCode: string;
};

export class PrismaSoggiorniamoCredentialProvider {
  constructor(
    private readonly store: SoggiorniamoCredentialStore =
      prismaSoggiorniamoCredentialStore,
    private readonly keyBase64 =
      process.env.INTEGRATION_CREDENTIALS_KEY ?? "",
    private readonly supportedKeyVersion = 1,
  ) {}

  async getCredentials(input: {
    propertyId: string;
  }): Promise<SoggiorniamoCredentials> {
    const record = await this.store.findByPropertyId(
      input.propertyId,
    );

    if (!record) {
      throw new Error(
        "Soggiorniamo non configurato per la struttura.",
      );
    }

    if (
      record.keyVersion !==
      this.supportedKeyVersion
    ) {
      throw new Error(
        `Versione chiave Soggiorniamo non supportata: ${record.keyVersion}.`,
      );
    }

    return {
      authCode: decryptCredential(
        record.authCodeEncrypted,
        this.keyBase64,
      ),
    };
  }
}

export function createRuntimeSoggiorniamoCredentialProvider() {
  return new PrismaSoggiorniamoCredentialProvider();
}
