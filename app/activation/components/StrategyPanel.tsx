import type { ActivationConfig } from "@/lib/activation/config";
import { addDays, romeToday } from "@/lib/activation/dates";
import { Card, fieldClass, NumberField, TextField } from "./controls";

export function StrategyPanel({ config, update }: { config: ActivationConfig; update: (patch: Partial<ActivationConfig>) => void }) {
  return <div className="grid gap-5 lg:grid-cols-2">
    <Card title="Posizionamento e strategia di lancio">
      <div className="space-y-4">
        <label className="block text-sm">Situazione dell’alloggio<select className={fieldClass} value={config.mode} onChange={(event) => update({ mode: event.target.value as ActivationConfig["mode"] })}><option value="NEW">Nuovo annuncio</option><option value="ESTABLISHED">Alloggio già recensito</option><option value="RELAUNCH">Rilancio</option></select></label>
        <TextField label="Ospite principale" value={config.targetGuest} onChange={(targetGuest) => update({ targetGuest })} />
        <TextField label="Punti di forza" value={config.strengths} onChange={(strengths) => update({ strengths })} multiline />
        <TextField label="Limiti da dichiarare agli ospiti" value={config.limits} onChange={(limits) => update({ limits })} multiline />
      </div>
    </Card>
    <Card title="Periodo, condizioni e uscita dal lancio"><div className="space-y-4">
      <div className="grid grid-cols-2 gap-4"><TextField label="Inizio strategia" type="date" value={config.launchStart} onChange={(launchStart) => update({ launchStart })} /><TextField label="Fine strategia" type="date" value={config.launchEnd} onChange={(launchEnd) => update({ launchEnd })} /></div>
      <button type="button" className="text-sm text-[#D8B367] underline" onClick={() => { const today = romeToday(); update({ launchStart: today, launchEnd: addDays(today, 29) }); }}>Imposta un periodo di 30 giorni da oggi</button>
      <NumberField label="Riduzione di lancio sul riferimento (%)" value={config.launchDiscount} max={99} onChange={(launchDiscount) => update({ launchDiscount: launchDiscount ?? 0 })} />
      <TextField label="Criteri per terminare o rivedere il lancio" value={config.exitCriteria} onChange={(exitCriteria) => update({ exitCriteria })} multiline />
      <TextField label="Cancellazione e condizioni di prenotazione" value={config.cancellation} onChange={(cancellation) => update({ cancellation })} multiline />
      <p className="text-xs leading-5 text-slate-400">Il profilo non attiva sconti predefiniti. La riduzione vale solo per le date comprese nel periodo e rispetta la soglia minima. Alla scadenza torna il riferimento ordinario. Le verifiche a 3, 7, 14 e 30 giorni richiedono una decisione del gestore.</p>
    </div></Card>
  </div>;
}
