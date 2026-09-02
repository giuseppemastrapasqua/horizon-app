import {
  prisma,
} from "@/lib/prisma";

import type {
  AlloggiatiAccountStore,
} from "./apartment-directory";

export class PrismaAlloggiatiAccountStore
  implements AlloggiatiAccountStore
{
  async findByIdAndOwnerId(
    accountId: string,
    ownerId: string,
  ) {
    return prisma.alloggiatiWebAccount.findFirst({
      where: {
        id: accountId,
        ownerId,
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

export const prismaAlloggiatiAccountStore =
  new PrismaAlloggiatiAccountStore();