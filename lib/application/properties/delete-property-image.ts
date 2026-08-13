import { AuditAction } from "@prisma/client";

import { AUDIT_ENTITY_TYPES } from "@/lib/audit/constants";
import { enqueueBackgroundJob } from "@/lib/job/enqueue-background-job";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit/AuditService";

type DeletePropertyImageInput = {
  propertyId: string;
  imageId: string;
};

export async function deletePropertyImage({
  propertyId,
  imageId,
}: DeletePropertyImageInput): Promise<void> {
  const image = await prisma.propertyImage.findFirst({
    where: {
      id: imageId,
      propertyId,
    },
    select: {
      id: true,
      filename: true,
      url: true,
      sortOrder: true,
      isCover: true,
    },
  });

  if (!image) {
    throw new Error("Foto non trovata.");
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.propertyImage.delete({
      where: {
        id: image.id,
      },
    });

    let nextCoverImageId: string | null = null;

    if (image.isCover) {
      const nextCover =
        await transaction.propertyImage.findFirst({
          where: {
            propertyId,
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
          },
        });

      if (nextCover) {
        await transaction.propertyImage.update({
          where: {
            id: nextCover.id,
          },
          data: {
            isCover: true,
          },
        });

        nextCoverImageId = nextCover.id;
      }
    }

    await AuditService.log(
      {
        action: AuditAction.DELETE,
        propertyId,
        entityType:
          AUDIT_ENTITY_TYPES.PROPERTY_PHOTO,
        entityId: image.id,
        description:
          "Foto dell’immobile eliminata.",
        metadata: {
          filename: image.filename,
          url: image.url,
          sortOrder: image.sortOrder,
          wasCover: image.isCover,
          nextCoverImageId,
        },
      },
      transaction,
    );

    await enqueueBackgroundJob(
      {
        type: "STORAGE_OBJECT_DELETE",
        payload: {
          key: image.filename,
        },
        deduplicationKey:
          `storage-object-delete:${image.filename}`,
        maxAttempts: 5,
      },
      transaction,
    );
  });
}