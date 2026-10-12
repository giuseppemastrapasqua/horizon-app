import { prisma } from "@/lib/prisma";

export type Ross1000PropertyConnection = {
  accountId: string;
  propertyId: string;
  structureCode: string;
  accountName: string;
};

export class PrismaRoss1000AccountStore {
  async findByPropertyId(
    propertyId: string,
  ): Promise<Ross1000PropertyConnection | null> {
    const connection =
      await prisma.ross1000Property.findUnique({
        where: {
          propertyId,
        },
        select: {
          accountId: true,
          propertyId: true,
          structureCode: true,
          account: {
            select: {
              name: true,
            },
          },
        },
      });

    if (!connection) {
      return null;
    }

    return {
      accountId: connection.accountId,
      propertyId: connection.propertyId,
      structureCode: connection.structureCode,
      accountName: connection.account.name,
    };
  }
}

export const prismaRoss1000AccountStore =
  new PrismaRoss1000AccountStore();
