import { AuditAction } from "@prisma/client";

import { AUDIT_ENTITY_TYPES } from "@/lib/audit/constants";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit/AuditService";

type SetPropertyCoverImageInput = {
  propertyId: string;
  imageId: string;
};

export async function setPropertyCoverImage({
  propertyId,
  imageId,
}: SetPropertyCoverImageInput): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    const image =
      await transaction.propertyImage.findFirst({
        where: {
          id: imageId,
          propertyId,
        },
        select: {
          id: true,
          isCover: true,
          filename: true,
          url: true,
        },
      });

    if (!image) {
      throw new Error("Foto non trovata.");
    }

    if (image.isCover) {
      return;
    }

    const previousCover =
      await transaction.propertyImage.findFirst({
        where: {
          propertyId,
          isCover: true,
        },
        select: {
          id: true,
          filename: true,
          url: true,
        },
      });

    await transaction.propertyImage.updateMany({
      where: {
        propertyId,
        isCover: true,
      },
      data: {
        isCover: false,
      },
    });

    await transaction.propertyImage.update({
      where: {
        id: image.id,
      },
      data: {
        isCover: true,
      },
    });

    await AuditService.log(
      {
        action: AuditAction.UPDATE,
        propertyId,
        entityType:
          AUDIT_ENTITY_TYPES.PROPERTY_PHOTO,
        entityId: image.id,
        description:
          "Foto di copertina dell’immobile aggiornata.",
        metadata: {
          previousCover: previousCover
            ? {
                imageId: previousCover.id,
                filename: previousCover.filename,
                url: previousCover.url,
              }
            : null,
          newCover: {
            imageId: image.id,
            filename: image.filename,
            url: image.url,
          },
        },
      },
      transaction,
    );
  });
}