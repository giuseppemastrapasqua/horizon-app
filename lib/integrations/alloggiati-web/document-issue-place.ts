import type {
  AlloggiatiReferenceResolver,
} from "./reference-resolver";
import { requireReferenceCode } from "./reference-resolver";

export type DocumentIssuePlaceInput = {
  country: string;
  city?: string | null;
};

export async function resolveDocumentIssuePlaceCode(
  input: DocumentIssuePlaceInput,
  resolver: AlloggiatiReferenceResolver,
): Promise<string> {
  if (await resolver.isItaly(input.country)) {
    const city = input.city?.trim();

    if (!city) {
      throw new Error(
        "Comune di rilascio documento obbligatorio per l'Italia.",
      );
    }

    return requireReferenceCode(
      resolver.resolveMunicipalityCode(city),
      "comune di rilascio documento",
    );
  }

  return requireReferenceCode(
    resolver.resolveCountryCode(input.country),
    "stato di rilascio documento",
  );
}
