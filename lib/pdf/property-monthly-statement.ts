import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { PropertyMonthlyStatement } from "@/lib/finance/property-monthly-statement";

const ink = rgb(0.08, 0.13, 0.17), muted = rgb(0.34, 0.39, 0.43);
const gold = rgb(0.76, 0.61, 0.32), pale = rgb(0.96, 0.95, 0.92);
const money = (value: number | null, currency: string) => value === null ? "N/D" :
  new Intl.NumberFormat("it-IT", { style: "currency", currency }).format(value / 100);
const date = (value: Date) => value.toLocaleDateString("it-IT", { timeZone: "UTC" });
const safe = (text: string) => text.replace(/[\r\n\t]/g, " ").replace(/[^\x20-\x7E\xA0-\xFF\u20AC]/g, "-");

export async function buildPropertyMonthlyStatementPdf(data: PropertyMonthlyStatement) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const { report, totals } = data;
  const period = report.referenceMonth.toLocaleDateString("it-IT", { month: "long", year: "numeric", timeZone: "UTC" });
  let page = pdf.addPage([842, 595]), y = 0;
  const text = (value: string, x: number, top: number, size = 9, strong = false, color = ink) => {
    page.drawText(safe(value), { x, y: top, size, font: strong ? bold : regular, color });
  };
  const lines = (value: string, width: number, size = 9) => {
    const output: string[] = []; let line = "";
    for (const word of safe(value).split(/ +/)) {
      const next = line ? `${line} ${word}` : word;
      if (regular.widthOfTextAtSize(next, size) <= width) { line = next; continue; }
      if (line) { output.push(line); line = ""; }
      for (const char of word) {
        if (regular.widthOfTextAtSize(line + char, size) > width) { output.push(line); line = ""; }
        line += char;
      }
    }
    if (line) output.push(line);
    return output;
  };
  const header = () => {
    page.drawRectangle({ x: 36, y: 552, width: 770, height: 3, color: gold });
    text("HORIZON  |  DOCUMENTI COMMERCIALISTA", 36, 568, 12, true);
    text("Rendiconto mensile proprieta", 36, 525, 22, true);
    text(`${period} | Rif. ${report.id} | Rendiconto del ${date(report.createdAt)}`, 36, 505, 9, false, muted);
    y = 482;
    for (const line of lines(`Proprieta: ${report.property.name} | ${report.property.address}, ${report.property.city}`, 760)) {
      text(line, 36, y, 10, true); y -= 14;
    }
    for (const line of lines(`Proprietario: ${report.owner.fullName}`, 760)) { text(line, 36, y, 10); y -= 14; }
    text("Prospetto contabile per il commercialista - valori del rendiconto salvato", 36, y - 3, 9, false, muted);
    y -= 28;
  };
  const ensure = (height: number) => {
    if (y - height < 48) { page = pdf.addPage([842, 595]); header(); }
  };
  const paragraph = (value: string, strong = false) => {
    for (const line of lines(value, 765)) { ensure(14); text(line, 36, y, 9, strong); y -= 13; }
    y -= 5;
  };
  const widths = [220, 140, 140, 120, 150];
  const starts = widths.map((_, i) => 36 + widths.slice(0, i).reduce((a, b) => a + b, 0));
  const columnRight = (index: number) => starts[index] + widths[index] - 10;
  const tableHeader = () => {
    page.drawRectangle({ x: 36, y: y - 7, width: 770, height: 24, color: ink });
    ["Prenotazione / canale", "Check-in / out", "Incasso", "F24", "Saldo proprieta"].forEach((label, i) => {
      const x = i < 2 ? starts[i] + 10 : columnRight(i) - bold.widthOfTextAtSize(safe(label), 9);
      text(label, x, y + 2, 9, true, rgb(1, 1, 1));
    });
    y -= 30;
  };
  const amounts = (values: (number | null)[], top: number, strong = false) => values.forEach((value, i) => {
    const label = money(value, report.currency), size = 10;
    text(label, columnRight(i + 2) - (strong ? bold : regular).widthOfTextAtSize(safe(label), size), top, size, strong);
  });
  header();
  if (data.incomplete) paragraph("PROSPETTO DA VERIFICARE - consultare le avvertenze e il rendiconto originale.", true);
  tableHeader();
  if (!data.rows.length) paragraph(data.totals.gross === null ? "Dettaglio prenotazioni storico non disponibile." : "Nessuna prenotazione inclusa nel rendiconto salvato.");
  data.rows.forEach((row, index) => {
    const referenceLines = lines(row.reference, widths[0] - 20, 8);
    const height = Math.max(32, referenceLines.length * 11 + 16);
    if (y - height < 50) { page = pdf.addPage([842, 595]); header(); tableHeader(); }
    if (index % 2 === 0) page.drawRectangle({ x: 36, y: y - height + 12, width: 770, height, color: pale });
    referenceLines.forEach((line, n) => text(line, starts[0] + 10, y - n * 11, 8));
    text(row.channel, starts[0] + 10, y - referenceLines.length * 11, 7, false, muted);
    text(date(row.checkIn), starts[1] + 10, y, 8);
    text(date(row.checkOut), starts[1] + 10, y - 12, 8);
    amounts([row.otaNet, row.f24, row.net], y);
    y -= height;
  });
  if (y - 32 < 48) { page = pdf.addPage([842, 595]); header(); tableHeader(); }
  page.drawLine({ start: { x: 36, y: y + 12 }, end: { x: 806, y: y + 12 }, color: gold, thickness: 1 });
  text("TOTALE DETTAGLIO", 46, y, 9, true);
  amounts([totals.otaNet, totals.f24, totals.net], y, true);
  y -= 28;
  if (data.adjustments.length) {
    paragraph("COSTI ESTERNI E RETTIFICHE", true);
    for (const item of data.adjustments) paragraph(`${item.description}: ${money(item.amount, report.currency)}`);
  }
  ensure(data.adjustments.length || data.difference ? 215 : 140);
  paragraph("RIEPILOGO DEL MESE", true);
  const summary = (label: string, value: number | null, strong = false) => {
    text(label, 390, y, 10, strong);
    const amount = safe(money(value, report.currency));
    text(amount, columnRight(4) - (strong ? bold : regular).widthOfTextAtSize(amount, 10), y, 10, strong); y -= 24;
  };
  summary("Incasso", totals.otaNet);
  summary("F24", totals.f24);
  if (data.difference) summary("Scostamento totale salvato / dettaglio", data.difference);
  if (data.adjustments.length) {
    summary("Saldo prima dei costi esterni / rettifiche", data.savedNet);
    summary("Totale costi esterni / rettifiche (+/-)", data.adjustmentTotal);
  }
  page.drawRectangle({ x: 380, y: y - 8, width: 426, height: 26, color: pale });
  summary("SALDO SPETTANTE ALLA PROPRIETA", data.payable, true); y -= 15;
  for (const warning of data.warnings) paragraph(`Da verificare: ${warning}`);
  const pages = pdf.getPages();
  pages.forEach((item, index) => item.drawText(`Horizon | ${safe(period)} | ${index + 1} / ${pages.length}`, { x: 36, y: 22, size: 8, font: regular, color: muted }));
  return pdf.save();
}
