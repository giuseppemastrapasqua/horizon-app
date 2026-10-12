import {
  BackgroundJobStatus,
  BookingChannel,
  IntegrationTransport,
  type IntegrationProvider,
  type Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

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
      "Importa le prenotazioni dal calendario iCal esportato da Booking.com.",
    synchronizationAvailable: true,
  },
  {
    value: "AIRBNB",
    label: "Airbnb",
    description:
      "Importa le prenotazioni dal calendario iCal esportato da Airbnb.",
    synchronizationAvailable: true,
  },
  {
    value: "VRBO",
    label: "VRBO",
    description:
      "Collega il listing VRBO all'immobile Horizon.",
    synchronizationAvailable: false,
  },
  {
    value: "SOGGIORNIAMO",
    label: "Soggiorniamo",
    description:
      "Configura il collegamento per la trasmissione dei flussi turistici.",
    synchronizationAvailable: false,
  },
  {
    value: "STRIPE",
    label: "Stripe",
    description:
      "Collega il riferimento di pagamento associato all'immobile.",
    synchronizationAvailable: false,
  },
];

export async function PropertyIntegrationsSection({
  propertyId,
  mappings,
  updateAction,
  synchronizeAction,
}: PropertyIntegrationsSectionProps) {
  const mappingsByProvider =
    new Map(
      mappings.map((mapping) => [
        mapping.provider,
        mapping,
      ]),
    );

  const bookingIcal = await loadIcal(
    propertyId,
    BookingChannel.BOOKING,
  );
  const airbnbIcal = await loadIcal(
    propertyId,
    BookingChannel.AIRBNB,
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
              Collega la struttura ai servizi esterni utilizzati da Horizon.
              Booking.com e Airbnb utilizzano il calendario iCal per
              importare le prenotazioni.
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

          const isBooking =
            provider.value ===
            "BOOKING_COM";
          const isAirbnb =
            provider.value ===
            "AIRBNB";
          const isIcalProvider =
            isBooking || isAirbnb;
          const ical = isBooking
            ? bookingIcal
            : isAirbnb
              ? airbnbIcal
              : null;

          const connected =
            isIcalProvider
              ? Boolean(
                  mapping &&
                    ical?.feedUrl,
                )
              : Boolean(mapping);

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
                      connected
                        ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700"
                        : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                    }
                  >
                    {connected
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

                {isIcalProvider ? (
                  <div className="mt-5">
                    <label
                      htmlFor={`ical-feed-url-${provider.value}`}
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      URL calendario {provider.label}
                    </label>

                    <input
                      id={`ical-feed-url-${provider.value}`}
                      name="feedUrl"
                      type="url"
                      required
                      defaultValue={
                        ical?.feedUrl ??
                        ""
                      }
                      placeholder="https://...calendar.ics"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10"
                    />

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Incolla l&apos;URL iCal esportato dal calendario della struttura su {provider.label}.
                    </p>
                  </div>
                ) : null}

                {mapping ? (
                  <p className="mt-3 text-xs text-slate-500">
                    Ultimo aggiornamento:{" "}
                    {mapping.updatedAt.toLocaleString(
                      "it-IT",
                    )}
                  </p>
                ) : null}

                {isIcalProvider &&
                ical?.activeSyncStatus ? (
                  <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
                    {ical.activeSyncStatus ===
                    BackgroundJobStatus.RUNNING
                      ? "Sincronizzazione in corso"
                      : "Sincronizzazione in coda"}
                  </div>
                ) : null}

                {isIcalProvider &&
                ical?.lastSyncAt ? (
                  <div className="mt-3 text-xs leading-5 text-slate-500">
                    <p>
                      Ultima sincronizzazione:{" "}
                      {ical.lastSyncAt.toLocaleString(
                        "it-IT",
                      )}
                    </p>

                    <p>
                      Stato:{" "}
                      {ical.lastSyncStatus ??
                        "—"}
                    </p>

                    {ical.lastSyncError ? (
                      <p className="text-red-600">
                        {ical.lastSyncError}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    {connected
                      ? "Aggiorna collegamento"
                      : "Salva collegamento"}
                  </button>
                </div>
              </form>

              {connected &&
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

async function loadIcal(
  propertyId: string,
  channel: BookingChannel,
): Promise<{
  feedUrl: string;
  lastSyncAt: Date | null;
  lastSyncStatus: string | null;
  lastSyncError: string | null;
  activeSyncStatus: BackgroundJobStatus | null;
} | null> {
  const connections =
    await prisma.integrationConnectionProperty.findMany({
      where: {
        propertyId,
        connection: {
          connectorKey: "ical",
          transport:
            IntegrationTransport.ICAL,
        },
      },
      select: {
        connectionId: true,
        config: true,
        connection: {
          select: {
            lastSyncAt: true,
            lastSyncStatus: true,
            lastSyncError: true,
          },
        },
      },
    });

  const matching =
    connections.find(
      (item) =>
        getJsonString(
          item.config,
          "channel",
        ) === channel,
    );

  if (!matching) {
    return null;
  }

  const feedUrl =
    getJsonString(
      matching.config,
      "feedUrl",
    );

  if (!feedUrl) {
    return null;
  }

  const activeSyncJob =
    await prisma.backgroundJob.findFirst({
      where: {
        type: "BOOKING_SYNC",
        status: {
          in: [
            BackgroundJobStatus.QUEUED,
            BackgroundJobStatus.RUNNING,
          ],
        },
        AND: [
          {
            payload: {
              path: ["propertyId"],
              equals: propertyId,
            },
          },
          {
            payload: {
              path: ["connectionId"],
              equals: matching.connectionId,
            },
          },
        ],
      },
      select: {
        status: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  return {
    feedUrl,
    lastSyncAt:
      matching.connection.lastSyncAt,
    lastSyncStatus:
      matching.connection.lastSyncStatus,
    lastSyncError:
      matching.connection.lastSyncError,
    activeSyncStatus:
      activeSyncJob?.status ?? null,
  };
}

function getJsonString(
  value: Prisma.JsonValue | null,
  key: string,
): string | undefined {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return undefined;
  }

  const property =
    value[key];

  return typeof property === "string"
    ? property
    : undefined;
}
