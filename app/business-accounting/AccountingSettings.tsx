import type { Accounting } from "@/lib/business-accounting/config";

export const inputClass = "mt-1 block w-full rounded-lg border border-white/15 bg-[#07111A] px-3 py-2 text-sm text-white";
export const panelClass = "rounded-2xl border border-white/10 bg-[#09131C] p-5";
export const buttonClass = "rounded-lg border border-[#D8B367]/40 px-4 py-2 text-sm text-[#D8B367] disabled:opacity-50";

export function AccountingSettings({ data, update }: { data: Accounting; update: (patch: Partial<Accounting>) => void }) {
  return <details className={panelClass}>
    <summary className="cursor-pointer font-semibold text-[#D8B367]">Profilo fiscale e saldi iniziali</summary>
    <p className="mt-4 text-sm text-slate-400">ATECO 55.20.42 · imposta sostitutiva 15% · Gestione Separata, come da tuoi dati. Il coefficiente proposto per il gruppo alloggio è 40%: conferma con il commercialista che si applichi ai compensi registrati e verifica l’inquadramento previdenziale.</p>
    <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <label className="text-sm">Coefficiente redditività (%)<input type="number" min="1" max="100" step="0.01" value={data.coefficient} className={inputClass} onChange={(e) => update({ coefficient: Number(e.target.value) })} /></label>
      <label className="text-sm">INPS stimata per l’anno (€)<input type="number" min="0" step="0.01" placeholder="Importo del commercialista" value={data.contributionEstimate === null ? "" : data.contributionEstimate / 100} className={inputClass} onChange={(e) => update({ contributionEstimate: e.target.value === "" ? null : Math.round(Number(e.target.value) * 100) })} /></label>
      <label className="text-sm">Saldo iniziale conto e cassa (€)<input type="number" step="0.01" value={data.openingBalance / 100} className={inputClass} onChange={(e) => update({ openingBalance: Math.round(Number(e.target.value) * 100) })} /></label>
      <label className="text-sm">Di cui fondi iniziali di terzi (€)<input type="number" min="0" step="0.01" value={data.openingThirdParty / 100} className={inputClass} onChange={(e) => update({ openingThirdParty: Math.round(Number(e.target.value) * 100) })} /></label>
    </div>
    <label className="mt-4 flex items-start gap-3 text-sm"><input type="checkbox" checked={data.fiscalConfirmed} onChange={(e) => update({ fiscalConfirmed: e.target.checked })} /><span>Ho verificato coefficiente, classificazione degli incassi e applicabilità del forfettario per quest’anno.</span></label>
    <p className="mt-3 text-xs text-slate-400">La stima INPS è un importo annuale esplicito: non viene dedotta automaticamente dai contributi già pagati. I contributi obbligatori effettivamente versati e contrassegnati come deducibili riducono invece la base dell’imposta. Saldi iniziali da riportare e riconciliare ogni anno.</p>
    <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#D8B367]">
      <a href="https://www.agenziaentrate.gov.it/portale/regime-forfetario-le-regole-2020-/infogen-regime-forfetario-le-regole-2020-" target="_blank" rel="noreferrer">Regole Agenzia delle Entrate ↗</a>
      <a href="https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.02.gestione-separata-le-aliquote-contributive-per-il-2026.html" target="_blank" rel="noreferrer">Gestione Separata 2026 ↗</a>
    </div>
  </details>;
}
