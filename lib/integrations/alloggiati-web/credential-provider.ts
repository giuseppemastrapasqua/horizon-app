import type {
  AlloggiatiWebCredentials,
} from "./types";

export type AlloggiatiWebCredentialContext = {
  propertyId: string;
};

export interface AlloggiatiWebCredentialProvider {
  getCredentials(
    context: AlloggiatiWebCredentialContext,
  ): Promise<AlloggiatiWebCredentials>;
}

export class UnconfiguredAlloggiatiWebCredentialProvider
  implements AlloggiatiWebCredentialProvider
{
  async getCredentials(
    _context: AlloggiatiWebCredentialContext,
  ): Promise<AlloggiatiWebCredentials> {
    throw new Error(
      "Credenziali Alloggiati Web non ancora configurate.",
    );
  }
}
