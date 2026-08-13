import type { Document } from "@prisma/client";

export type PropertyDocumentSummary = {
  id: string;
  title: string;
  subtitle: string | null;
  type: Document["type"];
  status: Document["status"];
  documentNumber: string | null;
  currentVersion: number;
  referenceMonth: Date | null;
  updatedAt: Date;
};

export function mapPropertyDocumentsSummary(
  documents: Document[],
): PropertyDocumentSummary[] {
  return documents.map((document) => ({
    id: document.id,
    title: document.title,
    subtitle: document.subtitle,
    type: document.type,
    status: document.status,
    documentNumber: document.documentNumber,
    currentVersion: document.currentVersion,
    referenceMonth: document.referenceMonth,
    updatedAt: document.updatedAt,
  }));
}