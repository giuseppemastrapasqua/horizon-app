import type { IntegrationProvider } from "./types";

export type ResolvedExternalProperty = {
  propertyId: string;
  ownerId: string;
};

export interface ExternalPropertyResolver {
  resolveProperty(input: {
    provider: IntegrationProvider;
    externalPropertyId: string;
    integrationConnectionId?: string;
  }): Promise<ResolvedExternalProperty | null>;
}