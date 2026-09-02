import { prisma } from "@/lib/prisma";

import type {
  AlloggiatiWebCredentialStore,
} from "./prisma-credential-provider";

export class PrismaAlloggiatiWebCredentialStore
  implements AlloggiatiWebCredentialStore
{
  async findByPropertyId(
    propertyId: string,
  ) {
    const connection =
      await prisma.alloggiatiWebProperty.findUnique({
        where: {
          propertyId,
        },
        select: {
          account: {
            select: {
              usernameEncrypted: true,
              passwordEncrypted: true,
              wsKeyEncrypted: true,
              keyVersion: true,
            },
          },
        },
      });

    return connection?.account ?? null;
  }
}

export const prismaAlloggiatiWebCredentialStore =
  new PrismaAlloggiatiWebCredentialStore();