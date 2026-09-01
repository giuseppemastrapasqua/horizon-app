export type AlloggiatiPlaceCode = string;
export type AlloggiatiDocumentTypeCode = string;

export interface AlloggiatiReferenceResolver {
  resolveCountryCode(
    country: string,
  ): Promise<AlloggiatiPlaceCode | null>;

  resolveMunicipalityCode(
    city: string,
    province?: string | null,
  ): Promise<AlloggiatiPlaceCode | null>;

  resolveDocumentTypeCode(
    documentType: string,
  ): Promise<AlloggiatiDocumentTypeCode | null>;
}

export async function requireReferenceCode(
  value: Promise<string | null>,
  label: string,
): Promise<string> {
  const code = await value;

  if (!code) {
    throw new Error(
      `Riferimento Alloggiati non risolto: ${label}.`,
    );
  }

  return code;
}
