import { channelLabels, type ActivationConfig } from "@/lib/activation/config";
import type { ActivationPrice } from "@/lib/activation/pricing";
import { Card, euro, Toggle } from "./controls";

export function RevenueOverview({ config, rows, update }: { config: ActivationConfig; rows: ActivationPrice[]; update: (patch: Partial<ActivationConfig>) => void }) {
  const first = rows.find((row) => row.actionable);
  return <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
    <Card title="Prezzi consigliati per canale"><p className="mb-4 text-xs text-slate-400">Prima data libera nel periodo: {first?.date ?? "nessuna"} · prezzi finali</p><div className="space-y-3">
      {config.channels.filter((channel) => channel.enabled).map((channel) => <div key={channel.code} className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 text-sm"><span>{channelLabels[channel.code]}</span><span>{euro(first?.prices.find((price) => price.code === channel.code)?.final)}</span><span className={`text-xs ${channel.promotionsVerified && channel.commission !== null ? "text-emerald-300" : "text-amber-200"}`}>{channel.promotionsVerified && channel.commission !== null ? "Proposta interna" : "Da verificare"}</span></div>)}
    </div></Card>
    <Card title="Prossime attività"><div className="space-y-4">{config.tasks.filter((task) => !task.done).slice(0, 4).map((task) => <Toggle key={task.id} label={`${task.title}${task.owner ? ` · ${task.owner}` : ""}${task.due ? ` · ${task.due}` : ""}`} checked={task.done} onChange={(done) => update({ tasks: config.tasks.map((item) => item.id === task.id ? { ...item, done } : item) })} />)}{config.tasks.every((task) => task.done) && <p className="text-sm text-emerald-300">Nessuna attività aperta.</p>}</div></Card>
  </div>;
}
