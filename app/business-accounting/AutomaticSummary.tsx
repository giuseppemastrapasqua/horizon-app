import Link from "next/link";
import { automaticTotals, type AutomaticAccounting } from "@/lib/business-accounting/automatic";
import { calculateAccounting } from "@/lib/business-accounting/calculate";
import { euro, type Accounting } from "@/lib/business-accounting/config";
import { panelClass } from "./AccountingSettings";

const show = (n: number | null) => n === null ? "Dato incompleto" : euro(n);
export function AutomaticSummary({ source, calculated, year }: { source: AutomaticAccounting; calculated: Accounting; year: number }) {
  const total = automaticTotals(source);
  const net = calculateAccounting(calculated, year);
  return <>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[
      ["Lordo alloggi da rendiconti", total.gross, `${source.reports.length} rendiconti proprietari`],
      ["Compensi dalle fatture", total.compensation, "Imponibile · IVA delle fatture separata"],
      ["Costo collaboratori previsto", total.collaborators, `${source.cleaning.length} pulizie nel mese di check-out`],
      ["Costi OTA da rendiconti", total.ota, "Già considerati nel rendiconto proprietario"],
      ["F24 proprietari da rendiconti", total.f24, "Voce dei proprietari, distinta dalle tue imposte"],
      ["Netto gestionale stimato", source.warnings.length ? null : net.net, "Compensi − collaboratori − extra − INPS − tua imposta"],
    ].map(([label, value, detail]) => <section key={String(label)} className={panelClass}><p className="text-xs uppercase tracking-wider text-slate-400">{label}</p><strong className="mt-3 block text-2xl text-[#D8B367]">{value === null ? label === "Netto gestionale stimato" ? "Da completare" : "Dato incompleto" : euro(value as number)}</strong><p className="mt-2 text-xs text-slate-400">{detail}</p></section>)}</div>
    <section className={panelClass}><h2 className="font-serif text-xl">Commissioni maturate nei rendiconti</h2><p className="mt-3 text-2xl text-[#D8B367]">{source.reports.some(r => r.management == null) ? "Dato incompleto" : euro(source.reports.reduce((n, r) => n + (r.management ?? 0), 0))}</p><p className="mt-2 text-sm text-slate-400">Imponibile di gestione salvato nei rendiconti, distinto dai compensi fatturati. Non certifica un incasso e non viene aggiunto di nuovo ai ricavi.</p></section>
    <section className={panelClass}><h2 className="font-serif text-xl">Contabilità collegata a Horizon</h2><p className="mt-3 text-sm text-slate-300">I totali si aggiornano a ogni apertura o ricaricamento della pagina. Fatture e rendiconti vengono letti direttamente: non devi ricopiare gli importi.</p>
      <p className="mt-3 text-sm text-slate-400">Il riepilogo segue il mese dei documenti e il check-out per le pulizie. Le fatture generate non hanno una data di incasso certificata: il netto è una simulazione sui documenti, non un saldo bancario. Sono incluse le bozze, evidenziate qui sotto.</p>
      <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">{[
        ["Compensi imponibili nelle fatture", total.compensation], ["Di cui fatture in bozza", total.draftTotal],
        ["IVA presente nelle fatture", total.invoiceVat], ["Totale documenti fattura", total.invoiceTotal],
        ["Pulizie addebitate nei rendiconti", total.cleaningCharged], ["Netti proprietari con rettifiche", total.ownerNet],
        ["Altre spese registrate", net.expenses - total.collaborators], ["Margine prima di INPS e imposta", net.income - net.expenses],
        ["Reddito forfettario lordo simulato", net.fiscalGross], ["INPS pagata e deducibile registrata", net.deductible],
        ["Imponibile fiscale simulato", net.taxable], ["Tua imposta sostitutiva stimata · 15%", net.taxEstimate],
        ["Tua INPS annuale stimata", net.contributionEstimate],
      ].map(([label, value]) => <div key={String(label)} className="flex justify-between gap-4 border-b border-white/5 pb-2"><dt className="text-slate-400">{label}</dt><dd className="text-right tabular-nums">{show(value as number | null)}</dd></div>)}</dl>
      <p className="mt-4 text-xs text-slate-400">I compensi sono già al netto delle voci che precedono la commissione di gestione: OTA e F24 dei proprietari restano visibili, senza una seconda sottrazione. Il costo collaboratori è sottratto una volta nel margine gestionale; le pulizie addebitate al proprietario sono esposte separatamente per verificarne la copertura. La stima fiscale usa il compenso imponibile delle fatture: rimborsi e ulteriori ricavi richiedono la corretta classificazione fiscale.</p>
      {total.invoiceVat > 0 && <p className="mt-3 text-sm text-amber-200">Le fatture selezionate contengono IVA: verifica che emittente e documenti corrispondano alla tua attività forfettaria. Il riepilogo conserva gli importi originari e separa l’IVA dal compenso.</p>}
      {!calculated.fiscalConfirmed && <p className="mt-3 text-sm text-amber-200">Profilo fiscale da confermare. Inserisci la stima annuale INPS per completare la simulazione del netto.</p>}
      {net.income > 8_500_000 && <p className="mt-3 text-sm text-amber-200">Compensi documentati oltre €85.000: verifica i requisiti del regime. {net.income > 10_000_000 && "Simulazione forfettaria sospesa oltre €100.000."}</p>}
    </section>
    {!!source.warnings.length && <section className={panelClass} aria-label="Dati da verificare"><h2 className="text-amber-200">Riepilogo parziale · {source.warnings.length} verifiche</h2><ul className="mt-3 list-inside list-disc space-y-2 text-sm text-amber-100">{source.warnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul></section>}
    <section className={panelClass}><h2 className="font-serif text-xl">Riepilogo automatico mensile</h2><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-slate-400"><tr>{["Mese", "Lordo alloggi", "Compensi", "Collaboratori previsti", "OTA", "F24 proprietari", "Netti proprietari"].map((label) => <th key={label} className="p-2 font-normal">{label}</th>)}</tr></thead><tbody>{Array.from({ length: 12 }, (_, i) => {
      const month = `${year}-${String(i + 1).padStart(2, "0")}`;
      const m = automaticTotals({ ...source, reports: source.reports.filter((r) => r.month === month), invoices: source.invoices.filter((r) => r.month === month), cleaning: source.cleaning.filter((r) => r.date.startsWith(month)) });
      return <tr key={month} className="border-t border-white/5"><td className="p-2">{month}</td>{[m.gross, m.compensation, m.collaborators, m.ota, m.f24, m.ownerNet].map((n, j) => <td key={j} className="p-2 tabular-nums">{show(n)}</td>)}</tr>;
    })}</tbody></table></div></section>
    <details className={panelClass}><summary className="cursor-pointer text-[#D8B367]">Origine di ogni importo · fatture, rendiconti e collaboratori</summary>
      <h3 className="mb-2 mt-5 font-semibold">Fatture commissioni</h3><div className="space-y-2 text-sm">{source.invoices.map((r) => <p key={r.id} className="flex flex-wrap justify-between gap-3 border-b border-white/5 pb-2"><Link className="text-[#D8B367]" href={`/invoices/${r.id}/pdf`}>{r.month} · {r.propertyName} · {r.status === "DRAFT" ? "Bozza" : r.status}</Link><span>Compenso {euro(r.base)} · IVA {euro(r.vat)} · totale {euro(r.total)}</span></p>)}{!source.invoices.length && <p>Nessuna fattura generata per l’anno.</p>}</div>
      <h3 className="mb-2 mt-5 font-semibold">Rendiconti proprietari</h3><div className="space-y-2 text-sm">{source.reports.map((r) => <p key={r.id} className="border-b border-white/5 pb-2"><Link className="text-[#D8B367]" href={`/reports/monthly/${r.id}`}>{r.month} · {r.propertyName}</Link><span className="mt-1 block">Lordo {euro(r.gross)} · OTA {show(r.ota)} · F24 {show(r.f24)} · pulizie {show(r.cleaning)} · gestione imponibile {show(r.management ?? null)} · netto {euro(r.ownerNet)}</span></p>)}{!source.reports.length && <p>Nessun rendiconto salvato per l’anno.</p>}</div>
      <h3 className="mb-2 mt-5 font-semibold">Collaboratori · stessa fonte del rendiconto pulizie</h3><p className="mb-3 text-xs text-slate-400">Costi attualmente configurati per alloggio, un intervento per soggiorno. Non certificano esecuzione o pagamento. Nessuna moltiplicazione per il numero di collaboratori assegnati.</p><div className="space-y-2 text-sm">{source.cleaning.map((r) => <p key={r.id} className="flex justify-between gap-3 border-b border-white/5 pb-2"><Link className="text-[#D8B367]" href={`/bookings/${r.id}`}>{r.date} · {r.propertyName}</Link><span>{euro(r.amount)}</span></p>)}{!source.cleaning.length && <p>Nessun intervento nel periodo.</p>}</div>
    </details>
  </>;
}
