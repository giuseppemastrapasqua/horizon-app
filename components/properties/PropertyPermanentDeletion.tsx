"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { deletePropertyWithFeedbackAction } from "@/app/properties/[id]/edit/property-lifecycle-actions";
import { propertyDeletionBlockers, type PropertyDeletionCounts } from "@/lib/properties/permanent-deletion-policy";

export function PropertyPermanentDeletion({ propertyId, name, archived, counts }: { propertyId: string; name: string; archived: boolean; counts: PropertyDeletionCounts }) {
  const [state, action, pending] = useActionState(deletePropertyWithFeedbackAction, { message: "" });
  const [confirmation, setConfirmation] = useState("");
  const inputId = useId();
  const blockers = propertyDeletionBlockers(counts);
  const blocked = !archived || blockers.length > 0;
  return <section className="mt-8 rounded-2xl border border-red-400/25 bg-[#17151B] p-6" aria-label="Eliminazione definitiva">
    <p className="text-xs font-semibold uppercase tracking-wider text-red-300">Zona pericolosa</p>
    <h3 className="mt-2 font-serif text-xl font-semibold text-[#FFF8EA]">Eliminazione definitiva</h3>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Disponibile solo per strutture archiviate e senza storico operativo protetto. L’operazione non può essere annullata.</p>
    {blocked ? <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4">
      <p className="font-semibold text-amber-200">Eliminazione non disponibile</p>
      {!archived && <p className="mt-2 text-sm text-slate-300">Archivia prima la struttura dalla sezione Stato struttura.</p>}
      {blockers.length > 0 && <><p className="mt-2 text-sm text-slate-300">Questa struttura conserva dati collegati:</p><ul className="mt-3 space-y-2 text-sm text-[#FFF8EA]">{blockers.map((item) => <li key={item.key}>{item.label}: <strong>{item.count}</strong></li>)}</ul><p className="mt-3 text-sm text-slate-300">L’archiviazione mantiene consultabili documenti e rendiconti. Non occorre eliminarli per togliere l’alloggio dall’elenco degli attivi.</p><div className="mt-3 flex flex-wrap gap-4 text-sm text-[#D8B367]">{counts.financeReports > 0 && <Link href={`/reports/finance?propertyId=${propertyId}`}>Vedi rendiconti →</Link>}{counts.documents > 0 && <Link href={`/documents?propertyId=${propertyId}`}>Vedi documenti →</Link>}</div></>}
    </div> : <form action={action} className="mt-5 max-w-xl">
      <input type="hidden" name="propertyId" value={propertyId} />
      <label htmlFor={inputId} className="block text-sm text-slate-200">Per confermare, scrivi esattamente: <strong>{name}</strong></label>
      <input id={inputId} name="confirmation" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required autoComplete="off" disabled={pending} className="mt-3 w-full rounded-xl border border-red-300/30 bg-[#07111A] px-3 py-2.5 text-white" />
      <button type="submit" disabled={pending || confirmation.trim() !== name} className="mt-4 rounded-xl bg-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Eliminazione in corso…" : "Elimina definitivamente"}</button>
    </form>}
    {state.message && <p role="alert" className="mt-4 rounded-xl border border-amber-300/25 p-4 text-sm text-amber-200">{state.message}</p>}
  </section>;
}
