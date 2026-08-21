import type { IntegrationProvider } from "@prisma/client";

type IntegrationMapping = {
  id: string;
  provider: IntegrationProvider;
  externalPropertyId: string;
  createdAt: Date;
  updatedAt: Date;
};

type PropertyIntegrationsSectionProps = {
  propertyId: string;
  mappings: IntegrationMapping[];
  updateAction: (
    formData: FormData,
  ) => Promise<void>;
  synchronizeAction: (
    formData: FormData,
  ) => Promise<void>;
};

const PROVIDERS: Array<{
  value: IntegrationProvider;
  label: string;
  description: string;
  synchronizationAvailable: boolean;
}> = [
  {
    value: "BOOKING_COM",
    label: "Booking.com",
    description:
      "Collega il listing Booking.com all’immobile Horizon.",
    synchronizationAvailable: true,
  },
  {
    value: "AIRBNB",
    label: "Airbnb",
    description:
      "Collega il listing Airbnb all’immobile Horizon.",
    synchronizationAvailable: false,
  },
  {
    value: "VRBO",
    label: "VRBO",
    description:
      "Collega il listing VRBO all’immobile Horizon.",
    synchronizationAvailable: false,
  },
  {
    value: "ALLOGGIATI_WEB",
    label: "Alloggiati Web",
    description:
      "Configura il riferimento usato per gli adempimenti di pubblica sicurezza.",
    synchronizationAvailable: false,
  },
  {
    value: "ISTAT",
    label: "ISTAT",
    description:
      "Configura il riferimento per i flussi statistici.",
    synchronizationAvailable: false,
  },
  {
    value: "SOGGIORNIAMO",
    label: "Soggiorniamo",
    description:
      "Configura il riferimento per la trasmissione dei flussi turistici.",
    synchronizationAvailable: false,
  },
  {
    value: "STRIPE",
    label: "Stripe",
    description:
      "Collega il riferimento di pagamento associato all’immobile.",
    synchronizationAvailable: false,
  },
];

export function PropertyIntegrationsSection({
  propertyId,
  mappings,
  updateAction,
  synchronizeAction,
}: PropertyIntegrationsSectionProps) {
  const mappingsByProvider = new Map(
    mappings.map((mapping) => [
      mapping.provider,
      mapping,
    ]),
  );

  return (
    <section
      id="integrazioni"
      className="scroll-mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="border-b border-slate-200 bg-slate-50 px-8 py-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Connessioni esterne
            </p>

            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Integrazioni
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Collega l’immobile Horizon ai provider esterni.
              Gli identificativi salvati verranno usati per
              sincronizzazioni, webhook e adempimenti.
            </p>
          </div>

          <span className="w-fit rounded-full bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700">
            Configurazione manuale
          </span>
        </div>
      </div>

      <div className="grid gap-5 p-8 lg:grid-cols-2">
        {PROVIDERS.map((provider) => {
          const mapping =
            mappingsByProvider.get(
              provider.value,
            );

          return (
            <div
              key={provider.value}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <form
                action={updateAction}
              >
                <input
                  type="hidden"
                  name="propertyId"
                  value={propertyId}
                />

                <input
                  type="hidden"
                  name="provider"
                  value={provider.value}
                />

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-950">
                      {provider.label}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {provider.description}
                    </p>
                  </div>

                  <span
                    className={
                      mapping
                        ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700"
                        : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                    }
                  >
                    {mapping
                      ? "Collegata"
                      : "Non collegata"}
                  </span>
                </div>

                <div className="mt-6">
                  <label
                    htmlFor={`externalPropertyId-${provider.value}`}
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Identificativo esterno
                  </label>

                  <input
                    id={`externalPropertyId-${provider.value}`}
                    name="externalPropertyId"
                    type="text"
                    required
                    defaultValue={
                      mapping?.externalPropertyId ??
                      ""
                    }
                    placeholder={`ID ${provider.label}`}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                {mapping ? (
                  <p className="mt-3 text-xs text-slate-500">
                    Ultimo aggiornamento:{" "}
                    {mapping.updatedAt.toLocaleString(
                      "it-IT",
                    )}
                  </p>
                ) : null}

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    {mapping
                      ? "Aggiorna collegamento"
                      : "Salva collegamento"}
                  </button>
                </div>
              </form>

              {mapping &&
              provider.synchronizationAvailable ? (
                <form
                  action={synchronizeAction}
                  className="mt-4 border-t border-slate-200 pt-4"
                >
                  <input
                    type="hidden"
                    name="propertyId"
                    value={propertyId}
                  />

                  <input
                    type="hidden"
                    name="provider"
                    value={provider.value}
                  />

                  <input
                    type="hidden"
                    name="externalPropertyId"
                    value={
                      mapping.externalPropertyId
                    }
                  />

                  <button
                    type="submit"
                    className="w-full rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    Sincronizza ora
                  </button>
                </form>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
