import { notFound } from "next/navigation";
import { getAccessiblePropertyIds, requireRoles } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export async function loadDailyWorkspace(propertyId: string | undefined, from: Date, to: Date) {
  await requireRoles(["SUPER_ADMIN", "MANAGER"]);
  const ids = await getAccessiblePropertyIds();
  const properties = await prisma.property.findMany({
    where: ids === null ? {} : { id: { in: ids } },
    select: { id: true, name: true, maxGuests: true, extraGuestFee: true, cleaningCost: true,
      ratePlans: { where: { active: true, currency: "EUR" }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }], select: { code: true, basePrice: true, occupancyIncluded: true, minimumStay: true, maximumStay: true } } },
    orderBy: { name: "asc" },
  });
  const selected = propertyId ? properties.find((property) => property.id === propertyId) : properties[0];
  if (propertyId && !selected) notFound();
  if (!selected) return { properties, selected: null, stays: [], blocks: [], market: [] };
  const start = new Date(from.getTime() - 86400000);
  const end = new Date(to.getTime() + 31 * 86400000);
  const [stays, blocks, market] = await Promise.all([
    prisma.booking.findMany({ where: { propertyId: selected.id, bookingStatus: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] }, checkIn: { lt: end }, checkOut: { gt: start } }, select: { checkIn: true, checkOut: true, bookedAt: true } }),
    prisma.propertyAvailabilityBlock.findMany({ where: { propertyId: selected.id, startDate: { lt: end }, endDate: { gte: start } }, select: { startDate: true, endDate: true } }),
    prisma.revenueDailySignal.findMany({ where: { propertyId: selected.id, date: { gte: from, lte: to }, capturedAt: { gte: new Date(Date.now() - 72 * 3600000) }, provider: { notIn: ["LOCAL", "MOCK"] }, currency: "EUR" }, select: { date: true, capturedAt: true, provider: true, currency: true, marketMedianPrice: true, confidence: true } }),
  ]);
  return { properties, selected, stays, blocks, market: market.map((day) => ({ ...day, marketMedianPrice: day.marketMedianPrice === null ? null : Number(day.marketMedianPrice), confidence: day.confidence === null ? null : Number(day.confidence) })) };
}
