"use server";

import {
  AuditAction,
  PropertyDocumentOcrStatus,
  PropertyDocumentType,
  PropertyDocumentValidity,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requirePropertyRole } from "@/lib/auth/guards";
import { enqueueBackgroundJob } from "@/lib/job/enqueue-background-job";
import { prisma } from "@/lib/prisma";
import { uploadPropertyDocument } from "@/lib/properties/upload-property-document";
import { defaultPrivateStorageProvider } from "@/lib/storage/default-private-storage-provider";
import { AuditService } from "@/services/audit/AuditService";
import { AUDIT_ENTITY_TYPES } from "@/lib/audit/constants";

function getOptionalString(
  formData: FormData,
  fieldName: string,
): string | null {
  const value = formData.get(fieldName);

  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length > 0
    ? normalizedValue
    : null;
}

function getRequiredString(
  formData: FormData,
  fieldName: string,
  errorMessage: string,
): string {
  const value = getOptionalString(
    formData,
    fieldName,
  );

  if (!value) {
    throw new Error(errorMessage);
  }

  return value;
}

function getOptionalFile(
  formData: FormData,
  fieldName: string,
): File | null {
  const value = formData.get(fieldName);

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

function getOptionalDate(
  formData: FormData,
  fieldName: string,
): Date | null {
  const value = getOptionalString(
    formData,
    fieldName,
  );

  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      `La data indicata nel campo "${fieldName}" non è valida.`,
    );
  }

  return date;
}

function isPropertyDocumentType(
  value: string,
): value is PropertyDocumentType {
  return Object.values(
    PropertyDocumentType,
  ).includes(value as PropertyDocumentType);
}

function isPropertyDocumentValidity(
  value: string,
): value is PropertyDocumentValidity {
  return Object.values(
    PropertyDocumentValidity,
  ).includes(value as PropertyDocumentValidity);
}

function getDocumentType(
  formData: FormData,
): PropertyDocumentType {
  const value = getRequiredString(
    formData,
    "type",
    "Il tipo di documento è obbligatorio.",
  );

  if (!isPropertyDocumentType(value)) {
    throw new Error(
      "Il tipo di documento selezionato non è valido.",
    );
  }

  return value;
}

function getDocumentValidity(
  formData: FormData,
): PropertyDocumentValidity {
  const value = getRequiredString(
    formData,
    "validity",
    "Lo stato di validità è obbligatorio.",
  );

  if (!isPropertyDocumentValidity(value)) {
    throw new Error(
      "Lo stato di validità selezionato non è valido.",
    );
  }

  return value;
}

async function ensurePropertyExists(
  propertyId: string,
): Promise<void> {
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
}

function revalidatePropertyPaths(
  propertyId: string,
): void {
  revalidatePath(`/properties/${propertyId}`);
  revalidatePath(`/properties/${propertyId}/edit`);
}

function getOcrDeduplicationKey(
  documentId: string,
  requestedAt: Date,
): string {
  return [
    "property-document-ocr",
    documentId,
    requestedAt.getTime(),
  ].join(":");
}

export async function createPropertyDocumentAction(
  formData: FormData,
): Promise<void> {
  const propertyId = getRequiredString(
    formData,
    "propertyId",
    "Immobile non specificato.",
  );

  const user = await requirePropertyRole(propertyId, ["OWNER", "MANAGER"]);

  await ensurePropertyExists(propertyId);

  const issueDate = getOptionalDate(
    formData,
    "issueDate",
  );

  const expiryDate = getOptionalDate(
    formData,
    "expiryDate",
  );

  if (
    issueDate &&
    expiryDate &&
    expiryDate < issueDate
  ) {
    throw new Error(
      "La data di scadenza non può precedere la data di rilascio.",
    );
  }

  const type = getDocumentType(formData);

  const title = getRequiredString(
    formData,
    "title",
    "Il titolo del documento è obbligatorio.",
  );

  const file = getOptionalFile(formData, "file");

  if (!file) {
    throw new Error(
      "Seleziona il documento da caricare.",
    );
  }

  const uploaded = await uploadPropertyDocument(
    propertyId,
    file,
  );

  try {
    await prisma.$transaction(
      async (transaction) => {
        const document =
          await transaction.propertyDocument.create({
            data: {
              propertyId,
              type,
              title,
              documentNumber: getOptionalString(
                formData,
                "documentNumber",
              ),
              issuer: getOptionalString(
                formData,
                "issuer",
              ),
              issueDate,
              expiryDate,
              validity: getDocumentValidity(formData),
              fileUrl: null,
              filename: uploaded.filename,
              storageKey: uploaded.storageKey,
              contentType: uploaded.contentType,
              fileSize: uploaded.fileSize,
              encryptionVersion:
                uploaded.encryptionVersion,
              ocrStatus:
                PropertyDocumentOcrStatus.NOT_REQUESTED,
              ocrRequestedAt: null,
              notes: getOptionalString(
                formData,
                "notes",
              ),
            },
            select: {
              id: true,
            },
          });

        await AuditService.log(
          {
            actorId: user.id,
            action: AuditAction.CREATE,
            propertyId,
            entityType:
              AUDIT_ENTITY_TYPES.PROPERTY_DOCUMENT,
            entityId: document.id,
            description:
              "Documento immobile creato.",
            metadata: {
              propertyId,
              title,
              type,
              encryptedStorage: true,
              ocrRequested: false,
            },
          },
          transaction,
        );
      },
    );
  } catch (error) {
    try {
      await defaultPrivateStorageProvider.delete(
        uploaded.storageKey,
      );
    } catch (cleanupError) {
      console.error(
        "Cleanup documento cifrato fallito.",
        cleanupError,
      );
    }

    throw error;
  }

  revalidatePropertyPaths(propertyId);
}
export async function updatePropertyDocumentAction(
  formData: FormData,
): Promise<void> {
  const propertyId = getRequiredString(formData, "propertyId", "Immobile non specificato.");
  const user = await requirePropertyRole(propertyId, ["OWNER", "MANAGER"]);
  const documentId = getRequiredString(formData, "documentId", "Documento non specificato.");

  const document = await prisma.propertyDocument.findFirst({
    where: { id: documentId, propertyId },
    select: { id: true, storageKey: true },
  });

  if (!document) {
    throw new Error("Documento non trovato.");
  }

  const issueDate = getOptionalDate(formData, "issueDate");
  const expiryDate = getOptionalDate(formData, "expiryDate");

  if (issueDate && expiryDate && expiryDate < issueDate) {
    throw new Error("La data di scadenza non può precedere la data di rilascio.");
  }

  const replacementFile = getOptionalFile(formData, "file");
  const replacement = replacementFile
    ? await uploadPropertyDocument(propertyId, replacementFile)
    : null;

  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.propertyDocument.update({
        where: { id: document.id },
        data: {
          type: getDocumentType(formData),
          title: getRequiredString(formData, "title", "Il titolo del documento è obbligatorio."),
          documentNumber: getOptionalString(formData, "documentNumber"),
          issuer: getOptionalString(formData, "issuer"),
          issueDate,
          expiryDate,
          validity: getDocumentValidity(formData),
          notes: getOptionalString(formData, "notes"),
          ...(replacement
            ? {
                fileUrl: null,
                filename: replacement.filename,
                storageKey: replacement.storageKey,
                contentType: replacement.contentType,
                fileSize: replacement.fileSize,
                encryptionVersion: replacement.encryptionVersion,
                ocrStatus: PropertyDocumentOcrStatus.NOT_REQUESTED,
                ocrRequestedAt: null,
                ocrStartedAt: null,
                ocrCompletedAt: null,
                ocrExtractedText: null,
                ocrProvider: null,
                ocrProviderVersion: null,
                ocrError: null,
              }
            : {}),
        },
      });

      await AuditService.log(
        {
          actorId: user.id,
          action: AuditAction.UPDATE,
          propertyId,
          entityType: AUDIT_ENTITY_TYPES.PROPERTY_DOCUMENT,
          entityId: document.id,
          description: "Documento immobile aggiornato.",
          metadata: {
            propertyId,
            attachmentReplaced: Boolean(replacement),
            encryptedStorage: Boolean(replacement),
            ocrRequested: false,
          },
        },
        transaction,
      );
    });
  } catch (error) {
    if (replacement) {
      try {
        await defaultPrivateStorageProvider.delete(replacement.storageKey);
      } catch (cleanupError) {
        console.error("Cleanup nuovo allegato cifrato fallito.", cleanupError);
      }
    }

    throw error;
  }

  if (replacement && document.storageKey) {
    try {
      await defaultPrivateStorageProvider.delete(document.storageKey);
    } catch (cleanupError) {
      console.error("Cleanup precedente allegato cifrato fallito.", cleanupError);
    }
  }

  revalidatePropertyPaths(propertyId);
}


export async function retryPropertyDocumentOcrAction(
  formData: FormData,
): Promise<void> {
  const propertyId = getRequiredString(
    formData,
    "propertyId",
    "Immobile non specificato.",
  );

  const user = await requirePropertyRole(propertyId, ["OWNER", "MANAGER"]);

  const documentId = getRequiredString(
    formData,
    "documentId",
    "Documento non specificato.",
  );

  const document =
    await prisma.propertyDocument.findFirst({
      where: {
        id: documentId,
        propertyId,
      },
      select: {
        id: true,
        fileUrl: true,
        storageKey: true,
        filename: true,
        ocrStatus: true,
      },
    });

  if (!document) {
    throw new Error("Documento non trovato.");
  }

  if (!document.storageKey && !document.fileUrl) {
    throw new Error(
      "Non è possibile avviare l'OCR senza un file allegato.",
    );
  }

  if (
    document.ocrStatus ===
      PropertyDocumentOcrStatus.QUEUED ||
    document.ocrStatus ===
      PropertyDocumentOcrStatus.PROCESSING
  ) {
    revalidatePropertyPaths(propertyId);
    return;
  }

  const ocrRequestedAt = new Date();

  const result =
    await prisma.propertyDocument.updateMany({
      where: {
        id: document.id,
        ocrStatus: {
          notIn: [
            PropertyDocumentOcrStatus.QUEUED,
            PropertyDocumentOcrStatus.PROCESSING,
          ],
        },
      },
      data: {
        ocrStatus:
          PropertyDocumentOcrStatus.QUEUED,
        ocrRequestedAt,
        ocrStartedAt: null,
        ocrCompletedAt: null,
        ocrExtractedText: null,
        ocrProvider: null,
        ocrProviderVersion: null,
        ocrError: null,
      },
    });

  if (result.count !== 1) {
    revalidatePropertyPaths(propertyId);
    return;
  }

  try {
    await enqueueBackgroundJob({
      type: "PROPERTY_DOCUMENT_OCR",
      payload: {
        documentId: document.id,
        propertyId,
        ...(document.storageKey
          ? { storageKey: document.storageKey }
          : { fileUrl: document.fileUrl! }),
        ...(document.filename
          ? {
              filename: document.filename,
            }
          : {}),
      },
      deduplicationKey:
        getOcrDeduplicationKey(
          document.id,
          ocrRequestedAt,
        ),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Errore sconosciuto durante l'accodamento OCR.";

    await prisma.propertyDocument.updateMany({
      where: {
        id: document.id,
        ocrStatus:
          PropertyDocumentOcrStatus.QUEUED,
        ocrRequestedAt,
      },
      data: {
        ocrStatus:
          PropertyDocumentOcrStatus.FAILED,
        ocrCompletedAt: new Date(),
        ocrError: errorMessage,
      },
    });

    throw error;
  }

  await AuditService.log({
    actorId: user.id,
    action: AuditAction.RETRY,
    propertyId,
    entityType: AUDIT_ENTITY_TYPES.PROPERTY_DOCUMENT,
    entityId: document.id,
    description: "Retry OCR richiesto manualmente.",
    metadata: {
      propertyId,
      previousStatus: document.ocrStatus,
      source: document.storageKey ? "encrypted-storage" : "legacy-url",
      requestedAt: ocrRequestedAt.toISOString(),
    },
  });

  revalidatePropertyPaths(propertyId);
}

export async function deletePropertyDocumentAction(
  formData: FormData,
): Promise<void> {
  const propertyId = getRequiredString(
    formData,
    "propertyId",
    "Immobile non specificato.",
  );

  const documentId = getRequiredString(
    formData,
    "documentId",
    "Documento non specificato.",
  );

  const user = await requirePropertyRole(propertyId, ["OWNER", "MANAGER"]);

  const document =
    await prisma.propertyDocument.findFirst({
      where: {
        id: documentId,
        propertyId,
      },
      select: {
        id: true,
        storageKey: true,
      },
    });

  if (!document) {
    throw new Error("Documento non trovato.");
  }

  await prisma.$transaction(
    async (transaction) => {
      await transaction.propertyDocument.delete({
        where: {
          id: document.id,
        },
      });

      await AuditService.log(
        {
          actorId: user.id,
          action: AuditAction.DELETE,
          propertyId,
          entityType:
            AUDIT_ENTITY_TYPES.PROPERTY_DOCUMENT,
          entityId: document.id,
          description:
            "Documento immobile eliminato.",
          metadata: {
            propertyId,
            encryptedStorage: Boolean(document.storageKey),
          },
        },
        transaction,
      );
    },
  );

  if (document.storageKey) {
    try {
      await defaultPrivateStorageProvider.delete(
        document.storageKey,
      );
    } catch (cleanupError) {
      console.error(
        "Impossibile eliminare l allegato protetto.",
        cleanupError,
      );
    }
  }

  revalidatePropertyPaths(propertyId);
}
