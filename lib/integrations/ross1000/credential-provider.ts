import type { Ross1000Credentials } from "./types";

export type Ross1000CredentialContext = {
  propertyId: string;
};

export interface Ross1000CredentialProvider {
  getCredentials(
    context: Ross1000CredentialContext,
  ): Promise<Ross1000Credentials>;
}

export class UnconfiguredRoss1000CredentialProvider
  implements Ross1000CredentialProvider
{
  async getCredentials(
    _context: Ross1000CredentialContext,
  ): Promise<Ross1000Credentials> {
    throw new Error(
      "Credenziali ROSS1000 non ancora configurate.",
    );
  }
}
