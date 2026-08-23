import {
  IntegrationProvider as PrismaIntegrationProvider,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  INTEGRATION_PROVIDERS,
  type IntegrationProvider,
} from "./types";

export type UpsertIntegrationPropertyMappingInput = {
  provider: IntegrationProvider;
  externalPropertyId: string;
  propertyId: string;
};

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

export async function upsertIntegrationPropertyMapping({
  provider,
  externalPropertyId,
  propertyId,
}: UpsertIntegrationPropertyMappingInput) {
  const prismaProvider =
    mapIntegrationProvider(
      provider,
    );

  return prisma.$transaction(
    async (transaction) => {
      const mappingByExternalId =
        await transaction.integrationPropertyMapping.findUnique({
          where: {
            provider_externalPropertyId: {
              provider:
                prismaProvider,
              externalPropertyId,
            },
          },
          select: {
            id: true,
            propertyId: true,
          },
        });

      if (
        mappingByExternalId &&
        mappingByExternalId.propertyId !==
          propertyId
      ) {
        throw new Error(
          "Questo identificativo esterno è già associato a un altro immobile.",
        );
      }

      const mappingByProperty =
        await transaction.integrationPropertyMapping.findUnique({
          where: {
            provider_propertyId: {
              provider:
                prismaProvider,
              propertyId,
            },
          },
          select: {
            id: true,
            externalPropertyId: true,
          },
        });

      if (mappingByProperty) {
        if (
          mappingByProperty.externalPropertyId ===
          externalPropertyId
        ) {
          return transaction.integrationPropertyMapping.findUniqueOrThrow({
            where: {
              id:
                mappingByProperty.id,
            },
          });
        }

        return transaction.integrationPropertyMapping.update({
          where: {
            id:
              mappingByProperty.id,
          },
          data: {
            externalPropertyId,
          },
        });
      }

      return transaction.integrationPropertyMapping.create({
        data: {
          provider:
            prismaProvider,
          externalPropertyId,
          propertyId,
        },
      });
    },
  );
}
