import {
  AuditAction,
  PropertyDocumentOcrStatus,
  type BackgroundJob,
  type Prisma,
} from "@prisma/client";

import { AUDIT_ENTITY_TYPES } from "@/lib/audit/constants";
import { getDocumentOcrProvider } from "@/lib/ocr/get-document-ocr-provider";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit/AuditService";

type PropertyDocumentOcrJobPayload = {
  documentId: string;
  propertyId: string;
  fileUrl: string;
  filename?: string;
};

function isJsonObject(
  value: Prisma.JsonValue,
): value is Prisma.JsonObject {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function readRequiredString(
  payload: Prisma.JsonObject,
  key:
    | "documentId"
    | "propertyId"
    | "fileUrl",
): string {
  const value = payload[key];

  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(
      `Il payload del job OCR non contiene un valore valido per "${key}".`,
    );
  }

  return value.trim();
}

function readOptionalString(
  payload: Prisma.JsonObject,
  key: "filename",
): string | undefined {
  const value = payload[key];

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(
      `Il payload del job OCR contiene un valore non valido per "${key}".`,
    );
  }

  const normalizedValue = value.trim();

  return normalizedValue || undefined;
}

function parsePayload(
  payload: Prisma.JsonValue,
): PropertyDocumentOcrJobPayload {
  if (!isJsonObject(payload)) {
    throw new Error(
      "Il payload del job OCR non è un oggetto JSON valido.",
    );
  }

  return {
    documentId: readRequiredString(
      payload,
      "documentId",
    ),
    propertyId: readRequiredString(
      payload,
      "propertyId",
    ),
    fileUrl: readRequiredString(
      payload,
      "fileUrl",
    ),
    filename: readOptionalString(
      payload,
      "filename",
    ),
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Errore sconosciuto durante l'elaborazione OCR.";
}

export async function processPropertyDocumentOcrJob(
  job: BackgroundJob,
): Promise<void> {
  if (job.type !== "PROPERTY_DOCUMENT_OCR") {
    throw new Error(
      `Tipo di job non supportato dall'handler OCR: ${job.type}.`,
    );
  }

  const payload = parsePayload(job.payload);

  const document =
    await prisma.propertyDocument.findFirst({
      where: {
        id: payload.documentId,
        propertyId: payload.propertyId,
      },
      select: {
        id: true,
        fileUrl: true,
      },
    });

  if (!document) {
    return;
  }

  const currentFileUrl =
    document.fileUrl?.trim() ?? null;

  if (currentFileUrl !== payload.fileUrl) {
    return;
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.propertyDocument.update({
      where: {
        id: document.id,
      },
      data: {
        ocrStatus:
          PropertyDocumentOcrStatus.PROCESSING,
        ocrStartedAt: new Date(),
        ocrCompletedAt: null,
        ocrExtractedText: null,
        ocrProvider: null,
        ocrProviderVersion: null,
        ocrError: null,
      },
    });

    await AuditService.log(
      {
        action: AuditAction.STATUS_CHANGE,
        propertyId: payload.propertyId,
        entityType:
          AUDIT_ENTITY_TYPES.PROPERTY_DOCUMENT,
        entityId: document.id,
        description: "Elaborazione OCR avviata.",
        metadata: {
          status:
            PropertyDocumentOcrStatus.PROCESSING,
        },
      },
      transaction,
    );
  });

  try {
    const provider =
      getDocumentOcrProvider();

    const result =
      await provider.extractText({
        documentId: document.id,
        fileUrl: payload.fileUrl,
        ...(payload.filename
          ? {
              filename: payload.filename,
            }
          : {}),
      });

    const finalStatus = result.reviewRequired
      ? PropertyDocumentOcrStatus.REVIEW_REQUIRED
      : PropertyDocumentOcrStatus.COMPLETED;

    await prisma.$transaction(async (transaction) => {
      await transaction.propertyDocument.update({
        where: {
          id: document.id,
        },
        data: {
          ocrStatus: finalStatus,
          ocrCompletedAt: new Date(),
          ocrExtractedText: result.extractedText,
          ocrProvider: result.provider,
          ocrProviderVersion:
            result.providerVersion ?? null,
          ocrError: null,
        },
      });

      await AuditService.log(
        {
          action: AuditAction.COMPLETE,
          propertyId: payload.propertyId,
          entityType:
            AUDIT_ENTITY_TYPES.PROPERTY_DOCUMENT,
          entityId: document.id,
          description:
            finalStatus ===
            PropertyDocumentOcrStatus.REVIEW_REQUIRED
              ? "OCR completato: revisione manuale richiesta."
              : "OCR completato con successo.",
          metadata: {
            status: finalStatus,
            provider: result.provider,
            providerVersion:
              result.providerVersion ?? null,
            reviewRequired: result.reviewRequired,
          },
        },
        transaction,
      );
    });
  } catch (error) {
    const errorMessage = getErrorMessage(error);

    await prisma.$transaction(async (transaction) => {
      await transaction.propertyDocument.update({
        where: {
          id: document.id,
        },
        data: {
          ocrStatus:
            PropertyDocumentOcrStatus.FAILED,
          ocrCompletedAt: new Date(),
          ocrError: errorMessage,
        },
      });

      await AuditService.log(
        {
          action: AuditAction.FAIL,
          propertyId: payload.propertyId,
          entityType:
            AUDIT_ENTITY_TYPES.PROPERTY_DOCUMENT,
          entityId: document.id,
          description: "Elaborazione OCR fallita.",
          metadata: {
            status:
              PropertyDocumentOcrStatus.FAILED,
            error: errorMessage,
          },
        },
        transaction,
      );
    });

    throw error;
  }
}