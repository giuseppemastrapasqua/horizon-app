import { z } from "zod";
import { readReportBookingSnapshot } from "@/lib/finance/report-booking-snapshot";
import type { Movement } from "./config";

export type OwnerSource = { id: string; propertyId: string; propertyName: string; month: string; gross: number; ownerNet: number; ota: number | null; f24: number | null; cleaning: number | null };
export type InvoiceSource = { id: string; propertyName: string; month: string; status: string; base: number; vat: number; total: number };
export type CleaningSource = { id: string; propertyName: string; date: string; amount: number };
export type AutomaticAccounting = { reports: OwnerSource[]; invoices: InvoiceSource[]; cleaning: CleaningSource[]; warnings: string[]; loadedAt: string };
const amount = z.number().finite().nonnegative();
const invoiceSchema = z.object({ kind: z.literal("COMMISSION_INVOICE"), commission: z.object({ taxableBase: amount, vat: amount, total: amount, currency: z.literal("EUR") }) });
const cents = (n: number) => Math.round(n * 100);

export function readInvoice(content: unknown) {
  const parsed = invoiceSchema.safeParse(content);
  return parsed.success ? { base: cents(parsed.data.commission.taxableBase), vat: cents(parsed.data.commission.vat), total: cents(parsed.data.commission.total) } : null;
}

export function readOwnerAmounts(snapshot: unknown, rules: { category: string; operation: string; calculatedAmount: number }[]) {
  const saved = readReportBookingSnapshot(snapshot);
  if (saved) {
    const sum = (field: "otaCommission" | "taxAmount" | "cleaningCost") => saved.some((b) => b.breakdown[field] === null) ? null : saved.reduce((n, b) => n + cents(b.breakdown[field] ?? 0), 0);
    return { ota: sum("otaCommission"), f24: sum("taxAmount"), cleaning: sum("cleaningCost") };
  }
  // Older reports: only use saved category totals, never today's percentages.
  const sum = (category: string) => {
    const selected = rules.filter((r) => r.category === category);
    return selected.length ? selected.reduce((n, r) => n + cents(r.calculatedAmount) * (r.operation === "SUBTRACT" ? 1 : -1), 0) : null;
  };
  return { ota: sum("OTA_COMMISSION"), f24: sum("TAX"), cleaning: sum("CLEANING") };
}

export function automaticMovements(source: AutomaticAccounting, year: number): Movement[] {
  const base = { category: "Automatico Horizon", paid: true, archived: false, taxYear: year, deductible: false };
  return [
    ...source.invoices.filter((r) => r.base > 0).map((r): Movement => ({ ...base, id: `invoice:${r.id}`, kind: "INCOME", date: `${r.month}-01`, amount: r.base, description: `Compenso fatturato · ${r.propertyName}`, reference: r.id })),
    ...source.cleaning.filter((r) => r.amount > 0).map((r): Movement => ({ ...base, id: `cleaning:${r.id}`, kind: "EXPENSE", date: r.date, amount: r.amount, description: `Costo collaboratori previsto · ${r.propertyName}`, reference: r.id })),
  ];
}

export function automaticTotals(source: AutomaticAccounting) {
  const sum = <T,>(rows: T[], fn: (r: T) => number) => rows.reduce((n, r) => n + fn(r), 0);
  const complete = (key: "ota" | "f24" | "cleaning") => source.reports.some((r) => r[key] === null) ? null : sum(source.reports, (r) => r[key] ?? 0);
  return { gross: sum(source.reports, (r) => r.gross), ownerNet: sum(source.reports, (r) => r.ownerNet), ota: complete("ota"), f24: complete("f24"), cleaningCharged: complete("cleaning"),
    compensation: sum(source.invoices, (r) => r.base), invoiceVat: sum(source.invoices, (r) => r.vat), invoiceTotal: sum(source.invoices, (r) => r.total),
    draftTotal: sum(source.invoices.filter((r) => r.status === "DRAFT"), (r) => r.base), collaborators: sum(source.cleaning, (r) => r.amount) };
}
