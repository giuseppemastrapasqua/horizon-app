import type {
  AlloggiatiReferenceResolver,
} from "./reference-resolver";

export class MockAlloggiatiReferenceResolver
  implements AlloggiatiReferenceResolver
{
  constructor(
    private readonly countries: Record<string, string> = {},
    private readonly municipalities: Record<string, string> = {},
    private readonly documentTypes: Record<string, string> = {},
  ) {}

  async resolveCountryCode(
    country: string,
  ): Promise<string | null> {
    return this.countries[country] ?? null;
  }

  async isItaly(
    country: string,
  ): Promise<boolean> {
    return country.trim().toUpperCase() === "ITALIA";
  }

  async resolveMunicipalityCode(
    city: string,
    province?: string | null,
  ): Promise<string | null> {
    const qualifiedKey = province
      ? `${city}|${province}`
      : city;

    return (
      this.municipalities[qualifiedKey] ??
      this.municipalities[city] ??
      null
    );
  }

  async resolveDocumentTypeCode(
    documentType: string,
  ): Promise<string | null> {
    return this.documentTypes[documentType] ?? null;
  }
}
