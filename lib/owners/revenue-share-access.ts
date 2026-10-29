import { prisma } from "@/lib/prisma";
import { readRevenueSplit } from "@/lib/finance/report-revenue-split";

export async function quotaOnlyPropertyIds(userId: string) {
  const reports = await prisma.financeReport.findMany({
    where: { formulaSnapshot: { path: ["revenueSplit", "recipients"], array_contains: [{ userId }] } },
    select: { propertyId: true },
  });
  return [...new Set(reports.map(r => r.propertyId))];
}
export function ownerShareKey(snapshot: unknown, month: Date, userId: string) {
  const split = readRevenueSplit(snapshot, month);
  if (!split) return null;
  const recipient = split.recipients.find(r => (r as typeof r & { userId?: string }).userId === userId);
  return recipient?.key ?? null;
}
export async function ownerQuotaReports(userId: string) {
  const ids = await quotaOnlyPropertyIds(userId);
  if (!ids.length) return [];
  const reports = await prisma.financeReport.findMany({ where: { propertyId: { in: ids } }, orderBy: { referenceMonth: "desc" },
    select: { id:true, ownerId:true, propertyId:true, referenceMonth:true, currency:true, grossRevenue:true, finalAmount:true, formulaSnapshot:true, property:{select:{name:true}} } });
  return reports.filter(r => ownerShareKey(r.formulaSnapshot,r.referenceMonth,userId) || (!readRevenueSplit(r.formulaSnapshot,r.referenceMonth) && r.ownerId===userId));
}
