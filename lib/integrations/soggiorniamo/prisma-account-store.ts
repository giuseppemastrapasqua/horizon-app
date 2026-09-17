import { prisma } from "@/lib/prisma";

export class PrismaSoggiorniamoAccountStore {
  async findByPropertyId(propertyId: string) {
    return prisma.soggiorniamoProperty.findUnique({
      where: {
        propertyId,
      },
      select: {
        structureId: true,
        structureName: true,
        unitId: true,
        account: {
          select: {
            id: true,
            ownerId: true,
            name: true,
            municipalityCode: true,
            userCode: true,
            managerTaxCode: true,
            managerFirstName: true,
            managerLastName: true,
          },
        },
      },
    });
  }
}

export const prismaSoggiorniamoAccountStore =
  new PrismaSoggiorniamoAccountStore();
