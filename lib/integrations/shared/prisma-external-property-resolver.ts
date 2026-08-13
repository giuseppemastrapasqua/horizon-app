import {
  IntegrationProvider as PrismaIntegrationProvider,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type {
  ExternalPropertyResolver,
  ResolvedExternalProperty,
} from "./external-property-resolver";
import {
  INTEGRATION_PROVIDERS,
  type IntegrationProvider,
} from "./types";

function mapIntegrationProvider(
  provider: IntegrationProvider,
): PrismaIntegrationProvider {
  switch (provider) {
    case INTEGRATION_PROVIDERS.BOOKING_COM:
      return PrismaIntegrationProvider.BOOKING_COM;

    case INTEGRATION_PROVIDERS.AIRBNB:
      return PrismaIntegrationProvider.AIRBNB;

    case INTEGRATION_PROVIDERS.VRBO:
      return PrismaIntegrationProvider.VRBO;

    case INTEGRATION_PROVIDERS.ICAL:
      return PrismaIntegrationProvider.ICAL;

    case INTEGRATION_PROVIDERS.ALLOGGIATI_WEB:
      return PrismaIntegrationProvider.ALLOGGIATI_WEB;

    case INTEGRATION_PROVIDERS.ISTAT:
      return PrismaIntegrationProvider.ISTAT;

    case INTEGRATION_PROVIDERS.SOGGIORNIAMO:
      return PrismaIntegrationProvider.SOGGIORNIAMO;

    case INTEGRATION_PROVIDERS.STRIPE:
      return PrismaIntegrationProvider.STRIPE;
  }
}

export class PrismaExternalPropertyResolver
  implements ExternalPropertyResolver
{
  async resolveProperty(input: {
    provider: IntegrationProvider;
    externalPropertyId: string;
    integrationConnectionId?: string;
  }): Promise<ResolvedExternalProperty | null> {
    if (input.integrationConnectionId) {
      const connectionProperty =
        await prisma.integrationConnectionProperty.findFirst({
          where: {
            connectionId:
              input.integrationConnectionId,
            externalPropertyId:
              input.externalPropertyId,
            connection: {
              enabled: true,
            },
          },
          select: {
            propertyId: true,
            property: {
              select: {
                ownerId: true,
              },
            },
          },
        });

      if (connectionProperty) {
        return {
          propertyId:
            connectionProperty.propertyId,
          ownerId:
            connectionProperty.property.ownerId,
        };
      }

      return null;
    }

    const mapping =
      await prisma.integrationPropertyMapping.findUnique({
        where: {
          provider_externalPropertyId: {
            provider: mapIntegrationProvider(
              input.provider,
            ),
            externalPropertyId:
              input.externalPropertyId,
          },
        },
        select: {
          propertyId: true,
          property: {
            select: {
              ownerId: true,
            },
          },
        },
      });

    if (!mapping) {
      return null;
    }

    return {
      propertyId:
        mapping.propertyId,
      ownerId:
        mapping.property.ownerId,
    };
  }
}

export const prismaExternalPropertyResolver =
  new PrismaExternalPropertyResolver();