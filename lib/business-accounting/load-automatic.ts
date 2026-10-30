import { readReportBookingSnapshot } from "@/lib/finance/report-booking-snapshot";
import { requireRoles } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { readInvoice, readOwnerAmounts, type AutomaticAccounting } from "./automatic";

export async function loadAutomaticAccounting(year: number): Promise<AutomaticAccounting> {
  await requireRoles(["SUPER_ADMIN"]);
  if (!Number.isInteger(year) || year < 2020 || year > 2100) throw new Error("Anno non valido.");
  const range = { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) };
  const [reports, invoices, bookings] = await Promise.all([
    prisma.financeReport.findMany({ where: { referenceMonth: range }, orderBy: [{ referenceMonth: "asc" }, { id: "asc" }], select: {
      id: true, propertyId: true, referenceMonth: true, currency: true, grossRevenue: true, finalAmount: true, formulaSnapshot: true,
      property: { select: { name: true } }, rules: { select: { category: true, operation: true, calculatedAmount: true } }, adjustments: { select: { amount: true } },
    } }),
    prisma.document.findMany({ where: { type: "COMMISSION_INVOICE", status: { not: "ARCHIVED" }, referenceMonth: range }, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], select: {
      id: true, propertyId: true, referenceMonth: true, status: true, content: true, property: { select: { name: true } },
    } }),
    // Exactly the same source and criteria as /reports/cleaning; one cost per stay, not per assigned operator.
    prisma.booking.findMany({ where: { checkOut: range, bookingStatus: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] } }, orderBy: [{ checkOut: "asc" }, { id: "asc" }],
      select: { id: true, checkOut: true, property: { select: { name: true, cleaningCost: true } } } }),
  ]);
  const result: AutomaticAccounting = { reports: [], invoices: [], cleaning: [], warnings: [], loadedAt: new Date().toISOString() };
  const seen = new Set<string>();
  for (const invoice of invoices) {
    const month = invoice.referenceMonth!.toISOString().slice(0, 7);
    const pair = `${invoice.propertyId ?? invoice.id}:${month}`;
    if (seen.has(pair)) { result.warnings.push(`Fattura duplicata per ${invoice.property?.name ?? invoice.id} · ${month}: inclusa soltanto l’ultima aggiornata.`); continue; }
    seen.add(pair);
    const amounts = readInvoice(invoice.content);
    if (!amounts) { result.warnings.push(`Fattura ${invoice.id}: dettaglio non leggibile o valuta diversa da EUR; esclusa dal totale.`); continue; }
    result.invoices.push({ id: invoice.id, propertyName: invoice.property?.name ?? "Portfolio", month, status: invoice.status, ...amounts });
  }
  for (const report of reports) {
    const month = report.referenceMonth.toISOString().slice(0, 7);
    if (report.currency !== "EUR") { result.warnings.push(`Rendiconto ${report.id} in ${report.currency}: escluso dai totali EUR.`); continue; }
    let amounts = { ota: null as number | null, f24: null as number | null, cleaning: null as number | null };
    let management: number | null = null;
    try { const detail = readReportBookingSnapshot(report.formulaSnapshot); management = detail ? Math.round(detail.reduce((n, b) => n + b.breakdown.managementCommissionTaxableBase, 0) * 100) : null; amounts = readOwnerAmounts(report.formulaSnapshot, report.rules.map((r) => ({ ...r, calculatedAmount: Number(r.calculatedAmount) }))); }
    catch { result.warnings.push(`Dettaglio salvato non leggibile: ${report.property.name} · ${month}.`); }
    if (Object.values(amounts).some((v) => v === null)) result.warnings.push(`OTA, F24 o pulizie incompleti: ${report.property.name} · ${month}. Nessuna percentuale attuale applicata ai rendiconti storici.`);
    result.reports.push({ management, id: report.id, propertyId: report.propertyId, propertyName: report.property.name, month, gross: Math.round(Number(report.grossRevenue) * 100), ownerNet: Math.round((Number(report.finalAmount) + report.adjustments.reduce((n, a) => n + Number(a.amount), 0)) * 100), ...amounts });
    if (!seen.has(`${report.propertyId}:${month}`)) result.warnings.push(`Manca la fattura commissioni: ${report.property.name} · ${month}. Il compenso non viene inventato dal rendiconto.`);
  }
  result.cleaning = bookings.map((b) => ({ id: b.id, propertyName: b.property.name, date: b.checkOut.toISOString().slice(0, 10), amount: Math.round(Number(b.property.cleaningCost) * 100) }));
  return result;
}
