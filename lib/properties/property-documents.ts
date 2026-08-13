import {
  PropertyDocumentType,
  PropertyDocumentValidity,
} from "@prisma/client";

export const PROPERTY_DOCUMENT_TYPE_LABELS: Record<
  PropertyDocumentType,
  string
> = {
  CIN: "Codice Identificativo Nazionale",
  CIR: "Codice Identificativo Regionale",
  SCIA: "SCIA",
  ENERGY_CERTIFICATE: "Attestato di prestazione energetica",
  INSURANCE: "Assicurazione",
  IDENTITY_DOCUMENT: "Documento di identità",
  FLOOR_PLAN: "Planimetria",
  CONTRACT: "Contratto",
  OTHER: "Altro",
};

export const PROPERTY_DOCUMENT_VALIDITY_LABELS: Record<
  PropertyDocumentValidity,
  string
> = {
  VALID: "Valido",
  EXPIRING: "In scadenza",
  EXPIRED: "Scaduto",
};

export type PropertyDocumentData = {
  id: string;
  propertyId: string;
  type: PropertyDocumentType;
  title: string;
  documentNumber: string | null;
  issuer: string | null;
  issueDate: Date | null;
  expiryDate: Date | null;
  validity: PropertyDocumentValidity;
  fileUrl: string | null;
  filename: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function getPropertyDocumentTypeLabel(
  type: PropertyDocumentType,
): string {
  return PROPERTY_DOCUMENT_TYPE_LABELS[type];
}

export function getPropertyDocumentValidityLabel(
  validity: PropertyDocumentValidity,
): string {
  return PROPERTY_DOCUMENT_VALIDITY_LABELS[validity];
}

export function getPropertyDocumentValidityFromExpiryDate(
  expiryDate: Date | null,
  now = new Date(),
): PropertyDocumentValidity {
  if (!expiryDate) {
    return PropertyDocumentValidity.VALID;
  }

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const normalizedExpiryDate = new Date(
    expiryDate.getFullYear(),
    expiryDate.getMonth(),
    expiryDate.getDate(),
  );

  if (normalizedExpiryDate < today) {
    return PropertyDocumentValidity.EXPIRED;
  }

  const expiringThreshold = new Date(today);
  expiringThreshold.setDate(
    expiringThreshold.getDate() + 30,
  );

  if (normalizedExpiryDate <= expiringThreshold) {
    return PropertyDocumentValidity.EXPIRING;
  }

  return PropertyDocumentValidity.VALID;
}