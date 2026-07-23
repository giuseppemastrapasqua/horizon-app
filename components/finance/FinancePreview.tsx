import { FinanceBookings } from "./FinanceBookings";
import { FinanceCalculation } from "./FinanceCalculation";
import { FinanceFormulaCard } from "./FinanceFormulaCard";
import { FinanceMetrics } from "./FinanceMetrics";

import type {
  FinancePreview as FinancePreviewData,
} from "@/lib/finance/preview";

type FinancePreviewProps = {
  preview: FinancePreviewData;
};

export function FinancePreview({
  preview,
}: FinancePreviewProps) {
  const {
    property,
    bookings,
    formula,
    grossRevenue,
    totalNights,
    currency,
    calculation,
    referenceMonth,
  } = preview;

  return (
    <>
      <FinanceMetrics
        grossRevenue={grossRevenue}
        bookingsCount={bookings.length}
        totalNights={totalNights}
        currency={currency}
      />

      <FinanceFormulaCard
        formula={formula}
      />

      <FinanceCalculation
        formula={formula}
        calculation={calculation}
      />

      <FinanceBookings
        bookings={bookings}
        property={property}
        referenceMonth={referenceMonth}
      />
    </>
  );
}