import { readReportBookingSnapshot } from "./report-booking-snapshot";

type Reference = { id: string; externalBookingId: string | null };
export type StatementReport = {
  id: string;
  referenceMonth: Date;
  createdAt: Date;
  currency: string;
  grossRevenue: number;
  finalAmount: number;
  formulaSnapshot: unknown;
  property: { name: string; address: string; city: string };
  owner: { fullName: string };
  adjustments: { description: string; amount: number }[];
};
const cents = (value: number) => Math.round(value * 100);

// No live pricing, tax rates or booking amounts enter this projection.
export function buildPropertyMonthlyStatement(report: StatementReport, references: Reference[] = []) {
  const saved = readReportBookingSnapshot(report.formulaSnapshot);
  const warnings: string[] = [];
  if (saved === null) warnings.push("Dettaglio storico per prenotazione non salvato. Sono disponibili solo i totali originali; non sono stati ricostruiti con le impostazioni attuali.");
  const rows = (saved ?? []).map((booking) => {
    if (booking.currency !== report.currency) throw new Error("Valute del dettaglio non coerenti con il rendiconto.");
    const b = booking.breakdown;
    const reference = booking.externalBookingId || references.find((item) => item.id === booking.id)?.externalBookingId;
    if (!reference) warnings.push("Alcune prenotazioni non hanno un numero portale: viene mostrato l'identificativo Horizon.");
    else if (!booking.externalBookingId) warnings.push("Alcuni numeri prenotazione provengono dall'anagrafica attuale. Gli importi restano quelli salvati.");
    if (b.otaCommission === null || b.taxAmount === null) warnings.push("Alcuni importi OTA o F24 non sono disponibili nel dettaglio salvato: non vengono considerati zero.");
    const gross = cents(b.grossBooking);
    const ota = b.otaCommission === null ? null : cents(b.otaCommission);
    return {
      id: booking.id,
      reference: reference || `Horizon ${booking.id}`,
      channel: booking.channel,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      gross,
      ota,
      otaNet: ota === null ? null : gross - ota,
      income: b.otaCommission === null ? null : cents(b.grossBooking - b.otaCommission - b.cleaningCost - b.managementCommissionTotal),
      cleaning: cents(b.cleaningCost),
      managementBase: cents(b.managementCommissionTaxableBase),
      managementVat: cents(b.managementCommissionVat),
      management: cents(b.managementCommissionTotal),
      f24: b.taxAmount === null ? null : cents(b.taxAmount),
      other: b.otherAmount === null ? 0 : cents(b.otherAmount),
      net: cents(b.netProperty),
    };
  });
  const sum = (key: "gross" | "ota" | "otaNet" | "income" | "cleaning" | "managementBase" | "managementVat" | "management" | "f24" | "other" | "net") =>
    saved === null || rows.some((row) => row[key] === null)
      ? null : rows.reduce((total, row) => total + (row[key] ?? 0), 0);
  const totals = {
    income: saved === null || rows.some((row) => row.income === null) ? null : cents((saved ?? []).reduce((total, booking) => total + booking.breakdown.grossBooking - (booking.breakdown.otaCommission ?? 0) - booking.breakdown.cleaningCost - booking.breakdown.managementCommissionTotal, 0)),
    gross: sum("gross"), ota: sum("ota"), otaNet: sum("otaNet"), cleaning: sum("cleaning"),
    managementBase: sum("managementBase"), managementVat: sum("managementVat"),
    management: sum("management"), f24: sum("f24"), other: sum("other"), net: sum("net"),
  };
  const adjustments = report.adjustments.map((item) => ({ ...item, amount: cents(item.amount) }));
  const adjustmentTotal = adjustments.reduce((total, item) => total + item.amount, 0);
  const savedGross = cents(report.grossRevenue), savedNet = cents(report.finalAmount);
  const difference = totals.net === null ? null : savedNet - totals.net;
  if (difference) warnings.push("La somma dei saldi di dettaglio differisce dal totale salvato: lo scostamento è esposto separatamente e il totale originale è preservato.");
  if (totals.gross !== null && totals.gross !== savedGross) warnings.push("Il lordo delle righe differisce dal lordo salvato. Verificare il rendiconto originale.");
  return {
    report, rows, totals, adjustments, adjustmentTotal, savedGross, savedNet,
    payable: savedNet + adjustmentTotal,
    difference,
    warnings: [...new Set(warnings)],
    incomplete: saved === null || totals.ota === null || totals.f24 === null || Boolean(difference) || (totals.gross !== null && totals.gross !== savedGross),
  };
}
export type PropertyMonthlyStatement = ReturnType<typeof buildPropertyMonthlyStatement>;
