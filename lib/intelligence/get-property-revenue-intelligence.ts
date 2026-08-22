import {
  getPropertyRevenueAnalysis,
} from "@/lib/revenue/get-property-revenue-analysis";

export async function getPropertyRevenueIntelligence({
  propertyId,
  startDate,
  endDate,
}: {
  propertyId: string;
  startDate: Date;
  endDate: Date;
}) {
  const analysis =
    await getPropertyRevenueAnalysis({
      propertyId,
      startDate,
      endDate,
    });

  return (
    analysis?.insights ??
    []
  );
}
