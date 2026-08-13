import type { PropertyDocument } from "@prisma/client";

export type PropertyDocumentWorkspaceData = {
  id: string;
  propertyId: string;
  type: PropertyDocument["type"];
  title: string;
  documentNumber: string | null;
  issuer: string | null;
  issueDate: Date | null;
  expiryDate: Date | null;
  validity: PropertyDocument["validity"];
  fileUrl: string | null;
  filename: string | null;
  notes: string | null;
  ocrStatus: PropertyDocument["ocrStatus"];
  ocrRequestedAt: Date | null;
  ocrStartedAt: Date | null;
  ocrCompletedAt: Date | null;
  ocrExtractedText: string | null;
  ocrProvider: string | null;
  ocrProviderVersion: string | null;
  ocrError: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function mapPropertyDocuments(
  propertyDocuments: PropertyDocument[],
): PropertyDocumentWorkspaceData[] {
  return propertyDocuments.map((document) => ({
    id: document.id,
    propertyId: document.propertyId,
    type: document.type,
    title: document.title,
    documentNumber: document.documentNumber,
    issuer: document.issuer,
    issueDate: document.issueDate,
    expiryDate: document.expiryDate,
    validity: document.validity,
    fileUrl: document.fileUrl,
    filename: document.filename,
    notes: document.notes,
    ocrStatus: document.ocrStatus,
    ocrRequestedAt: document.ocrRequestedAt,
    ocrStartedAt: document.ocrStartedAt,
    ocrCompletedAt: document.ocrCompletedAt,
    ocrExtractedText: document.ocrExtractedText,
    ocrProvider: document.ocrProvider,
    ocrProviderVersion: document.ocrProviderVersion,
    ocrError: document.ocrError,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  }));
}