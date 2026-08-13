import type {
  Prisma,
  PropertyCodeVerificationStatus,
} from "@prisma/client";

import {
  getPropertyCodeVerificationProvider,
  UNCONFIGURED_PROPERTY_CODE_PROVIDER,
} from "./property-code-verification-provider";

type VerifyPropertyCodesInput = {
  cin: string;
  cir: string;
  propertyName: string;
  address: string;
  city: string | null;
};

export type PropertyCodeVerificationResult = {
  provider: string;
  status: PropertyCodeVerificationStatus;
  verifiedAt: Date | null;
  notes: string;
  rawResponse: Prisma.JsonValue | null;
};

export async function verifyPropertyCodes(
  input: VerifyPropertyCodesInput,
): Promise<PropertyCodeVerificationResult> {
  const normalizedInput = {
    cin: input.cin.trim().toUpperCase(),
    cir: input.cir.trim().toUpperCase(),
    propertyName: input.propertyName.trim(),
    address: input.address.trim(),
    city: input.city?.trim() || null,
  };

  if (!normalizedInput.cin || !normalizedInput.cir) {
    return {
      provider: UNCONFIGURED_PROPERTY_CODE_PROVIDER,
      status: "REVIEW_REQUIRED",
      verifiedAt: null,
      notes:
        "Impossibile avviare la verifica: CIN e CIR sono entrambi obbligatori.",
      rawResponse: null,
    };
  }

  const provider =
    getPropertyCodeVerificationProvider();

  const result = await provider.verify(
    normalizedInput,
  );

  return {
    provider: provider.name,
    status: result.status,
    verifiedAt: result.verifiedAt,
    notes: result.notes,
    rawResponse: result.rawResponse,
  };
}