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
    return prisma.alloggiatiWebCredential.findUnique({
      where: {
        propertyId,
      },
      select: {
        usernameEncrypted: true,
        passwordEncrypted: true,
        wsKeyEncrypted: true,
        keyVersion: true,
      },
    });
  }
}

export const prismaAlloggiatiWebCredentialStore =
  new PrismaAlloggiatiWebCredentialStore();
