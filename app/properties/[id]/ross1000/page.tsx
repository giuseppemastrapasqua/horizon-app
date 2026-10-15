import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Navigation } from "@/components/Navigation";
import { requirePropertyRole, requireRoles } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { prepareRoss1000Action, sendRoss1000Action } from "./actions";

export default async function Ross1000Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRoles(["SUPER_ADMIN", "MANAGER"]);
  const { id } = await params;
  await requirePropertyRole(id, ["MANAGER"]);
  const transmissions = await prisma.ross1000Transmission.findMany({
    where: { propertyId: id },
    orderBy: [{ movementDate: "desc" }, { createdAt: "desc" }],
    take: 50,
    select: { id: true, movementDate: true, status: true, lastError: true },
  });
  const enabled = process.env.HORIZON_ROSS1000_SEND_ENABLED === "true";
  return (
    <>
      <Navigation />
      <AppShell
        title="Movimenti ROSS1000"
        subtitle="Prepara e controlla il flusso giornaliero prima dell'invio."
      >
        <Link href={`/properties/${id}/edit`}>← Configurazione struttura</Link>
        <form
          action={prepareRoss1000Action}
          className="my-6 flex flex-wrap items-end gap-4 rounded-2xl border border-white/10 p-5"
        >
          <input type="hidden" name="propertyId" value={id} />
          <label>
            Giorno movimento
            <input
              required
              name="movementDate"
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              className="mt-2 block rounded-lg bg-[#152330] p-3"
            />
          </label>
          <button className="rounded-lg border border-white/20 px-4 py-3">
            Prepara flusso
          </button>
        </form>
        {!enabled && (
          <p className="mb-5 text-sm text-white/60">
            Invio sospeso: è disponibile la preparazione del flusso.
          </p>
        )}
        <div className="space-y-3">
          {transmissions.map((transmission) => (
            <section
              key={transmission.id}
              className="rounded-xl border border-white/10 p-5"
            >
              <div className="flex flex-wrap justify-between gap-3">
                <p>
                  {transmission.movementDate.toLocaleDateString("it-IT", {
                    timeZone: "UTC",
                  })}{" "}
                  · {transmission.status}
                </p>
                {enabled && transmission.status === "PREPARED" && (
                  <form action={sendRoss1000Action}>
                    <input type="hidden" name="propertyId" value={id} />
                    <input
                      type="hidden"
                      name="transmissionId"
                      value={transmission.id}
                    />
                    <button className="text-[#D8B367]">Accoda invio</button>
                  </form>
                )}
              </div>
              {transmission.lastError && (
                <p className="mt-2 text-sm text-white/60">
                  {transmission.lastError}
                </p>
              )}
              {transmission.status === "OUTCOME_UNKNOWN" && (
                <p className="mt-2 text-sm">
                  Verifica l&apos;esito sul portale regionale prima di un nuovo
                  invio.
                </p>
              )}
            </section>
          ))}
          {!transmissions.length && <p>Nessun flusso preparato.</p>}
        </div>
      </AppShell>
    </>
  );
}
