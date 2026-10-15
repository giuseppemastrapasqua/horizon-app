import { prisma } from "@/lib/prisma";

import type {
  Ross1000CredentialStore,
} from "./prisma-credential-provider";

export class PrismaRoss1000CredentialStore
  implements Ross1000CredentialStore
{
  async findByPropertyId(
    propertyId: string,
  ) {
    const connection =
      await prisma.ross1000Property.findUnique({
        where: {
          propertyId,
        },
        select: {
          account: {
            select: {
              usernameEncrypted: true,
              passwordEncrypted: true,
              keyVersion: true,
            },
          },
        },
      });

    return connection?.account ?? null;
  }
}

export const prismaRoss1000CredentialStore =
  new PrismaRoss1000CredentialStore();
