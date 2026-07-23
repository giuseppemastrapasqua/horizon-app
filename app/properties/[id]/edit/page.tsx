import { notFound } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { AppShell } from "@/components/AppShell";
import { ActionButton } from "@/components/ui/ActionButton";
import { WorkspaceTopBar } from "@/components/ui/WorkspaceTopBar";
import { getPropertyWorkspace } from "@/lib/properties/get-property-workspace";
import { updatePropertyAction } from "./actions";

type PropertyEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const revenueAiCapabilities = [
  "Dynamic pricing",
  "Rilevamento eventi",
  "Analisi dei competitor",
  "Previsione dell'occupazione",
  "Sconti automatici",
  "Ottimizzazione del soggiorno minimo",
];

export default async function PropertyEditPage({
  params,
}: PropertyEditPageProps) {
  const { id } = await params;

  const workspace = await getPropertyWorkspace(id);

  if (!workspace) {
    notFound();
  }

  const { property } = workspace;

  return (
    <>
      <Navigation />

      <AppShell
        title={`Scheda immobile · ${property.name}`}
        subtitle="Gestisci tutte le informazioni operative e pubbliche dell'immobile."
      >
        <div className="mx-auto max-w-6xl space-y-8">
          <WorkspaceTopBar
            backLabel="Torna alla scheda immobile"
            backHref={`/properties/${property.id}`}
            actions={
              <ActionButton
                label="Nuova prenotazione"
                href={`/bookings/new?propertyId=${property.id}`}
                variant="secondary"
              />
            }
          />

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-8 py-10 text-white">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="mb-4 flex flex-wrap gap-3">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-inset ring-white/10">
                      Scheda immobile
                    </span>

                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-200 ring-1 ring-inset ring-emerald-400/20">
                      Configurazione attiva
                    </span>
                  </div>

                  <h1 className="text-4xl font-bold tracking-tight">
                    {property.name}
                  </h1>

                  <p className="mt-3 text-slate-300">
                    {property.address}
                  </p>
                </div>

                <div className="max-w-md rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
                    Revenue Engine
                  </p>

                  <p className="mt-2 text-lg font-semibold">
                    Prezzo gestito dall&apos;AI
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Horizon ottimizzerà automaticamente la tariffa
                    considerando domanda, eventi, stagionalità e
                    performance dell&apos;immobile.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 border-t border-slate-200 bg-slate-50 p-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Stato
                </p>

                <p className="mt-2 font-semibold text-emerald-600">
                  Attivo
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Marketplace
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  In preparazione
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Revenue AI
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  Automatico
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Configurazione
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  Dati principali
                </p>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-950">
                Configurazione immobile
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Completa progressivamente tutte le aree necessarie alla
                gestione e alla futura pubblicazione.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <a
                href="#informazioni"
                className="rounded-2xl border border-slate-950 bg-slate-950 p-5 text-white shadow-sm transition hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg">
                    01
                  </span>

                  <span className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-xs font-medium text-emerald-200">
                    Attiva
                  </span>
                </div>

                <p className="mt-6 font-semibold">
                  Informazioni
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-300">
                  Dati pubblici e operativi.
                </p>
              </a>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-600">
                    02
                  </span>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                    Prossimamente
                  </span>
                </div>

                <p className="mt-6 font-semibold text-slate-900">
                  Foto
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Galleria e copertina.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-600">
                    03
                  </span>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                    Prossimamente
                  </span>
                </div>

                <p className="mt-6 font-semibold text-slate-900">
                  Servizi
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Dotazioni e caratteristiche.
                </p>
              </div>

              <a
                href="#revenue-ai"
                className="rounded-2xl border border-violet-200 bg-violet-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-sm font-semibold text-violet-700">
                    AI
                  </span>

                  <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700">
                    Automatico
                  </span>
                </div>

                <p className="mt-6 font-semibold text-slate-900">
                  Revenue AI
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Prezzi ottimizzati da Horizon.
                </p>
              </a>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-600">
                    05
                  </span>

                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                    In preparazione
                  </span>
                </div>

                <p className="mt-6 font-semibold text-slate-900">
                  Marketplace
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Pubblicazione e visibilità.
                </p>
              </div>
            </div>
          </section>

          <section
            id="informazioni"
            className="scroll-mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
          >
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white">
                  01
                </span>

                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    Informazioni generali
                  </h2>

                  <p className="mt-1 text-sm text-slate-600">
                    Identità, contenuti pubblici e dati operativi.
                  </p>
                </div>
              </div>
            </div>

            <form
              action={updatePropertyAction}
              className="space-y-8"
            >
              <input
                type="hidden"
                name="propertyId"
                value={property.id}
              />

              <div className="grid gap-6">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Nome immobile
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    defaultValue={property.name}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="address"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Indirizzo
                  </label>

                  <input
                    id="address"
                    name="address"
                    type="text"
                    required
                    defaultValue={property.address}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Descrizione pubblica
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    rows={8}
                    defaultValue={property.description ?? ""}
                    className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  />

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Questo contenuto potrà essere ottimizzato
                    automaticamente dall&apos;AI per il marketplace.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="text-lg font-semibold text-slate-900">
                  Operatività
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Informazioni utilizzate internamente dal gestionale
                  Horizon e non mostrate agli ospiti.
                </p>

                <div className="mt-6">
                  <label
                    htmlFor="cleaningCost"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Costo pulizia per prenotazione (€)
                  </label>

                  <input
                    id="cleaningCost"
                    name="cleaningCost"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    defaultValue={Number(property.cleaningCost)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  />
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-200 pt-6">
                <button
                  type="submit"
                  className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
                >
                  Salva modifiche
                </button>
              </div>
            </form>
          </section>

          <section
            id="revenue-ai"
            className="scroll-mt-8 overflow-hidden rounded-3xl border border-violet-200 bg-white shadow-sm"
          >
            <div className="border-b border-violet-100 bg-gradient-to-br from-violet-950 via-violet-900 to-slate-950 px-8 py-8 text-white">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold ring-1 ring-inset ring-white/10">
                      AI
                    </span>

                    <div>
                      <h2 className="text-2xl font-semibold">
                        Revenue AI
                      </h2>

                      <p className="mt-1 text-sm text-violet-200">
                        Il motore intelligente per la gestione dei prezzi.
                      </p>
                    </div>
                  </div>

                  <p className="mt-6 max-w-2xl text-sm leading-6 text-slate-300">
                    Horizon analizzerà mercato, domanda, stagionalità,
                    eventi e andamento delle prenotazioni per determinare
                    automaticamente la tariffa più efficace.
                  </p>
                </div>

                <span className="w-fit rounded-full bg-amber-300/15 px-3 py-1.5 text-xs font-medium text-amber-200 ring-1 ring-inset ring-amber-200/20">
                  In sviluppo
                </span>
              </div>
            </div>

            <div className="grid gap-8 p-8 lg:grid-cols-[1fr_320px]">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Funzionalità previste
                </h3>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {revenueAiCapabilities.map((capability) => (
                    <div
                      key={capability}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                        ✓
                      </span>

                      <span className="text-sm font-medium text-slate-800">
                        {capability}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="rounded-2xl border border-violet-200 bg-violet-50 p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">
                  Controllo umano
                </p>

                <h3 className="mt-3 text-lg font-semibold text-slate-950">
                  Automazione trasparente
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Ogni decisione dell&apos;AI sarà accompagnata da una
                  motivazione chiara. Il gestore potrà consultare le
                  variazioni e mantenere il controllo finale.
                </p>

                <div className="mt-6 rounded-xl border border-violet-200 bg-white p-4">
                  <p className="text-xs text-slate-500">
                    Stato attuale
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    Motore non ancora collegato
                  </p>
                </div>
              </aside>
            </div>
          </section>
        </div>
      </AppShell>
    </>
  );
}