import Link from "next/link";

import {
  ArrowRight,
  Building2,
  CalendarArrowDown,
  CalendarArrowUp,
  ChartNoAxesCombined,
  CircleCheck,
  DoorClosed,
  Plus,
} from "lucide-react";

import {
  AppShell,
} from "@/components/AppShell";

import {
  getPropertiesPageData,
} from "@/lib/properties/get-properties-page-data";

export default async function Home() {
  const properties =
    await getPropertiesPageData({
      sort: "name-asc",
    });

  const now =
    new Date();

  const startOfToday =
    new Date(now);

  startOfToday.setHours(
    0,
    0,
    0,
    0,
  );

  const endOfToday =
    new Date(now);

  endOfToday.setHours(
    23,
    59,
    59,
    999,
  );

  return (
    <AppShell
      title="Le tue strutture"
      subtitle="Stato operativo e movimenti di giornata del portfolio Horizon."
    >
      <div className="mb-8 flex justify-end border-b border-slate-200 pb-6">

        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <Link
            href="/properties/new"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-semibold !text-[#2563EB] shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
          >
            <Plus size={18} />
            Nuova struttura
          </Link>

          <Link
            href="/performance"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#2563EB] bg-[#2563EB] px-5 text-[13px] font-semibold !text-white shadow-[0_6px_16px_rgba(37,99,235,0.18)] transition hover:border-[#1D4ED8] hover:bg-[#1D4ED8]"
          >
            <ChartNoAxesCombined size={18} />
            Performance giornaliera
          </Link>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.045)]">
        <div className="overflow-x-auto">
          <div className="min-w-[1120px]">

            <div className="grid grid-cols-[minmax(320px,1.8fr)_150px_135px_135px_150px_150px_70px] items-center border-b border-slate-200 bg-[#F8FAFC] px-6 py-3.5 text-[9px] font-bold uppercase tracking-[0.11em] text-slate-500">
              <span>
                Struttura
              </span>

              <span>
                Stato
              </span>

              <span>
                Arrivi oggi
              </span>

              <span>
                Partenze oggi
              </span>

              <span>
                Check-in
              </span>

              <span>
                Check-out
              </span>

              <span className="text-right">
                Apri
              </span>
            </div>

            {properties.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Building2
                    size={21}
                  />
                </span>

                <h2 className="mt-3 text-sm font-bold text-slate-900">
                  Nessuna struttura presente
                </h2>

                <p className="mt-1 text-[10px] text-slate-500">
                  Le strutture aggiunte a Horizon compariranno qui.
                </p>
              </div>
            ) : (
              properties.map(
                (
                  property,
                  index,
                ) => {
                  const validBookings =
                    property.bookings.filter(
                      (booking) =>
                        booking.bookingStatus !==
                        "CANCELLED",
                    );

                  const arrivalsToday =
                    validBookings.filter(
                      (booking) =>
                        booking.checkIn >=
                          startOfToday &&
                        booking.checkIn <=
                          endOfToday,
                    );

                  const departuresToday =
                    validBookings.filter(
                      (booking) =>
                        booking.checkOut >=
                          startOfToday &&
                        booking.checkOut <=
                          endOfToday,
                    );

                  const closedToday =
                    property.availabilityBlocks.some(
                      (block) =>
                        block.startDate <=
                          endOfToday &&
                        block.endDate >=
                          startOfToday,
                    );

                  return (
                    <article
                      key={property.id}
                      className={[
                        "group grid grid-cols-[minmax(320px,1.8fr)_150px_135px_135px_150px_150px_70px] items-center px-6 py-[18px] transition-colors duration-150 hover:bg-[#F8FBFF]",
                        index <
                        properties.length -
                          1
                          ? "border-b border-slate-100"
                          : "",
                      ].join(
                        " ",
                      )}
                    >
                      <PropertyIdentity
                        id={property.id}
                        name={
                          property.name
                        }
                        address={
                          property.address
                        }
                        city={
                          property.city
                        }
                        zone={
                          property.zone
                        }
                      />

                      <PropertyAvailability
                        status={
                          property.status
                        }
                        closedToday={
                          closedToday
                        }
                      />

                      <MovementCount
                        count={
                          arrivalsToday.length
                        }
                        type="arrival"
                      />

                      <MovementCount
                        count={
                          departuresToday.length
                        }
                        type="departure"
                      />

                      <BookingAction
                        propertyId={
                          property.id
                        }
                        type="checkin"
                        bookings={
                          arrivalsToday
                        }
                      />

                      <BookingAction
                        propertyId={
                          property.id
                        }
                        type="checkout"
                        bookings={
                          departuresToday
                        }
                      />

                      <div className="flex justify-end">
                        <Link
                          href={`/properties/${property.id}`}
                          aria-label={`Apri ${property.name}`}
                          className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-slate-200 bg-white text-slate-500 shadow-sm transition group-hover:border-blue-200 group-hover:text-blue-600 hover:!border-blue-600 hover:!bg-blue-600 hover:!text-white"
                        >
                          <ArrowRight
                            size={15}
                          />
                        </Link>
                      </div>
                    </article>
                  );
                },
              )
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-2.5">
          <p className="text-[9px] leading-4 text-slate-400">
            Ogni riga rappresenta una singola struttura.
            Arrivi, partenze e prenotazioni sono calcolati
            esclusivamente sui dati dell&apos;immobile corrispondente.
          </p>
        </div>
      </section>
    </AppShell>
  );
}

function PropertyIdentity({
  id,
  name,
  address,
  city,
  zone,
}: {
  id: string;
  name: string;
  address: string;
  city: string;
  zone: string | null;
}) {
  const location = [
    address,
    zone,
    city,
  ]
    .filter(Boolean)
    .join(" Â· ");

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600">
          <Building2
            size={18}
          />
        </span>

        <div className="min-w-0">
          <Link
            href={`/properties/${id}`}
            className="block truncate text-sm font-bold tracking-tight text-slate-900 transition hover:text-blue-700"
          >
            {name}
          </Link>

          <p className="mt-1 truncate text-[10px] font-medium text-slate-500">
            {location}
          </p>
        </div>
      </div>
    </div>
  );
}

function PropertyAvailability({
  status,
  closedToday,
}: {
  status: string;
  closedToday: boolean;
}) {
  if (
    status !== "ACTIVE"
  ) {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[9px] font-semibold text-slate-500">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />

        {formatStatus(
          status,
        )}
      </span>
    );
  }

  if (closedToday) {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[9px] font-semibold text-rose-700">
        <DoorClosed
          size={11}
        />

        Chiusa oggi
      </span>
    );
  }

  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[9px] font-semibold text-emerald-700">
      <CircleCheck
        size={11}
      />

      Prenotabile
    </span>
  );
}

function MovementCount({
  count,
  type,
}: {
  count: number;
  type:
    | "arrival"
    | "departure";
}) {
  const arrival =
    type === "arrival";

  return (
    <div>
      <p
        className={[
          "text-base font-bold tracking-tight",
          count > 0
            ? arrival
              ? "text-blue-600"
              : "text-emerald-600"
            : "text-slate-300",
        ].join(
          " ",
        )}
      >
        {count}
      </p>

      <p className="mt-0.5 text-[8px] font-medium text-slate-400">
        {count === 1
          ? arrival
            ? "arrivo"
            : "partenza"
          : arrival
            ? "arrivi"
            : "partenze"}
      </p>
    </div>
  );
}

type TodayBooking = {
  id: string;
  guestName: string;
};

function BookingAction({
  propertyId,
  type,
  bookings,
}: {
  propertyId: string;
  type:
    | "checkin"
    | "checkout";
  bookings: TodayBooking[];
}) {
  const isCheckIn =
    type === "checkin";

  const count =
    bookings.length;

  const href =
    count === 1
      ? `/bookings/${bookings[0].id}`
      : `/bookings?propertyId=${encodeURIComponent(
          propertyId,
        )}&day=today&type=${type}`;

  return (
    <Link
      href={href}
      className={[
        "inline-flex w-fit min-w-[106px] items-center justify-center gap-2 rounded-xl border px-3 py-2 text-[9px] font-bold transition",
        isCheckIn
          ? "border-emerald-200 bg-emerald-50/80 !text-emerald-700 hover:border-emerald-400 hover:bg-emerald-100"
          : "border-red-200 bg-red-50/80 !text-red-700 hover:border-red-400 hover:bg-red-100",
      ].join(
        " ",
      )}
    >
      {isCheckIn ? (
        <CalendarArrowDown
          size={12}
        />
      ) : (
        <CalendarArrowUp
          size={12}
        />
      )}

      {count}{" "}
      {isCheckIn
        ? "Check-in"
        : "Check-out"}
    </Link>
  );
}

function formatStatus(
  status: string,
) {
  return status
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part
          .charAt(0)
          .toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}









