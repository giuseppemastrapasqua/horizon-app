import type {
  AlloggiatiReferenceResolver,
} from "./reference-resolver";

export type AlloggiatiCountryReference = {
  code: string;
  name: string;
  isItaly?: boolean;
};

export type AlloggiatiMunicipalityReference = {
  code: string;
  name: string;
  province?: string | null;
};

export type AlloggiatiDocumentTypeReference = {
  code: string;
  name: string;
};

export type AlloggiatiReferenceData = {
  countries: AlloggiatiCountryReference[];
  municipalities: AlloggiatiMunicipalityReference[];
  documentTypes: AlloggiatiDocumentTypeReference[];
};

export class TableAlloggiatiReferenceResolver
  implements AlloggiatiReferenceResolver
{
  constructor(
    private readonly data: AlloggiatiReferenceData,
  ) {}

  async resolveCountryCode(
    country: string,
  ): Promise<string | null> {
    const key = normalize(country);

    const match = this.data.countries.find(
      (item) => normalize(item.name) === key,
    );

    return match?.code ?? null;
  }

  async isItaly(
    country: string,
  ): Promise<boolean> {
    const key = normalize(country);

    const match = this.data.countries.find(
      (item) => normalize(item.name) === key,
    );

    return match?.isItaly === true;
  }

  async resolveMunicipalityCode(
    city: string,
    province?: string | null,
  ): Promise<string | null> {
    const cityKey = normalize(city);
    const provinceKey = province
      ? normalize(province)
      : null;

    const matches =
      this.data.municipalities.filter(
        (item) =>
          normalize(item.name) === cityKey &&
          (
            !provinceKey ||
            normalize(item.province ?? "") ===
              provinceKey
          ),
      );

    if (matches.length !== 1) {
      return null;
    }

    return matches[0].code;
  }

  async resolveDocumentTypeCode(
    documentType: string,
  ): Promise<string | null> {
    const key = normalize(documentType);

    const match =
      this.data.documentTypes.find(
        (item) => normalize(item.name) === key,
      );

    return match?.code ?? null;
  }
}

function normalize(
  value: string,
): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}
