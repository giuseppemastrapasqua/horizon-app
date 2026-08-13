import type {
  ExternalPropertyResolver,
  ResolvedExternalProperty,
} from "./external-property-resolver";
import type { IntegrationProvider } from "./types";

function createMappingKey(
  provider: IntegrationProvider,
  externalPropertyId: string,
): string {
  return `${provider}:${externalPropertyId}`;
}

export class InMemoryExternalPropertyResolver
  implements ExternalPropertyResolver
{
  private readonly mappings = new Map<
    string,
    ResolvedExternalProperty
  >();

  registerMapping(input: {
    provider: IntegrationProvider;
    externalPropertyId: string;
    propertyId: string;
    ownerId: string;
  }): void {
    const key = createMappingKey(
      input.provider,
      input.externalPropertyId,
    );

    this.mappings.set(key, {
      propertyId: input.propertyId,
      ownerId: input.ownerId,
    });
  }

  async resolveProperty(input: {
    provider: IntegrationProvider;
    externalPropertyId: string;
  }): Promise<ResolvedExternalProperty | null> {
    const key = createMappingKey(
      input.provider,
      input.externalPropertyId,
    );

    return this.mappings.get(key) ?? null;
  }

  clear(): void {
    this.mappings.clear();
  }
}

export const inMemoryExternalPropertyResolver =
  new InMemoryExternalPropertyResolver();