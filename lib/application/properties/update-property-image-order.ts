import { AuditAction } from "@prisma/client";

import { AUDIT_ENTITY_TYPES } from "@/lib/audit/constants";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit/AuditService";

type UpdatePropertyImageOrderInput = {
  propertyId: string;
  imageIds: string[];
};

export async function updatePropertyImageOrder({
  propertyId,
  imageIds,
}: UpdatePropertyImageOrderInput): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    const images =
      await transaction.propertyImage.findMany({
        where: {
          propertyId,
          id: {
            in: imageIds,
          },
        },
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
        select: {
          id: true,
          sortOrder: true,
        },
      });

    if (images.length !== imageIds.length) {
      throw new Error(
        "Una o più immagini non sono state trovate.",
      );
    }

    const previousOrder = images.map(
      (image) => image.id,
    );

    const orderChanged = imageIds.some(
      (imageId, index) =>
        previousOrder[index] !== imageId,
    );

    if (!orderChanged) {
      return;
    }

    await Promise.all(
      imageIds.map((imageId, index) =>
        transaction.propertyImage.update({
          where: {
            id: imageId,
          },
          data: {
            sortOrder: index,
          },
        }),
      ),
    );

    await AuditService.log(
      {
        action: AuditAction.UPDATE,
        propertyId,
        entityType:
          AUDIT_ENTITY_TYPES.PROPERTY_PHOTO,
        entityId: propertyId,
        description:
          "Ordine delle foto dell’immobile aggiornato.",
        metadata: {
          previousOrder,
          newOrder: imageIds,
          totalImages: imageIds.length,
        },
      },
      transaction,
    );
  });
}