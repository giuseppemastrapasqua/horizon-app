import type { Accounting } from "@/lib/business-accounting/config";
import { euro } from "@/lib/business-accounting/config";
import { calculateAccounting } from "@/lib/business-accounting/calculate";
import { panelClass } from "./AccountingSettings";

export function AccountingSummary({ data, year }: { data: Accounting; year: number }) {
  const result = calculateAccounting(data, year);
  return <>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
      ["Compensi incassati", result.income, "Ricavi registrati e incassati nell’anno"],
      ["Spese effettivamente pagate", result.expenses, "Costi dell’attività, IVA sostenuta compresa"],
      ["Netto annuale stimato", result.net, "Incassi − costi − INPS annuale stimata − imposta stimata"],
      ["Disponibile dopo accantonamenti", result.available, "Saldo registrato − fondi di terzi − riserve residue"],
    ].map(([label, value, detail]) => <section key={String(label)} className={panelClass}><p className="text-xs uppercase tracking-wider text-slate-400">{label}</p><strong className="mt-3 block text-2xl text-[#D8B367]">{euro(value as number | null)}</strong><p className="mt-2 text-xs text-slate-400">{detail}</p></section>)}</div>
    {!data.fiscalConfirmed && <p className="rounded-xl border border-amber-300/25 p-4 text-sm text-amber-200">Conferma il profilo fiscale per attivare la stima dell’imposta. Completa anche la stima INPS per vedere il netto.</p>}
    {result.income > 8_500_000 && <p role="alert" className="rounded-xl border border-amber-300/25 p-4 text-sm text-amber-200">Incassi registrati oltre €85.000: verifica la permanenza nel regime. {result.income > 10_000_000 ? "Oltre €100.000 il calcolo forfettario dell’anno è sospeso: serve una valutazione fiscale specifica." : "La stima non determina automaticamente l’accesso al regime per l’anno successivo."}</p>}
    <div className="grid gap-4 lg:grid-cols-2">
      <section className={panelClass}><h2 className="font-serif text-xl">Come si forma il reddito fiscale</h2><dl className="mt-4 space-y-3 text-sm">{[
        ["Compensi incassati", result.income], [`Reddito forfettario lordo · ${data.coefficient}%`, result.fiscalGross],
        ["Contributi obbligatori pagati e deducibili", result.deductible], ["Base imponibile stimata", result.taxable],
        ["Imposta sostitutiva · 15%", result.taxEstimate], ["INPS annuale stimata inserita", result.contributionEstimate],
      ].map(([label, value]) => <div className="flex justify-between gap-4" key={String(label)}><dt className="text-slate-400">{label}</dt><dd className="text-right tabular-nums">{euro(value as number | null)}</dd></div>)}</dl><p className="mt-4 text-xs text-slate-400">I costi reali riducono il tuo guadagno ma non la base forfettaria. I contributi stimati e quelli già versati restano distinti. Le stime sono annuali, non dichiarazioni fiscali.</p></section>
      <section className={panelClass}><h2 className="font-serif text-xl">Cassa, pagamenti e riserve</h2><dl className="mt-4 space-y-3 text-sm">{[
        ["Saldo conto e cassa ricostruito", result.balance], ["Fondi di terzi da riconciliare", result.thirdParty],
        ["INPS versata nell’anno (tutti gli anni fiscali)", result.contributionsPaid], ["Imposte versate nell’anno (tutti gli anni fiscali)", result.taxesPaid],
        ["Riserva residua imposta anno corrente", result.reserveTax], ["Riserva residua INPS anno corrente", result.reserveContribution],
        ["Compensi ancora da incassare", result.receivables], ["Spese ancora da pagare", result.payables],
      ].map(([label, value]) => <div className="flex justify-between gap-4" key={String(label)}><dt className="text-slate-400">{label}</dt><dd className="text-right tabular-nums">{euro(value as number | null)}</dd></div>)}</dl><p className="mt-4 text-xs text-slate-400">Le riserve sottraggono solo i versamenti attribuiti all’anno corrente. I saldi di anni precedenti riducono la cassa, senza essere scalati di nuovo dal netto dell’anno. Il disponibile non sottrae le spese non ancora pagate.</p></section>
    </div>
    <section className={panelClass}><h2 className="font-serif text-xl">Andamento mensile · cassa</h2><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-slate-400"><tr>{["Mese", "Incassi", "Costi", "INPS pagata", "Imposte pagate", "Margine prima di imposte e INPS"].map((s) => <th className="p-2 font-normal" key={s}>{s}</th>)}</tr></thead><tbody>{result.months.map((m) => <tr className="border-t border-white/5" key={m.month}><td className="p-2">{new Date(Date.UTC(year, m.month - 1)).toLocaleDateString("it-IT", { month: "long", timeZone: "UTC" })}</td>{[m.income, m.expenses, m.contributions, m.taxes, m.income - m.expenses].map((v, i) => <td className="p-2 tabular-nums" key={i}>{euro(v)}</td>)}</tr>)}</tbody></table></div></section>
  </>;
}
