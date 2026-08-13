import type {
  Prisma,
  PropertyCodeVerificationStatus,
} from "@prisma/client";

export type PropertyCodeVerificationProviderInput = {
  cin: string;
  cir: string;
  propertyName: string;
  address: string;
  city: string | null;
};

export type PropertyCodeVerificationProviderResult = {
  status: PropertyCodeVerificationStatus;
  verifiedAt: Date | null;
  notes: string;
  rawResponse: Prisma.JsonValue | null;
};

export interface PropertyCodeVerificationProvider {
  readonly name: string;

  verify(
    input: PropertyCodeVerificationProviderInput,
  ): Promise<PropertyCodeVerificationProviderResult>;
}

export const UNCONFIGURED_PROPERTY_CODE_PROVIDER =
  "UNCONFIGURED";

const PROPERTY_CODE_VERIFICATION_PROVIDER_ENV =
  "PROPERTY_CODE_VERIFICATION_PROVIDER";

class UnconfiguredPropertyCodeVerificationProvider
  implements PropertyCodeVerificationProvider
{
  readonly name =
    UNCONFIGURED_PROPERTY_CODE_PROVIDER;

  async verify(
    input: PropertyCodeVerificationProviderInput,
  ): Promise<PropertyCodeVerificationProviderResult> {
    void input;

    return {
      status: "REVIEW_REQUIRED",
      verifiedAt: null,
      notes:
        "I codici sono stati acquisiti correttamente, ma il provider esterno di verifica non è ancora configurato. È richiesta una revisione.",
      rawResponse: null,
    };
  }
}

function readConfiguredProviderName() {
  const configuredProvider =
    process.env[
      PROPERTY_CODE_VERIFICATION_PROVIDER_ENV
    ]
      ?.trim()
      .toUpperCase();

  return (
    configuredProvider ||
    UNCONFIGURED_PROPERTY_CODE_PROVIDER
  );
}

export function getPropertyCodeVerificationProvider():
  PropertyCodeVerificationProvider {
  const providerName = readConfiguredProviderName();

  switch (providerName) {
    case UNCONFIGURED_PROPERTY_CODE_PROVIDER:
      return new UnconfiguredPropertyCodeVerificationProvider();

    default:
      throw new Error(
        `Provider di verifica CIN/CIR non supportato: "${providerName}". Controlla la variabile ${PROPERTY_CODE_VERIFICATION_PROVIDER_ENV}.`,
      );
  }
}