import { buildPreviewCalculation } from "@/lib/finance/preview/build-preview-calculation";
import { buildPreviewMetrics } from "@/lib/finance/preview/build-preview-metrics";
import { buildPreviewPeriod } from "@/lib/finance/preview/build-preview-period";
import { createFinancePreview } from "@/lib/finance/preview/create-finance-preview";
import { loadPreviewFormula } from "@/lib/finance/preview/load-preview-formula";
import { loadPreviewProperty } from "@/lib/finance/preview/load-preview-property";
import { normalizePreviewInput } from "@/lib/finance/preview/normalize-preview-input";
import type {
  BuildFinancePreviewInput,
  FinancePreview,
} from "@/lib/finance/preview/preview-types";

export async function buildFinancePreview(
  input: BuildFinancePreviewInput
): Promise<FinancePreview> {
  const {
    propertyId,
    referenceMonth,
  } = normalizePreviewInput(input);

  const {
    monthStart,
    nextMonthStart,
  } = buildPreviewPeriod({
    referenceMonth,
  });

  const property =
    await loadPreviewProperty({
      propertyId,
      monthStart,
      nextMonthStart,
    });

  const formula =
    await loadPreviewFormula({
      propertyId: property.id,
    });

  const {
    grossRevenue,
    totalNights,
    currency,
  } = buildPreviewMetrics({
    bookings: property.bookings,
  });

const calculation =
  await buildPreviewCalculation({
    formula,
    grossRevenue,
    currency,
    bookingCount: property.bookings.length,
    cleaningCost: Number(property.cleaningCost),
  });

  return createFinancePreview({
    property,
    formula,
    referenceMonth: monthStart,
    nextMonthStart,
    grossRevenue,
    totalNights,
    currency,
    calculation,
  });
}