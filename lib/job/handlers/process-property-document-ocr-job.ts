import {
  AuditAction,
  PropertyDocumentOcrStatus,
  type BackgroundJob,
  type Prisma,
} from "@prisma/client";

import { AUDIT_ENTITY_TYPES } from "@/lib/audit/constants";
import { getDocumentOcrProvider } from "@/lib/ocr/get-document-ocr-provider";
import type { DocumentOcrInput } from "@/lib/ocr/document-ocr-provider";
import { prisma } from "@/lib/prisma";
import { decryptDocument } from "@/lib/security/document-crypto";
import { defaultPrivateStorageProvider } from "@/lib/storage/default-private-storage-provider";
import { AuditService } from "@/services/audit/AuditService";

const DOCUMENT_ENCRYPTION_KEY_ENV =
  "HORIZON_DOCUMENT_ENCRYPTION_KEY";

type PropertyDocumentOcrJobPayload = {
  documentId: string;
  propertyId: string;
  filename?: string;
} & (
  | {
      storageKey: string;
    }
  | {
      fileUrl: string;
    }
);

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
  key: "documentId" | "propertyId",
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
  key: "filename" | "fileUrl" | "storageKey",
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
      "Il payload del job OCR non \u00e8 un oggetto JSON valido.",
    );
  }

  const documentId = readRequiredString(
    payload,
    "documentId",
  );
  const propertyId = readRequiredString(
    payload,
    "propertyId",
  );
  const filename = readOptionalString(
    payload,
    "filename",
  );
  const storageKey = readOptionalString(
    payload,
    "storageKey",
  );
  const fileUrl = readOptionalString(
    payload,
    "fileUrl",
  );

  if (storageKey) {
    return {
      documentId,
      propertyId,
      storageKey,
      ...(filename ? { filename } : {}),
    };
  }

  if (fileUrl) {
    return {
      documentId,
      propertyId,
      fileUrl,
      ...(filename ? { filename } : {}),
    };
  }

  throw new Error(
    "Il payload del job OCR non contiene storageKey o fileUrl.",
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Errore sconosciuto durante l'elaborazione OCR.";
}

function getEncryptionKey(): string {
  const encryptionKey =
    process.env[DOCUMENT_ENCRYPTION_KEY_ENV]?.trim();

  if (!encryptionKey) {
    throw new Error(
      `${DOCUMENT_ENCRYPTION_KEY_ENV} non configurata.`,
    );
  }

  return encryptionKey;
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
        storageKey: true,
        contentType: true,
        encryptionVersion: true,
      },
    });

  if (!document) {
    return;
  }

  if ("storageKey" in payload) {
    const currentStorageKey =
      document.storageKey?.trim() ?? null;

    if (currentStorageKey !== payload.storageKey) {
      return;
    }
  } else {
    const currentFileUrl =
      document.fileUrl?.trim() ?? null;

    if (currentFileUrl !== payload.fileUrl) {
      return;
    }
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
          source:
            "storageKey" in payload
              ? "encrypted-storage"
              : "legacy-url",
        },
      },
      transaction,
    );
  });

  try {
    const provider =
      getDocumentOcrProvider();

    let ocrInput: DocumentOcrInput;

    if ("storageKey" in payload) {
      if (
        document.encryptionVersion &&
        document.encryptionVersion !== "v1"
      ) {
        throw new Error(
          "Versione di cifratura documento non supportata.",
        );
      }

      const contentType =
        document.contentType?.trim().toLowerCase();

      if (!contentType) {
        throw new Error(
          "Il documento protetto non contiene un content type valido.",
        );
      }

      const encrypted =
        await defaultPrivateStorageProvider.read(
          payload.storageKey,
        );

      const plaintext = decryptDocument(
        encrypted,
        getEncryptionKey(),
      );

      const dataUrl = [
        `data:${contentType};base64,`,
        Buffer.from(plaintext).toString("base64"),
      ].join("");

      plaintext.fill(0);

      ocrInput = {
        documentId: document.id,
        sourceType: "data",
        dataUrl,
        contentType,
        ...(payload.filename
          ? { filename: payload.filename }
          : {}),
      };
    } else {
      ocrInput = {
        documentId: document.id,
        sourceType: "url",
        fileUrl: payload.fileUrl,
        ...(payload.filename
          ? { filename: payload.filename }
          : {}),
      };
    }

    const result =
      await provider.extractText(ocrInput);

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
