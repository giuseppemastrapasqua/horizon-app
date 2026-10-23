import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePropertyRole, requireRoles } from "@/lib/auth/guards";
import { activationSchema, initialConfig } from "./config";
import { addDays, parseDay } from "./dates";

export async function loadActivationWorkspace(id: string, from: string, to: string) {
  await requireRoles(["SUPER_ADMIN", "MANAGER"]);
  await requirePropertyRole(id, ["MANAGER"]);
  const property = await prisma.property.findUnique({ where: { id }, select: {
    id: true, name: true, city: true, maxGuests: true, baseGuests: true, extraGuestFee: true, cleaningCost: true,
    propertyManagementCommissionPercent: true, propertyManagementCommissionVatPercent: true, propertyManagementCommissionVatMode: true,
    images: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true, caption: true, isCover: true } },
    channelCommissions: { select: { channel: true, commissionPercent: true } },
    ratePlans: { where: { active: true, currency: "EUR" }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }], select: { basePrice: true, occupancyIncluded: true, minimumStay: true } },
  } });
  if (!property) notFound();
  const start = parseDay(addDays(from, -1)), end = parseDay(addDays(to, 32));
  const [record, stays, blocks, market, history] = await Promise.all([
    prisma.propertyActivation.findUnique({ where: { propertyId: id } }),
    prisma.booking.findMany({ where: { propertyId: id, bookingStatus: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] }, checkIn: { lt: end }, checkOut: { gt: start } }, select: { checkIn: true, checkOut: true, bookedAt: true } }),
    prisma.propertyAvailabilityBlock.findMany({ where: { propertyId: id, startDate: { lt: end }, endDate: { gte: start } }, select: { startDate: true, endDate: true } }),
    prisma.revenueDailySignal.findMany({ where: { propertyId: id, date: { gte: parseDay(from), lte: parseDay(to) }, capturedAt: { gte: new Date(Date.now() - 72 * 3600000) }, currency: "EUR", provider: { notIn: ["LOCAL", "MOCK"] } }, select: { date: true, capturedAt: true, provider: true, currency: true, marketMedianPrice: true, confidence: true } }),
    prisma.auditLog.findMany({ where: { propertyId: id, entityType: "PropertyActivation" }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, createdAt: true, description: true, actor: { select: { fullName: true } } } }),
  ]);
  const rate = property.ratePlans[0];
  const config = record ? activationSchema.parse(record.config) : initialConfig({ base: rate ? Number(rate.basePrice) : null,
    baseGuests: rate?.occupancyIncluded ?? property.baseGuests, extraGuestFee: Number(property.extraGuestFee), cleaning: Number(property.cleaningCost),
    management: Number(property.propertyManagementCommissionPercent), vat: Number(property.propertyManagementCommissionVatPercent), vatMode: property.propertyManagementCommissionVatMode,
    minimumStay: rate?.minimumStay ?? 2, commissions: property.channelCommissions.map((item) => ({ channel: item.channel, percent: Number(item.commissionPercent) })) });
  return { property: { id: property.id, name: property.name, city: property.city, maxGuests: property.maxGuests, images: property.images }, config, version: record?.version ?? 0,
    updatedAt: record?.updatedAt.toISOString() ?? null,
    history: history.map((item) => ({ id: item.id, date: item.createdAt.toISOString(), actor: item.actor?.fullName ?? "Sistema", description: item.description })),
    stays: stays.map((stay) => ({ checkIn: stay.checkIn.toISOString(), checkOut: stay.checkOut.toISOString(), bookedAt: stay.bookedAt?.toISOString() ?? null })),
    blocks: blocks.map((block) => ({ startDate: block.startDate.toISOString(), endDate: block.endDate.toISOString() })),
    market: market.map((day) => ({ ...day, date: day.date.toISOString(), capturedAt: day.capturedAt.toISOString(), marketMedianPrice: day.marketMedianPrice === null ? null : Number(day.marketMedianPrice), confidence: day.confidence === null ? null : Number(day.confidence) })),
  };
}
export type ActivationWorkspaceData = Awaited<ReturnType<typeof loadActivationWorkspace>>;
