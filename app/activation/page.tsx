import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Navigation } from "@/components/Navigation";
import { getAccessiblePropertyIds, requireRoles } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { activationSchema, readiness } from "@/lib/activation/config";

export default async function ActivationIndex() {
  await requireRoles(["SUPER_ADMIN", "MANAGER"]);
  const ids = await getAccessiblePropertyIds();
  const properties = await prisma.property.findMany({ where: ids === null ? { status: { not: "ARCHIVED" } } : { id: { in: ids }, status: { not: "ARCHIVED" } },
    orderBy: { name: "asc" }, select: { id: true, name: true, city: true, activation: { select: { config: true, updatedAt: true } } } });
  return <><Navigation /><AppShell title="Attivazione alloggi" subtitle="Dalla preparazione al lancio: strategia, annunci e controllo economico in un unico spazio.">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{properties.map((property) => {
      const config = property.activation ? activationSchema.safeParse(property.activation.config) : null;
      const missing = config?.success ? readiness(config.data) : null;
      const task = config?.success ? config.data.tasks.find((item) => !item.done) : null;
      return <Link href={`/activation/${property.id}`} key={property.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 transition hover:border-[#D8B367]/60">
        <p className="text-xs uppercase tracking-widest text-[#D8B367]">{!missing ? "Da preparare" : missing.length ? "In preparazione" : "Pronto alla verifica finale"}</p>
        <h2 className="mt-3 font-serif text-2xl">{property.name}</h2><p className="mt-1 text-sm text-slate-400">{property.city}</p>
        <p className="mt-5 text-sm">{task ? task.title : missing?.[0] ?? "Apri scheda e configura la strategia"}</p>
        {task && <p className="mt-2 text-xs text-slate-400">{task.owner || "Responsabile da assegnare"} · {task.due || "Scadenza da definire"}</p>}
        <p className="mt-5 text-sm text-[#D8B367]">Apri attivazione →</p>
      </Link>;
    })}</div>
    {!properties.length && <p>Nessun alloggio disponibile. Crea o assegna un immobile per iniziare.</p>}
  </AppShell></>;
}
