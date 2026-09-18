import {
  BookingChannel,
} from "@prisma/client";

import {
  buildIcalExportUrl,
} from "@/lib/integrations/ical-export/security";

import {
  IcalExportCopyButton,
} from "./IcalExportCopyButton";

type Props = {
  propertyId: string;
};

const DESTINATIONS = [
  {
    channel:
      BookingChannel.BOOKING,
    label:
      "Booking.com",
  },
  {
    channel:
      BookingChannel.AIRBNB,
    label:
      "Airbnb",
  },
  {
    channel:
      BookingChannel.VRBO,
    label:
      "Vrbo",
  },
] as const;

export function PropertyIcalExportSection({
  propertyId,
}: Props) {
  const feeds =
    DESTINATIONS.map(
      (destination) => ({
        ...destination,

        url:
          buildIcalExportUrl({
            propertyId,
            destination:
              destination.channel,
          }),
      }),
    );

  return (
    <section
      id="ical-export"
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="border-b border-slate-100 px-8 py-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
          Calendari
        </p>

        <h2 className="mt-2 text-xl font-semibold text-slate-950">
          Export iCal Horizon
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Usa il link specifico del portale.
          Horizon esclude automaticamente
          dal feed le prenotazioni provenienti
          dallo stesso portale, evitando il
          rimbalzo del calendario.
        </p>
      </div>

      <div className="space-y-4 px-8 py-7">
        {feeds.map(
          (feed) => (
            <div
              key={feed.channel}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Horizon → {feed.label}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Prenotazioni degli altri canali
                    + blocchi disponibilità.
                  </p>
                </div>

                <IcalExportCopyButton
                  url={feed.url}
                />
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="truncate font-mono text-[11px] text-slate-600">
                  {feed.url}
                </p>
              </div>
            </div>
          ),
        )}
      </div>
    </section>
  );
}
