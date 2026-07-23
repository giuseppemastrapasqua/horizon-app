import {
  getNextMonthStart,
  normalizeReferenceMonth,
} from "@/lib/finance/preview/normalize-reference-month";

type BuildPreviewPeriodInput = {
  referenceMonth: Date;
};

export function buildPreviewPeriod({
  referenceMonth,
}: BuildPreviewPeriodInput) {
  const monthStart =
    normalizeReferenceMonth(
      referenceMonth
    );

  const nextMonthStart =
    getNextMonthStart(monthStart);

  return {
    monthStart,
    nextMonthStart,
  };
}