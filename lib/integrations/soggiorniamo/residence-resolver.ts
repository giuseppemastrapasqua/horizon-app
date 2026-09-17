export type CanonicalResidenceInput = {
  country: string | null | undefined;
  city: string | null | undefined;
  province: string | null | undefined;
};

export type SoggiorniamoResolvedResidence = {
  countryCode: string;
  municipalityCode?: string;
};

const ITALY_COUNTRY_CODE = "100";
const MILAN_BELFIORE_CODE = "F205";

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function isItaly(value: string): boolean {
  return (
    value === "ITALIA" ||
    value === "ITALY" ||
    value === "IT" ||
    value === "ITA" ||
    value === "100"
  );
}

function isMilan(city: string, province: string): boolean {
  const cityIsMilan =
    city === "MILANO" ||
    city === "MILAN";

  const provinceIsMilan =
    province === "MI" ||
    province === "MILANO";

  return cityIsMilan && provinceIsMilan;
}

export function resolveSoggiorniamoResidence(
  input: CanonicalResidenceInput,
): SoggiorniamoResolvedResidence | undefined {
  const country = normalize(input.country);

  if (!country) {
    return undefined;
  }

  /*
   * V1 intentionally resolves only mappings that Horizon can determine
   * safely and deterministically.
   *
   * Other countries must later be mapped through the canonical
   * country-code dataset rather than guessed here.
   */
  if (!isItaly(country)) {
    return undefined;
  }

  const city = normalize(input.city);
  const province = normalize(input.province);

  if (isMilan(city, province)) {
    return {
      countryCode: ITALY_COUNTRY_CODE,
      municipalityCode: MILAN_BELFIORE_CODE,
    };
  }

  return {
    countryCode: ITALY_COUNTRY_CODE,
  };
}
