import Link from "next/link";

import {
  ArrowRight,
  CalendarPlus,
} from "lucide-react";

import {
  StatusBadge,
} from "@/components/ui/StatusBadge";

import {
  formatCurrency,
} from "@/lib/format/currency";

import {
  formatDate,
} from "@/lib/format/date";

export type PropertyBookingItem = {
  id: string;
  guestName: string;
  channel: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: number;
  grossAmount: number;
  bookingStatus: string;
  operationalStatus: string;
};

type PropertyBookingsProps = {
  propertyId: string;
  bookings: PropertyBookingItem[];
};

export function PropertyBookings({
  propertyId,
  bookings,
}: PropertyBookingsProps) {
  return (
    <section className="h-full rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-blue-600">
            Prenotazioni
          </p>

          <h2 className="mt-1 text-base font-bold tracking-tight text-slate-900">
            Prenotazioni recenti
          </h2>

          <p className="mt-1 text-[10px] text-slate-500">
            Soggiorni, importi e stato operativo.
          </p>
        </div>

        <Link
          href={`/bookings/new?propertyId=${propertyId}`}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-[10px] font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <CalendarPlus size={13} />

          Nuova prenotazione
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/40 p-5 text-center">
          <p className="text-xs font-semibold text-slate-700">
            Nessuna prenotazione registrata
          </p>

          <p className="mt-1 text-[10px] text-slate-500">
            Le prenotazioni dell&apos;immobile compariranno qui.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {bookings.map(
            (booking) => (
              <article
                key={booking.id}
                className="rounded-xl border border-slate-200 bg-slate-50/45 p-3 transition hover:border-blue-200 hover:bg-blue-50/25"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/bookings/${booking.id}`}
                      className="text-xs font-bold text-slate-900 transition hover:text-blue-700"
                    >
                      {booking.guestName}
                    </Link>

                    <p className="mt-1 text-[9px] font-medium text-slate-400">
                      {formatDate(
                        booking.checkIn,
                      )}{" "}
                      →{" "}
                      {formatDate(
                        booking.checkOut,
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <StatusBadge
                      label={booking.channel}
                      tone="blue"
                      compact
                    />

                    <StatusBadge
                      label={booking.bookingStatus}
                      compact
                    />

                    <StatusBadge
                      label={booking.operationalStatus}
                      compact
                    />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-200 pt-3 sm:grid-cols-5">
                  <Metric
                    label="Importo"
                    value={formatCurrency(
                      booking.grossAmount,
                    )}
                  />

                  <Metric
                    label="Notti"
                    value={booking.nights}
                  />

                  <Metric
                    label="Ospiti"
                    value={booking.guests}
                  />

                  <Metric
                    label="Check-in"
                    value={booking.checkIn.toLocaleDateString(
                      "it-IT",
                    )}
                  />

                  <Metric
                    label="Check-out"
                    value={booking.checkOut.toLocaleDateString(
                      "it-IT",
                    )}
                  />
                </div>

                <div className="mt-3 border-t border-slate-200 pt-2.5">
                  <Link
                    href={`/bookings/${booking.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-white px-2.5 py-1.5 text-[9px] font-semibold text-blue-700 transition hover:bg-blue-50"
                  >
                    Apri prenotazione

                    <ArrowRight size={11} />
                  </Link>
                </div>
              </article>
            ),
          )}
        </div>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-[8px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-[10px] font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

