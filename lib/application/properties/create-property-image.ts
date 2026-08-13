import { AuditAction } from "@prisma/client";

import { AUDIT_ENTITY_TYPES } from "@/lib/audit/constants";
import { prisma } from "@/lib/prisma";
import { defaultStorageProvider } from "@/lib/storage/default-storage-provider";
import { AuditService } from "@/services/audit/AuditService";

import { uploadPropertyImage } from "../../properties/upload-property-image";

type CreatePropertyImageInput = {
  propertyId: string;
  file: File;
};

type CreatePropertyImageResult = {
  imageId: string;
  url: string;
  filename: string;
  sortOrder: number;
  isCover: boolean;
};

export async function createPropertyImage({
  propertyId,
  file,
}: CreatePropertyImageInput): Promise<CreatePropertyImageResult> {
  const property = await prisma.property.findUnique({
    where: {
      id: propertyId,
    },
    select: {
      id: true,
    },
  });

  if (!property) {
    throw new Error("Immobile non trovato.");
  }

  const uploaded = await uploadPropertyImage({
    propertyId,
    file,
  });

  try {
    return await prisma.$transaction(async (transaction) => {
      const [imageCount, highestSortOrder] =
        await Promise.all([
          transaction.propertyImage.count({
            where: {
              propertyId,
            },
          }),

          transaction.propertyImage.aggregate({
            where: {
              propertyId,
            },
            _max: {
              sortOrder: true,
            },
          }),
        ]);

      const sortOrder =
        (highestSortOrder._max.sortOrder ?? -1) + 1;

      const isCover = imageCount === 0;

      const image =
        await transaction.propertyImage.create({
          data: {
            propertyId,
            url: uploaded.url,
            filename: uploaded.key,
            sortOrder,
            isCover,
          },
          select: {
            id: true,
            url: true,
            filename: true,
            sortOrder: true,
            isCover: true,
          },
        });

      await AuditService.log(
        {
          action: AuditAction.CREATE,
          propertyId,
          entityType:
            AUDIT_ENTITY_TYPES.PROPERTY_PHOTO,
          entityId: image.id,
          description:
            "Nuova foto dell’immobile caricata.",
          metadata: {
            filename: uploaded.key,
            url: uploaded.url,
            sortOrder,
            isCover,
            originalFilename: file.name || null,
            mimeType: file.type || null,
            size: file.size,
          },
        },
        transaction,
      );

      return {
        imageId: image.id,
        url: image.url,
        filename: image.filename,
        sortOrder: image.sortOrder,
        isCover: image.isCover,
      };
    });
  } catch (error) {
    await defaultStorageProvider
      .delete(uploaded.key)
      .catch(() => {
        // Manteniamo l'errore originale del database.
      });

    throw error;
  }
}