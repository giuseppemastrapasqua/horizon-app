"use client";

import { useEffect, useState, useTransition } from "react";
import type { Accounting, Movement } from "@/lib/business-accounting/config";
import { accountingSchema } from "@/lib/business-accounting/config";
import { saveAccounting } from "./actions";
import { AccountingSettings, buttonClass } from "./AccountingSettings";
import { AccountingSummary } from "./AccountingSummary";
import { MovementForm } from "./MovementForm";
import { MovementRegister } from "./MovementRegister";

export function AccountingWorkspace({ initial, initialVersion, year }: { initial: Accounting; initialVersion: number; year: number }) {
  const [data, setData] = useState(initial);
  const [version, setVersion] = useState(initialVersion);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<Movement>();
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const update = (patch: Partial<Accounting>) => { setData((previous) => ({ ...previous, ...patch })); setDirty(true); setMessage(""); };
  const updateMovement = (movement: Movement) => {
    update({ movements: data.movements.some((m) => m.id === movement.id) ? data.movements.map((m) => m.id === movement.id ? movement : m) : [...data.movements, movement] });
    setEditing(undefined);
  };
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm text-[#D8B367]">Contabilità privata · {year}</p><p className="mt-1 text-xs text-slate-400">{dirty ? "Modifiche da salvare" : version ? `Salvata · versione ${version}` : "Registro da iniziare"}</p></div><button type="button" className={`${buttonClass} bg-[#D8B367]/10`} disabled={pending || !dirty} onClick={() => {
      const parsed = accountingSchema.safeParse(data);
      if (!parsed.success) { setMessage(parsed.error.issues[0]?.message ?? "Verifica i dati."); return; }
      startTransition(async () => {
        try {
          const saved = await saveAccounting(year, version, parsed.data);
          setMessage(saved.message);
          if (saved.ok && saved.version) { setVersion(saved.version); setDirty(false); }
        } catch { setMessage("Salvataggio non riuscito. Riprova: le modifiche sono ancora presenti."); }
      });
    }}>{pending ? "Salvataggio…" : "Salva contabilità"}</button></div>
    {message && <p role="status" className="text-sm text-[#D8B367]">{message}</p>}
    <form className="flex items-end gap-3" method="get" onSubmit={(e) => { if (dirty) { e.preventDefault(); setMessage("Salva le modifiche prima di cambiare anno."); } }}><label className="text-sm">Anno<input className="ml-3 w-24 rounded-lg border border-white/15 bg-[#07111A] p-2" type="number" min="2020" max="2100" name="year" defaultValue={year} required /></label><button className={buttonClass} type="submit">Apri anno</button></form>
    <p className="text-sm text-slate-400">Registro gestionale per cassa: conta la data dell’incasso o del pagamento. I dati vanno registrati e riconciliati; prenotazioni e fatture non vengono considerate automaticamente incassate. Netto e disponibilità si basano sui movimenti presenti.</p>
    <fieldset disabled={pending} className="min-w-0 space-y-5">
      <AccountingSettings data={data} update={update} />
      <AccountingSummary data={data} year={year} />
      <MovementForm key={editing?.id ?? "new"} year={year} editing={editing} onSave={updateMovement} onCancel={() => setEditing(undefined)} />
      <MovementRegister movements={data.movements} edit={(m) => { setEditing(m); }} update={updateMovement} />
    </fieldset>
  </div>;
}
