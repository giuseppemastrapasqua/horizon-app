import Image from "next/image";
import Link from "next/link";
import { channelLabels, checklist, type ActivationConfig } from "@/lib/activation/config";
import { addDays } from "@/lib/activation/dates";
import type { ActivationWorkspaceData } from "@/lib/activation/load-workspace";
import { Card, goldButton, NumberField, TextField, Toggle } from "./controls";

type Props = { config: ActivationConfig; update: (patch: Partial<ActivationConfig>) => void; data: ActivationWorkspaceData };
export function PreparationPanel({ config, update, data }: Props) {
  return <div className="grid gap-5 lg:grid-cols-2"><Card title="Preparazione e verifiche"><div className="space-y-4">
    {Object.entries(checklist).map(([key, label]) => <Toggle key={key} label={label} checked={config.checks[key as keyof typeof checklist]} onChange={(done) => update({ checks: { ...config.checks, [key]: done } })} />)}
    <Link className="inline-block text-sm text-[#D8B367] underline" href={`/properties/${data.property.id}/edit`}>Apri documenti, dotazioni, accessi e fotografie</Link>
  </div></Card><Card title="Attività, responsabili e scadenze"><div className="space-y-5">
    {config.tasks.map((task, i) => { const change = (patch: Partial<typeof task>) => update({ tasks: config.tasks.map((item, index) => index === i ? { ...item, ...patch } : item) }); return <div className="space-y-3 border-b border-white/10 pb-4" key={task.id}>
      <Toggle label={task.title} checked={task.done} onChange={(done) => change({ done })} /><TextField label="Attività" value={task.title} onChange={(title) => change({ title })} />
      <div className="grid gap-3 sm:grid-cols-2"><TextField label="Responsabile" value={task.owner} onChange={(owner) => change({ owner })} /><TextField label="Scadenza" type="date" value={task.due} onChange={(due) => change({ due })} /></div>
      <button type="button" className="text-xs text-slate-400 underline" onClick={() => update({ tasks: config.tasks.filter((item) => item.id !== task.id) })}>Rimuovi attività</button>
    </div>; })}
    <button className={goldButton} type="button" disabled={config.tasks.length >= 100} onClick={() => update({ tasks: [...config.tasks, { id: crypto.randomUUID(), title: "Nuova attività", owner: "", due: "", done: false }] })}>Aggiungi attività</button>
  </div></Card></div>;
}
export function ListingsPanel({ config, update, data }: Props) {
  return <div className="space-y-5"><Card title="Fotografie dell’alloggio"><div className="flex gap-3 overflow-x-auto">
    {data.property.images.slice(0, 8).map((image) => <Image key={image.id} src={image.url} alt={image.caption || "Foto alloggio"} width={180} height={120} unoptimized className="h-28 w-44 rounded-lg object-cover" />)}
    {!data.property.images.length && <p className="text-sm text-amber-200">Nessuna foto caricata nell’immobile.</p>}
  </div><Link className="mt-4 inline-block text-sm text-[#D8B367] underline" href={`/properties/${data.property.id}/edit`}>Gestisci foto e copertina</Link></Card>
    <div className="grid gap-5 xl:grid-cols-2">{config.channels.map((channel, i) => {
      const change = (patch: Partial<typeof channel>) => update({ channels: config.channels.map((item, index) => index === i ? { ...item, ...patch } : item) });
      return <Card title={channelLabels[channel.code]} key={channel.code}><div className="space-y-4">
        <Toggle label="Includi nella distribuzione" checked={channel.enabled} onChange={(enabled) => change({ enabled })} />
        <TextField label="Titolo annuncio" value={channel.title} onChange={(title) => change({ title })} />
        <TextField label="Descrizione italiana" value={channel.descriptionIt} onChange={(descriptionIt) => change({ descriptionIt })} multiline />
        <TextField label="Descrizione inglese" value={channel.descriptionEn} onChange={(descriptionEn) => change({ descriptionEn })} multiline />
        <NumberField label="Costo effettivo del canale (% sul lordo)" value={channel.commission} max={99} onChange={(commission) => change({ commission })} />
        <NumberField label="Promozione complessiva applicabile (%)" value={channel.promotion} max={99} onChange={(promotion) => change({ promotion: promotion ?? 0 })} />
        <p className="text-xs leading-5 text-slate-400">Inserisci l’effetto combinato verificato delle promozioni. Il listino viene ricostruito per mantenere il ricavo dopo canale: la promozione non abbassa ulteriormente il prezzo finale consigliato.</p>
        <Toggle label="Commissioni, condizioni e cumulabilità verificate sul portale" checked={channel.promotionsVerified} onChange={(promotionsVerified) => change({ promotionsVerified })} />
        <TextField label="Link annuncio pubblicato" type="url" value={channel.url} onChange={(url) => change({ url })} />
        <Toggle label="Ho verificato l’annuncio pubblicato sul portale" checked={channel.published} onChange={(published) => change({ published })} />
      </div></Card>;
    })}</div>
  </div>;
}
export function ResultsPanel({ config, update, data }: Props) {
  return <div className="grid gap-5 lg:grid-cols-2"><Card title="Verifiche dopo il lancio"><p className="mb-5 text-sm leading-6 text-slate-400">Registra prenotazioni, prezzo medio, netto, recensioni e decisione. I controlli sono manuali: nessun risultato o dato di mercato viene inventato.</p><div className="space-y-5">
    {config.reviews.map((review, i) => { const change = (patch: Partial<typeof review>) => update({ reviews: config.reviews.map((item, index) => index === i ? { ...item, ...patch } : item) }); return <div key={review.day}>
      <Toggle label={`Controllo giorno ${review.day}${config.launchStart ? ` · ${addDays(config.launchStart, review.day)}` : " · definire inizio"}`} checked={review.done} onChange={(done) => change({ done })} />
      <TextField label="Risultati e decisione" value={review.note} onChange={(note) => change({ note })} multiline />
    </div>; })}
  </div></Card><Card title="Storico configurazioni"><div className="space-y-4">{data.history.map((item) => <div key={item.id} className="border-b border-white/10 pb-3 text-sm"><p>{item.description}</p><p className="mt-1 text-xs text-slate-400">{item.actor} · {new Date(item.date).toLocaleString("it-IT", { timeZone: "Europe/Rome" })}</p></div>)}{!data.history.length && <p className="text-sm text-slate-400">Lo storico inizia al primo salvataggio.</p>}</div></Card></div>;
}
