import type { ActivationConfig } from "@/lib/activation/config";
import { Card, fieldClass, NumberField, Toggle } from "./controls";

export function RevenueSettings({ config, update, maxGuests }: { config: ActivationConfig; update: (patch: Partial<ActivationConfig>) => void; maxGuests: number }) {
  return <Card><details><summary className="cursor-pointer font-serif text-xl text-[#D8B367]">Parametri Revenue e costi</summary>
    <p className="my-4 text-sm leading-6 text-slate-400">Riferimento, soglia e massimo sono importi finali per notte agli ospiti inclusi, pulizie comprese, prima del ricarico canale. Il costo pulizie si sottrae una sola volta per soggiorno; non viene aggiunto nuovamente al totale ospite.</p>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <NumberField label="Riferimento €/notte" value={config.base} onChange={(base) => update({ base })} />
      <NumberField label="Soglia minima €/notte" value={config.floor} onChange={(floor) => update({ floor })} />
      <NumberField label="Massimo €/notte" value={config.ceiling} onChange={(ceiling) => update({ ceiling })} />
      <NumberField label="Obiettivo netto mensile €" value={config.targetMonthly} onChange={(targetMonthly) => update({ targetMonthly })} />
      <NumberField label="Ospiti inclusi" integer max={maxGuests} value={config.baseGuests} onChange={(baseGuests) => update({ baseGuests: baseGuests ?? 1 })} />
      <NumberField label="Extra €/ospite per notte" value={config.extraGuestFee} onChange={(extraGuestFee) => update({ extraGuestFee: extraGuestFee ?? 0 })} />
      <NumberField label="Minimo notti" integer value={config.minimumStay} onChange={(minimumStay) => update({ minimumStay: minimumStay ?? 1 })} />
      <NumberField label="Pulizie €/soggiorno" value={config.cleaning} onChange={(cleaning) => update({ cleaning: cleaning ?? 0 })} />
      <NumberField label="Altri costi €/soggiorno" value={config.otherCosts} onChange={(otherCosts) => update({ otherCosts: otherCosts ?? 0 })} />
      <NumberField label="Gestione (%)" value={config.management} max={99} onChange={(management) => update({ management: management ?? 0 })} />
      <NumberField label="IVA gestione (%)" value={config.vat} max={99} onChange={(vat) => update({ vat: vat ?? 0 })} />
      <label className="text-sm">Modalità IVA<select className={fieldClass} value={config.vatMode} onChange={(event) => update({ vatMode: event.target.value as ActivationConfig["vatMode"] })}><option value="EXCLUDED">Da aggiungere</option><option value="INCLUDED">Già inclusa</option><option value="NONE">Non applicata</option></select></label>
    </div>
    <p className="my-4 text-xs leading-5 text-slate-400">Gestione calcolata dopo commissioni canale e pulizie. Altri costi sottratti dopo la gestione. Netto prima delle imposte personali. Questi parametri valgono per la proiezione e non cambiano contratti, rendiconti o tariffe salvate. Verifica le condizioni applicabili alle date simulate.</p>
    <Toggle label="Calendario completo e verificato: abilita gli aggiustamenti per disponibilità invenduta" checked={config.calendarComplete} onChange={(calendarComplete) => update({ calendarComplete })} />
  </details></Card>;
}
