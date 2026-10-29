import type { FinanceReportPdfInput } from "@/lib/pdf/finance-report";
import type { PropertyMonthlyStatement } from "./property-monthly-statement";

export type RevenueSplit = { effectiveFrom: string; recipients: { key: string; name: string; basisPoints: number }[] };
export function readRevenueSplit(snapshot: unknown, month: Date): RevenueSplit | null {
  const split = (snapshot as { revenueSplit?: RevenueSplit } | null)?.revenueSplit;
  if (!split) return null;
  if (!/^\d{4}-\d{2}-01$/.test(split.effectiveFrom) || !Array.isArray(split.recipients) || split.recipients.length !== 2 ||
      split.recipients.some(r => !r.key || !r.name || !Number.isInteger(r.basisPoints) || r.basisPoints <= 0) ||
      new Set(split.recipients.map(r => r.key)).size !== 2 || split.recipients.reduce((s,r) => s+r.basisPoints,0) !== 10000)
    throw new Error("Ripartizione del rendiconto non valida.");
  return month.toISOString().slice(0,10) >= split.effectiveFrom ? split : null;
}
export function splitCents(value: number, split: RevenueSplit, index: number) {
  const first = Math.round(value * split.recipients[0].basisPoints / 10000);
  return index === 0 ? first : value - first;
}
export function recipientIndex(split: RevenueSplit | null, key: string) {
  return split ? split.recipients.findIndex(r => r.key === key) : -1;
}
export function splitStatement(data: PropertyMonthlyStatement, split: RevenueSplit, index: number): PropertyMonthlyStatement {
  const scale = (v: number | null) => v === null ? null : splitCents(v, split, index);
  const recipient = split.recipients[index];
  const rows = data.rows.map(row => ({ ...row, ...Object.fromEntries(
    ["gross","ota","otaNet","income","cleaning","managementBase","managementVat","management","f24","other","net"].map(key => [key,scale(row[key as keyof typeof row] as number | null)])) }));
  return { ...data, report: { ...data.report, owner: { fullName: recipient.name } }, rows,
    totals: Object.fromEntries(Object.entries(data.totals).map(([k,v]) => [k,scale(v)])) as typeof data.totals,
    adjustments: data.adjustments.map(a => ({...a,amount:scale(a.amount)!})),
    adjustmentTotal: scale(data.adjustmentTotal)!, savedGross: scale(data.savedGross)!, savedNet: scale(data.savedNet)!,
    payable: scale(data.payable)!, difference: scale(data.difference),
    warnings: [...data.warnings, `Quota ${recipient.basisPoints/100}% di tutte le voci del rendiconto. Le due quote sommate ricostruiscono il totale; possibili arrotondamenti nelle righe.`] };
}
export function splitFinancePdf(data: FinanceReportPdfInput, split: RevenueSplit, index: number): FinanceReportPdfInput {
  const scale = (v: number | null) => v === null ? null : splitCents(Math.round(v*100),split,index)/100;
  const recipient=split.recipients[index];
  return { ...data, title: `${data.title} - ${recipient.name} (${recipient.basisPoints/100}%)`,
    owner: {fullName:recipient.name,email:null,phone:null}, grossRevenue:scale(data.grossRevenue)!,finalAmount:scale(data.finalAmount)!,
    adjustments:data.adjustments.map(a=>({...a,amount:scale(a.amount)!})),rules:data.rules.map(r=>({...r,calculatedAmount:scale(r.calculatedAmount)!})),
    bookings:data.bookings.map(b=>({...b,...Object.fromEntries(
      ["grossBooking","otaCommission","cleaningCost","grossProperty","managementCommission","managementCommissionTaxableBase","managementCommissionVat","managementCommissionTotal","taxAmount","otherAmount","netProperty"].map(k=>[k,scale(b[k as keyof typeof b] as number|null)]))})),
    template:{...data.template,footerText:[data.template.footerText,`Quota ${recipient.basisPoints/100}% di tutte le voci; dal ${split.effectiveFrom}.`].filter(Boolean).join(" ")} };
}
