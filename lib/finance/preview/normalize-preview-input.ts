import type {
  BuildFinancePreviewInput,
} from "@/lib/finance/preview/preview-types";

type NormalizedPreviewInput = {
  propertyId: string;
  referenceMonth: Date;
};

export function normalizePreviewInput({
  propertyId,
  referenceMonth,
}: BuildFinancePreviewInput): NormalizedPreviewInput {
  const normalizedPropertyId =
    propertyId.trim();

  if (!normalizedPropertyId) {
    throw new Error(
      "L'identificativo dell'immobile è obbligatorio."
    );
  }

  return {
    propertyId: normalizedPropertyId,
    referenceMonth,
  };
}