import type { BackgroundJob, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  documentFindFirst: vi.fn(),
  documentUpdate: vi.fn(),
  transaction: vi.fn(),
  auditLog: vi.fn(),
  extractText: vi.fn(),
  storageRead: vi.fn(),
  decryptDocument: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    propertyDocument: {
      findFirst: mocks.documentFindFirst,
    },
    $transaction: mocks.transaction,
  },
}));

vi.mock("@/services/audit/AuditService", () => ({
  AuditService: {
    log: mocks.auditLog,
  },
}));

vi.mock("@/lib/ocr/get-document-ocr-provider", () => ({
  getDocumentOcrProvider: () => ({
    extractText: mocks.extractText,
  }),
}));

vi.mock("@/lib/storage/default-private-storage-provider", () => ({
  defaultPrivateStorageProvider: {
    read: mocks.storageRead,
  },
}));

vi.mock("@/lib/security/document-crypto", () => ({
  decryptDocument: mocks.decryptDocument,
}));

import { processPropertyDocumentOcrJob } from "./process-property-document-ocr-job";

const transactionClient = {
  propertyDocument: {
    update: mocks.documentUpdate,
  },
};

describe("processPropertyDocumentOcrJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.HORIZON_DOCUMENT_ENCRYPTION_KEY = "test-encryption-key";

    mocks.transaction.mockImplementation(
      async (callback: (transaction: typeof transactionClient) => Promise<unknown>) =>
        callback(transactionClient),
    );

    mocks.documentUpdate.mockResolvedValue({});
    mocks.auditLog.mockResolvedValue(undefined);
    mocks.extractText.mockResolvedValue({
      extractedText: "Testo estratto",
      provider: "test-provider",
      providerVersion: "1",
      reviewRequired: false,
    });
  });

  it("legge, decifra e invia in memoria un documento protetto", async () => {
    const encrypted = Buffer.from("ciphertext");
    const plaintext = Buffer.from("contenuto pdf");

    mocks.documentFindFirst.mockResolvedValue({
      id: "document-1",
      fileUrl: null,
      storageKey: "properties/property-1/documents/document-1.hzdoc",
      contentType: "application/pdf",
      encryptionVersion: "v1",
    });
    mocks.storageRead.mockResolvedValue(encrypted);
    mocks.decryptDocument.mockReturnValue(plaintext);

    await processPropertyDocumentOcrJob(
      createJob({
        documentId: "document-1",
        propertyId: "property-1",
        storageKey: "properties/property-1/documents/document-1.hzdoc",
        filename: "documento.pdf",
      }),
    );

    expect(mocks.storageRead).toHaveBeenCalledOnce();
    expect(mocks.storageRead).toHaveBeenCalledWith(
      "properties/property-1/documents/document-1.hzdoc",
    );
    expect(mocks.decryptDocument).toHaveBeenCalledWith(
      encrypted,
      "test-encryption-key",
    );
    expect(mocks.extractText).toHaveBeenCalledWith({
      documentId: "document-1",
      sourceType: "data",
      dataUrl: `data:application/pdf;base64,${Buffer.from("contenuto pdf").toString("base64")}`,
      contentType: "application/pdf",
      filename: "documento.pdf",
    });
  });

  it("mantiene compatibilita con i documenti legacy via URL", async () => {
    mocks.documentFindFirst.mockResolvedValue({
      id: "document-legacy",
      fileUrl: "https://example.test/document.pdf",
      storageKey: null,
      contentType: "application/pdf",
      encryptionVersion: null,
    });

    await processPropertyDocumentOcrJob(
      createJob({
        documentId: "document-legacy",
        propertyId: "property-1",
        fileUrl: "https://example.test/document.pdf",
        filename: "legacy.pdf",
      }),
    );

    expect(mocks.storageRead).not.toHaveBeenCalled();
    expect(mocks.decryptDocument).not.toHaveBeenCalled();
    expect(mocks.extractText).toHaveBeenCalledWith({
      documentId: "document-legacy",
      sourceType: "url",
      fileUrl: "https://example.test/document.pdf",
      filename: "legacy.pdf",
    });
  });

  it("ignora un job secure obsoleto se lo storageKey e cambiato", async () => {
    mocks.documentFindFirst.mockResolvedValue({
      id: "document-1",
      fileUrl: null,
      storageKey: "properties/property-1/documents/new.hzdoc",
      contentType: "application/pdf",
      encryptionVersion: "v1",
    });

    await processPropertyDocumentOcrJob(
      createJob({
        documentId: "document-1",
        propertyId: "property-1",
        storageKey: "properties/property-1/documents/old.hzdoc",
      }),
    );

    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.storageRead).not.toHaveBeenCalled();
    expect(mocks.extractText).not.toHaveBeenCalled();
  });
});

function createJob(payload: Prisma.JsonValue): BackgroundJob {
  const now = new Date("2026-09-07T12:00:00.000Z");

  return {
    id: "job-1",
    type: "PROPERTY_DOCUMENT_OCR",
    status: "QUEUED",
    payload,
    deduplicationKey: null,
    attempts: 0,
    maxAttempts: 3,
    availableAt: now,
    startedAt: null,
    heartbeatAt: null,
    finishedAt: null,
    lastError: null,
    createdAt: now,
    updatedAt: now,
  };
}
