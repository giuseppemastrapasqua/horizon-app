import { getDashboardFinanceCharts } from "@/lib/finance/get-dashboard-finance-charts";
import { DashboardFinanceCharts } from "@/components/dashboard/DashboardFinanceCharts";
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
  Sparkles,
} from "lucide-react";

import {
  AppShell,
} from "@/components/AppShell";

import {
  requireUser,
} from "@/lib/auth/guards";

import {
  getPropertiesPageData,
} from "@/lib/properties/get-properties-page-data";

import {
  getDashboardIntelligence,
} from "@/lib/intelligence";

export default async function Home() {
  const user = await requireUser();

  if (user.role === "OPERATOR") {
    throw new Error("Accesso non autorizzato.");
  }

  const [
    properties,
    intelligence,
  ] = await Promise.all([
    getPropertiesPageData({
      sort: "name-asc",
    }),
    getDashboardIntelligence(),
  ]);

  const financeCharts =
    await getDashboardFinanceCharts(
      properties.map((property) => ({
        id: property.id,
        name: property.name,
        city: property.city,
        zone: property.zone,
      })),
    );

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

  const portfolioToday =
    properties.reduce(
      (
        totals,
        property,
      ) => {
        const validBookings =
          property.bookings.filter(
            (booking) =>
              booking.bookingStatus !==
              "CANCELLED",
          );

        totals.arrivals +=
          validBookings.filter(
            (booking) =>
              booking.checkIn >=
                startOfToday &&
              booking.checkIn <=
                endOfToday,
          ).length;

        totals.departures +=
          validBookings.filter(
            (booking) =>
              booking.checkOut >=
                startOfToday &&
              booking.checkOut <=
                endOfToday,
          ).length;

        if (
          property.status === "ACTIVE" &&
          !property.availabilityBlocks.some(
            (block) =>
              block.startDate <=
                endOfToday &&
              block.endDate >=
                startOfToday,
          )
        ) {
          totals.available += 1;
        }

        return totals;
      },
      {
        arrivals: 0,
        departures: 0,
        available: 0,
      },
    );

  return (
    <AppShell
      title="Le tue strutture"
      subtitle={"Stato operativo, movimenti di giornata e priorit\u00E0 del portfolio Horizon."}
    >
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6F7E8B]">
            Portfolio overview
          </p>

          <p className="mt-1 text-[13px] text-[#A4AFB8]">
            {"Una vista unica sulle attivit\u00E0 che richiedono attenzione oggi."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/properties/new"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#D8B367]/25 bg-[#D8B367]/[0.06] px-5 text-[12px] font-semibold !text-[#E3C57E] transition hover:border-[#D8B367]/45 hover:bg-[#D8B367]/[0.10]"
          >
            <Plus size={17} />
            Nuova struttura
          </Link>

          <Link
            href="/performance"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#D8B367] bg-[#D8B367] px-5 text-[12px] font-bold !text-[#081018] shadow-[0_10px_30px_rgba(216,179,103,0.15)] transition hover:bg-[#E3C57E]"
          >
            <ChartNoAxesCombined size={17} />
            Performance giornaliera
          </Link>
        </div>
      </div>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Strutture"
          value={properties.length}
          helper="nel portfolio"
          icon="properties"
        />

        <MetricCard
          label="Prenotabili"
          value={portfolioToday.available}
          helper="disponibili oggi"
          icon="available"
        />

        <MetricCard
          label="Arrivi"
          value={portfolioToday.arrivals}
          helper="previsti oggi"
          tone="arrival"
          icon="arrival"
        />

        <MetricCard
          label="Partenze"
          value={portfolioToday.departures}
          helper="previste oggi"
          tone="departure"
          icon="departure"
        />
      </section>

      <DashboardFinanceCharts
        trend={financeCharts.trend}
        channels={financeCharts.channels}
        performance={financeCharts.performance}
      />

      {intelligence.insights.length > 0 ? (
        <section className="mb-6 overflow-hidden rounded-[22px] border border-white/[0.09] bg-[#0B1721] shadow-[0_20px_55px_rgba(0,0,0,0.24)]">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.07] bg-[linear-gradient(135deg,rgba(216,179,103,0.09),transparent_55%)] px-5 py-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles
                  size={14}
                  className="text-[#D8B367]"
                />

                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#D8B367]">
                  Horizon Intelligence
                </p>
              </div>

              <h2 className="mt-1.5 font-serif text-[20px] font-medium tracking-[-0.025em] text-[#FFF8EA]">
                {"Priorit\u00E0 del portfolio"}
              </h2>

              <p className="mt-1 max-w-2xl text-[11px] leading-5 text-[#7F8D99]">
                {"Segnali ordinati per severit\u00E0, impatto economico e rilevanza temporale."}
                {intelligence.portfolio.totalInsights > intelligence.insights.length ? (
                  <>
                    {" "}
                    Mostrate {intelligence.insights.length} {"priorit\u00E0"} su{" "}
                    {intelligence.portfolio.totalInsights} segnalazioni.
                  </>
                ) : null}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <PortfolioBadge
                label={`${intelligence.portfolio.criticalInsights} critici`}
                tone="critical"
              />

              <PortfolioBadge
                label={`${intelligence.portfolio.warnings} attenzioni`}
                tone="warning"
              />

              <PortfolioBadge
                label={`${intelligence.portfolio.opportunities} opportunit\u00E0`}
                tone="opportunity"
              />
            </div>
          </div>

          <div className="grid gap-3 p-3.5 xl:grid-cols-2">
            {intelligence.insights.map((insight) => (
              <article
                key={insight.id}
                className="rounded-2xl border border-white/[0.07] bg-[#0D1A24] p-3.5 transition hover:border-white/[0.13] hover:bg-[#101E29]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={[
                          "rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em]",
                          insight.severity === "CRITICAL"
                            ? "border-rose-400/20 bg-rose-400/10 text-rose-300"
                            : insight.severity === "WARNING"
                              ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
                              : insight.severity === "OPPORTUNITY"
                                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                                : "border-sky-400/20 bg-sky-400/10 text-sky-300",
                        ].join(" ")}
                      >
                        {insight.severity === "CRITICAL"
                          ? "Critico"
                          : insight.severity === "WARNING"
                            ? "Attenzione"
                            : insight.severity === "OPPORTUNITY"
                              ? "Opportunit\u00E0"
                              : "Informazione"}
                      </span>

                      <span className="text-[9px] font-semibold text-[#667582]">
                        {insight.propertyName}
                      </span>
                    </div>

                    <h3 className="mt-2.5 text-[13px] font-semibold text-[#F7F1E7]">
                      {insight.title}
                    </h3>

                    <p className="mt-1 text-[10px] leading-5 text-[#84929E]">
                      {insight.explanation}
                    </p>
                  </div>

                  {insight.action?.href ? (
                    <Link
                      href={insight.action.href}
                      className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-xl border border-[#D8B367]/30 bg-[#D8B367]/10 px-3 text-[9px] font-bold !text-[#E3C57E] transition hover:bg-[#D8B367]/15"
                    >
                      {insight.action.label}
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#09131C] shadow-[0_20px_55px_rgba(0,0,0,0.18)]">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-5">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#D8B367]">
              Portfolio
            </p>

            <h2 className="mt-1 font-serif text-[19px] font-medium text-[#FFF8EA]">
              Stato delle strutture
            </h2>
          </div>

          <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[9px] font-semibold text-[#7F8C98]">
            {properties.length} strutture
          </span>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[1120px]">
            <div className="grid grid-cols-[minmax(320px,1.8fr)_150px_135px_135px_150px_150px_70px] items-center border-b border-white/[0.06] bg-white/[0.02] px-6 py-3.5 text-[9px] font-bold uppercase tracking-[0.11em] text-[#62717E]">
              <span>Struttura</span>
              <span>Stato</span>
              <span>Arrivi oggi</span>
              <span>Partenze oggi</span>
              <span>Check-in</span>
              <span>Check-out</span>
              <span className="text-right">Apri</span>
            </div>

            {properties.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D8B367]/20 bg-[#D8B367]/10 text-[#D8B367]">
                  <Building2 size={21} />
                </span>

                <h2 className="mt-3 text-sm font-bold text-[#FFF8EA]">
                  Nessuna struttura presente
                </h2>

                <p className="mt-1 text-[10px] text-[#70808D]">
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
                        "group grid grid-cols-[minmax(320px,1.8fr)_150px_135px_135px_150px_150px_70px] items-center px-6 py-[18px] transition-colors duration-150 hover:bg-white/[0.025]",
                        index <
                        properties.length -
                          1
                          ? "border-b border-white/[0.055]"
                          : "",
                      ].join(
                        " ",
                      )}
                    >
                      <PropertyIdentity
                        id={property.id}
                        name={property.name}
                        address={property.address}
                        city={property.city}
                        zone={property.zone}
                      />

                      <PropertyAvailability
                        status={property.status}
                        closedToday={closedToday}
                      />

                      <MovementCount
                        count={arrivalsToday.length}
                        type="arrival"
                      />

                      <MovementCount
                        count={departuresToday.length}
                        type="departure"
                      />

                      <BookingAction
                        propertyId={property.id}
                        type="checkin"
                        bookings={arrivalsToday}
                      />

                      <BookingAction
                        propertyId={property.id}
                        type="checkout"
                        bookings={departuresToday}
                      />

                      <div className="flex justify-end">
                        <Link
                          href={`/properties/${property.id}`}
                          aria-label={`Apri ${property.name}`}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-[#82909B] transition hover:!border-[#D8B367]/40 hover:!bg-[#D8B367]/10 hover:!text-[#E3C57E]"
                        >
                          <ArrowRight size={15} />
                        </Link>
                      </div>
                    </article>
                  );
                },
              )
            )}
          </div>
        </div>

        <div className="border-t border-white/[0.06] bg-white/[0.015] px-6 py-3">
          <p className="text-[9px] leading-4 text-[#566673]">
            Ogni riga rappresenta una singola struttura.
            Arrivi, partenze e prenotazioni sono calcolati
            esclusivamente sui dati dell&apos;immobile corrispondente.
          </p>
        </div>
      </section>
    </AppShell>
  );
}

function MetricCard({
  label,
  value,
  helper,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: number;
  helper: string;
  tone?: "neutral" | "arrival" | "departure";
  icon: "properties" | "available" | "arrival" | "departure";
}) {
  const valueClass =
    tone === "arrival"
      ? "text-[#E3C57E]"
      : tone === "departure"
        ? "text-emerald-300"
        : "text-[#FFF8EA]";

  return (
    <article className="rounded-[18px] border border-white/[0.08] bg-[#0B1721] px-5 py-3.5 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
      <div className="flex items-center gap-3">
        <span
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border",
            icon === "properties"
              ? "border-sky-400/15 bg-sky-400/[0.08] text-sky-300"
              : icon === "available"
                ? "border-[#D8B367]/15 bg-[#D8B367]/[0.09] text-[#E3C57E]"
                : icon === "arrival"
                  ? "border-emerald-400/15 bg-emerald-400/[0.09] text-emerald-300"
                  : "border-rose-400/15 bg-rose-400/[0.09] text-rose-300",
          ].join(" ")}
        >
          {icon === "properties" ? (
            <Building2 size={18} />
          ) : icon === "available" ? (
            <CircleCheck size={18} />
          ) : icon === "arrival" ? (
            <CalendarArrowDown size={18} />
          ) : (
            <CalendarArrowUp size={18} />
          )}
        </span>

        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#647480]">
          {label}
        </p>
      </div>

      <div className="mt-2 flex items-end justify-between gap-4">
        <p className={`text-[26px] font-semibold tracking-[-0.04em] ${valueClass}`}>
          {value}
        </p>

        <p className="pb-1 text-[9px] text-[#687784]">
          {helper}
        </p>
      </div>
    </article>
  );
}

function PortfolioBadge({
  label,
  tone,
}: {
  label: string;
  tone:
    | "critical"
    | "warning"
    | "opportunity";
}) {
  const classes =
    tone === "critical"
      ? "border-rose-400/20 bg-rose-400/10 text-rose-300"
      : tone === "warning"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
        : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

  return (
    <span className={`rounded-full border px-3 py-1.5 text-[9px] font-bold ${classes}`}>
      {label}
    </span>
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
    .join(" \u00B7 ");

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#D8B367]/15 bg-[#D8B367]/[0.07] text-[#D8B367]">
          <Building2 size={18} />
        </span>

        <div className="min-w-0">
          <Link
            href={`/properties/${id}`}
            className="block truncate text-sm font-semibold tracking-tight text-[#F6F0E6] transition hover:text-[#E3C57E]"
          >
            {name}
          </Link>

          <p className="mt-1 truncate text-[10px] font-medium text-[#657582]">
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
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[9px] font-semibold text-[#82909B]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#6B7985]" />

        {formatStatus(status)}
      </span>
    );
  }

  if (closedToday) {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-rose-400/20 bg-rose-400/10 px-2.5 py-1.5 text-[9px] font-semibold text-rose-300">
        <DoorClosed size={11} />
        Chiusa oggi
      </span>
    );
  }

  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1.5 text-[9px] font-semibold text-emerald-300">
      <CircleCheck size={11} />
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
              ? "text-[#E3C57E]"
              : "text-emerald-300"
            : "text-[#3D4B56]",
        ].join(
          " ",
        )}
      >
        {count}
      </p>

      <p className="mt-0.5 text-[8px] font-medium text-[#596875]">
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
          ? "border-emerald-400/20 bg-emerald-400/[0.08] !text-emerald-300 hover:bg-emerald-400/[0.13]"
          : "border-rose-400/20 bg-rose-400/[0.08] !text-rose-300 hover:bg-rose-400/[0.13]",
      ].join(
        " ",
      )}
    >
      {isCheckIn ? (
        <CalendarArrowDown size={12} />
      ) : (
        <CalendarArrowUp size={12} />
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
