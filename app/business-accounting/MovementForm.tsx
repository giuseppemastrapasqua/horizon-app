"use client";

import { useState } from "react";
import { movementKinds, movementSchema, type Movement } from "@/lib/business-accounting/config";
import { buttonClass, inputClass, panelClass } from "./AccountingSettings";

export function MovementForm({ year, onSave, editing, onCancel, allowedKinds }: { year: number; onSave: (value: Movement) => void; editing?: Movement; onCancel: () => void; allowedKinds?: Movement["kind"][] }) {
  const [error, setError] = useState("");
  const [kind, setKind] = useState<Movement["kind"]>(editing?.kind ?? allowedKinds?.[0] ?? "INCOME");
  return <form className={panelClass} onSubmit={(event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const parsed = movementSchema.safeParse({
      id: editing?.id ?? crypto.randomUUID(), date: values.get("date"), description: values.get("description"), kind,
      category: values.get("category"), reference: values.get("reference"), amount: Math.round(Number(values.get("amount")) * 100),
      paid: values.get("paid") === "on", archived: editing?.archived ?? false, taxYear: Number(values.get("taxYear") ?? year),
      deductible: kind === "CONTRIBUTION" && values.get("deductible") === "on",
    });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Verifica i campi."); return; }
    if (!parsed.data.date.startsWith(`${year}-`)) { setError("La data deve appartenere all’anno selezionato."); return; }
    onSave(parsed.data);
    if (!editing) event.currentTarget.reset();
    setError("");
  }}>
    <h2 className="font-serif text-xl">{editing ? "Modifica movimento" : "Nuovo movimento"}</h2>
    <div className="mt-4 grid gap-4 md:grid-cols-3">
      <label className="text-sm">Tipo<select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value as Movement["kind"])}>{Object.entries(movementKinds).filter(([key]) => !allowedKinds || allowedKinds.includes(key as Movement["kind"]) || key === editing?.kind).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="text-sm">Data pagamento o scadenza<input className={inputClass} name="date" type="date" min={`${year}-01-01`} max={`${year}-12-31`} defaultValue={editing?.date ?? `${year}-01-01`} required /></label>
      <label className="text-sm">Importo totale (€)<input className={inputClass} name="amount" type="number" min="0.01" max="100000000" step="0.01" defaultValue={editing ? editing.amount / 100 : ""} required /></label>
      <label className="text-sm">Descrizione<input className={inputClass} name="description" maxLength={200} defaultValue={editing?.description} placeholder="Es. compenso gestione Duomo" required /></label>
      <label className="text-sm">Categoria<input className={inputClass} name="category" list="accounting-categories" maxLength={80} defaultValue={editing?.category} placeholder="Es. Gestione, pulizie, software" required /><datalist id="accounting-categories">{["Gestione", "Altri compensi", "Collaboratori", "Pulizie", "Lavanderia", "Software", "Pubblicità", "Commercialista", "INPS", "Imposte", "Proprietari", "Tassa soggiorno", "Personale"].map((c) => <option key={c}>{c}</option>)}</datalist></label>
      <label className="text-sm">Documento / alloggio / riferimento<input className={inputClass} name="reference" maxLength={150} defaultValue={editing?.reference} placeholder="Es. fattura 12 · Duomo" /></label>
      {(kind === "TAX" || kind === "CONTRIBUTION") && <label className="text-sm">Anno fiscale del versamento<input className={inputClass} name="taxYear" type="number" min="2020" max="2100" defaultValue={editing?.taxYear ?? year} required /></label>}
    </div>
    <div className="mt-4 flex flex-wrap gap-5 text-sm">
      <label><input type="checkbox" name="paid" defaultChecked={editing?.paid ?? true} /> Già incassato / pagato</label>
      {kind === "CONTRIBUTION" && <label><input type="checkbox" name="deductible" defaultChecked={editing?.deductible ?? false} /> Contributo obbligatorio fiscalmente deducibile</label>}
    </div>
    <p className="mt-3 text-xs text-slate-400">Registra il tuo compenso come ricavo solo dopo averne verificato la titolarità fiscale. Le somme dei proprietari e le imposte riscosse per terzi hanno categorie dedicate. Spese comprensive dell’IVA effettivamente sostenuta.</p>
    {error && <p className="mt-3 text-sm text-red-300" role="alert">{error}</p>}
    <div className="mt-4 flex gap-3"><button type="submit" className={buttonClass}>{editing ? "Applica modifica" : "Aggiungi al registro"}</button>{editing && <button type="button" className={buttonClass} onClick={onCancel}>Annulla</button>}</div>
  </form>;
}
