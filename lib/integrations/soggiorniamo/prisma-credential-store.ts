import { prisma } from "@/lib/prisma";

export type StoredSoggiorniamoCredential = {
  authCodeEncrypted: string;
  keyVersion: number;
};

export interface SoggiorniamoCredentialStore {
  findByPropertyId(
    propertyId: string,
  ): Promise<StoredSoggiorniamoCredential | null>;
}

export class PrismaSoggiorniamoCredentialStore
  implements SoggiorniamoCredentialStore
{
  async findByPropertyId(
    propertyId: string,
  ): Promise<StoredSoggiorniamoCredential | null> {
    const connection =
      await prisma.soggiorniamoProperty.findUnique({
        where: {
          propertyId,
        },
        select: {
          account: {
            select: {
              authCodeEncrypted: true,
              keyVersion: true,
            },
          },
        },
      });

    return connection?.account ?? null;
  }
}

export const prismaSoggiorniamoCredentialStore =
  new PrismaSoggiorniamoCredentialStore();
