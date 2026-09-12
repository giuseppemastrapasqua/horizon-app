import Link from "next/link";

import {
  BookingPeriodFields,
} from "./BookingPeriodFields";

import {
  ArrowRight,
  Building2,
  CalendarDays,
  CircleDollarSign,
  LogIn,
  LogOut,
  Moon,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";

import {
  AppShell,
} from "@/components/AppShell";

import {
  Navigation,
} from "@/components/Navigation";

import {
  prisma,
} from "@/lib/prisma";

import { getAccessiblePropertyIds, requireUser } from "@/lib/auth/guards";

import {
  formatCurrency,
} from "@/lib/format/currency";

import {
  formatDate,
} from "@/lib/format/date";

type BookingsPageProps = {
  searchParams: Promise<{
    propertyId?: string | string[];
    search?: string | string[];
    from?: string | string[];
    to?: string | string[];
    day?: string | string[];
    type?: string | string[];
  }>;
};

export default async function BookingsPage({
  searchParams,
}: BookingsPageProps) {
  const params =
    await searchParams;

  const user = await requireUser();
  const isOperator = user.role === "OPERATOR";

  const propertyId =
    getStringParam(
      params.propertyId,
    );

  const search =
    getStringParam(
      params.search,
    );

  const day =
    getStringParam(
      params.day,
    );

  const type =
    getStringParam(
      params.type,
    );

  const now =
    new Date();

  const defaultFrom =
    formatInputDate(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ),
    );

  const defaultTo =
    formatInputDate(
      new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
      ),
    );

  const from =
    normalizeDateInput(
      getStringParam(
        params.from,
      ),
      defaultFrom,
    );

  const to =
    normalizeDateInput(
      getStringParam(
        params.to,
      ),
      defaultTo,
    );

  const rangeStart =
    startOfInputDate(
      from,
    );

  const rangeEnd =
    endOfInputDate(
      to,
    );

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

  const bookingDateWhere =
    day === "today" &&
    type === "checkout"
      ? {
          checkOut: {
            gte:
              startOfToday,
            lte:
              endOfToday,
          },
        }
      : day === "today" &&
          type === "checkin"
        ? {
            checkIn: {
              gte:
                startOfToday,
              lte:
                endOfToday,
            },
          }
        : {
            checkIn: {
              gte:
                rangeStart,
              lte:
                rangeEnd,
            },
          };

  const accessiblePropertyIds = await getAccessiblePropertyIds();

  if (propertyId) {
    const canAccessPropertyFilter =
      accessiblePropertyIds === null ||
      accessiblePropertyIds.includes(propertyId);

    if (!canAccessPropertyFilter) {
      throw new Error("Accesso non autorizzato.");
    }
  }

  const bookingWhere = {
    ...(accessiblePropertyIds
      ? { propertyId: { in: accessiblePropertyIds } }
      : {}),
    ...(propertyId ? { propertyId } : {}),
    ...bookingDateWhere,
  };

  const bookingsPromise = isOperator
    ? prisma.booking
        .findMany({
          where: bookingWhere,
          orderBy: [
            { checkIn: "asc" },
            { createdAt: "desc" },
          ],
          select: {
            id: true,
            guestName: true,
            guestEmail: true,
            externalBookingId: true,
            checkIn: true,
            checkOut: true,
            nights: true,
            guests: true,
            channel: true,
            bookingStatus: true,
            operationalStatus: true,
            property: {
              select: { id: true, name: true },
            },
          },
        })
        .then((items) =>
          items.map((booking) => ({
            ...booking,
            grossAmount: 0,
            currency: "EUR",
          })),
        )
    : prisma.booking.findMany({
        where: bookingWhere,
        orderBy: [
          { checkIn: "asc" },
          { createdAt: "desc" },
        ],
        include: {
          property: {
            select: { id: true, name: true },
          },
        },
      });

  const [bookings, properties] = await Promise.all([
    bookingsPromise,
    prisma.property.findMany({
      where: accessiblePropertyIds
        ? { id: { in: accessiblePropertyIds } }
        : undefined,
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  const normalizedSearch =
    search
      .trim()
      .toLowerCase();

  const filteredBookings =
    bookings.filter(
      (booking) => {
        if (
          !normalizedSearch
        ) {
          return true;
        }

        return [
          booking.guestName,
          booking.guestEmail ??
            "",
          booking.property.name,
          booking.externalBookingId ??
            "",
        ].some(
          (value) =>
            value
              .toLowerCase()
              .includes(
                normalizedSearch,
              ),
        );
      },
    );

  const validBookings =
    filteredBookings.filter(
      (booking) =>
        booking.bookingStatus !==
        "CANCELLED",
    );

  const grossRevenue =
    validBookings.reduce(
      (
        total,
        booking,
      ) =>
        total +
        Number(
          booking.grossAmount,
        ),
      0,
    );

  const selectedProperty =
    properties.find(
      (property) =>
        property.id ===
        propertyId,
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

  const activeStays =
    validBookings.filter(
      (booking) =>
        booking.checkIn <=
          now &&
        booking.checkOut >
          now,
    );

  const futureBookings =
    validBookings.filter(
      (booking) =>
        booking.checkIn >
        now,
    );

  const isFullMonth =
    isWholeCalendarMonth(
      from,
      to,
    );

  const commissionData =
    isFullMonth
      ? await getCommissionSummary({
          propertyId,
          accessiblePropertyIds,
          monthStart:
            rangeStart,
        })
      : {
          total:
            null,
          available:
            false,
        };

  const netRevenue =
    commissionData.available &&
    commissionData.total !==
      null
      ? grossRevenue -
        commissionData.total
      : null;

  const periodLabel =
    formatPeriodLabel(
      from,
      to,
    );

  return (
    <>
      <Navigation />

      <AppShell
        title="Prenotazioni"
        subtitle="Soggiorni, ospiti e movimenti operativi."
      >
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#D8B367]">
              Gestione soggiorni
            </p>

            <p className="mt-1 text-[9px] font-medium text-[#82909C]">
              {selectedProperty
                ? `Prenotazioni di ${selectedProperty.name}`
                : "Tutte le prenotazioni del portfolio Horizon"}
            </p>
          </div>

          {!isOperator ? (
          <Link
            href={
              propertyId
                ? `/bookings/new?propertyId=${encodeURIComponent(
                    propertyId,
                  )}`
                : "/bookings/new"
            }
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#D8B367]/70 bg-[#D8B367] px-4 text-[10px] font-bold !text-[#07111A] shadow-[0_10px_24px_rgba(216,179,103,0.16)] transition hover:-translate-y-0.5 hover:bg-[#E5C47F] hover:shadow-[0_14px_30px_rgba(216,179,103,0.20)]"
          >
            <Plus
              size={14}
            />

            Nuova prenotazione
          </Link>
          ) : null}
        </div>

        <section className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={
              <LogIn
                size={15}
              />
            }
            label="Arrivi oggi"
            value={
              arrivalsToday.length
            }
            tone="blue"
          />

          <SummaryCard
            icon={
              <Users
                size={15}
              />
            }
            label="Soggiorni attivi"
            value={
              activeStays.length
            }
            tone="sky"
          />

          <SummaryCard
            icon={
              <LogOut
                size={15}
              />
            }
            label="Partenze oggi"
            value={
              departuresToday.length
            }
            tone="emerald"
          />

          <SummaryCard
            icon={
              <CalendarDays
                size={15}
              />
            }
            label="Prenotazioni future"
            value={
              futureBookings.length
            }
            tone="indigo"
          />
        </section>

        <form
          method="get"
          className="mb-5 rounded-[18px] border border-white/[0.07] bg-[#09131C]/95 p-4 shadow-[0_14px_34px_rgba(0,0,0,0.20)]"
        >
          <div className="grid gap-2 lg:grid-cols-[minmax(180px,1fr)_155px_155px_220px_auto_auto] lg:items-end">

            <label className="block">
              <span className="mb-1.5 block text-[8px] font-bold uppercase tracking-[0.1em] text-[#82909C]">
                Cerca
              </span>

              <div className="relative">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#687784]"
                />

                <input
                  type="search"
                  name="search"
                  defaultValue={
                    search
                  }
                  placeholder="Ospite, email o ID..."
                  className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050B11]/70 pl-9 pr-3 text-[10px] font-medium text-[#E8E1D5] outline-none transition placeholder:text-[#5F6C76] focus:border-[#D8B367]/60 focus:bg-[#07111A] focus:ring-2 focus:ring-[#D8B367]/10"
                />
              </div>
            </label>

            <BookingPeriodFields
              initialFrom={from}
              initialTo={to}
            />

            <label className="block">
              <span className="mb-1.5 block text-[8px] font-bold uppercase tracking-[0.1em] text-[#82909C]">
                Struttura
              </span>

              <div className="relative">
                <Building2
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#687784]"
                />

                <select
                  name="propertyId"
                  defaultValue={
                    propertyId
                  }
                  className="h-10 w-full appearance-none rounded-xl border border-white/[0.08] bg-[#050B11]/70 pl-9 pr-8 text-[10px] font-semibold text-[#E8E1D5] outline-none transition focus:border-[#D8B367]/60 focus:ring-2 focus:ring-[#D8B367]/10"
                >
                  <option value="">
                    Tutte le strutture
                  </option>

                  {properties.map(
                    (property) => (
                      <option
                        key={
                          property.id
                        }
                        value={
                          property.id
                        }
                      >
                        {
                          property.name
                        }
                      </option>
                    ),
                  )}
                </select>
              </div>
            </label>

            <button
              type="submit"
              className="h-10 rounded-xl bg-[#D8B367] px-5 text-[10px] font-bold text-[#07111A] shadow-[0_8px_18px_rgba(216,179,103,0.14)] transition hover:bg-[#E5C47F]"
            >
              Applica
            </button>

            <Link
              href="/bookings"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 text-[9px] font-semibold text-[#82909C] transition hover:border-[#D8B367]/40 hover:bg-[#D8B367]/[0.06] hover:text-[#D8B367]"
            >
              <X
                size={12}
              />

              Azzera
            </Link>
          </div>

          {day ? (
            <input
              type="hidden"
              name="day"
              value={day}
            />
          ) : null}

          {type ? (
            <input
              type="hidden"
              name="type"
              value={type}
            />
          ) : null}
        </form>

        {day === "today" &&
        type ? (
          <div className="mb-4 rounded-xl border border-[#D8B367]/20 bg-[#D8B367]/[0.06] px-3 py-2">
            <p className="text-[9px] font-semibold text-[#D8B367]">
              Vista filtrata:{" "}
              {type ===
              "checkout"
                ? "check-out di oggi"
                : "check-in di oggi"}
              {selectedProperty
                ? ` \u00B7 ${selectedProperty.name}`
                : ""}
            </p>
          </div>
        ) : null}

        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#D8B367]">
              Periodo di riferimento
            </p>

            <h2 className="mt-1 font-serif text-xl font-semibold tracking-tight text-[#FFF8EA]">
              {periodLabel}
            </h2>

            <p className="mt-1 text-[9px] text-slate-400">
              {validBookings.length}{" "}
              {validBookings.length ===
              1
                ? "prenotazione valida"
                : "prenotazioni valide"}
              {" \u00B7 "}
              criterio: data di check-in
            </p>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#09131C]/95 shadow-[0_16px_38px_rgba(0,0,0,0.20)]">
          {filteredBookings.length ===
          0 ? (
            <div className="px-6 py-16 text-center">
              <CalendarDays
                size={22}
                className="mx-auto text-[#D8B367]"
              />

              <h2 className="mt-3 !font-sans text-sm font-bold text-[#FFF8EA]">
                Nessuna prenotazione nel periodo
              </h2>

              <p className="mt-1 text-[10px] text-slate-500">
                Modifica le date oppure gli altri filtri.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[1160px]">

                <div className="grid grid-cols-[minmax(190px,1.3fr)_minmax(175px,1.1fr)_175px_80px_90px_115px_125px_60px] items-center border-b border-white/[0.07] bg-white/[0.025] px-4 py-3 text-[9px] font-bold uppercase tracking-[0.12em] text-[#687784]">
                  <span>Ospite</span>
                  <span>Struttura</span>
                  <span>Soggiorno</span>
                  <span>Notti</span>
                  <span>Ospiti</span>
                  <span>Importo</span>
                  <span>Stato</span>
                  <span className="text-right">
                    Apri
                  </span>
                </div>

                {filteredBookings.map(
                  (
                    booking,
                    index,
                  ) => (
                    <article
                      key={
                        booking.id
                      }
                      className={[
                        "grid grid-cols-[minmax(190px,1.3fr)_minmax(175px,1.1fr)_175px_80px_90px_115px_125px_60px] items-center px-4 py-3.5 transition hover:bg-white/[0.025]",
                        index <
                        filteredBookings.length -
                          1
                          ? "border-b border-white/[0.055]"
                          : "",
                      ].join(
                        " ",
                      )}
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/bookings/${booking.id}`}
                          className="block truncate text-[12px] font-bold text-[#F4EEDF] transition hover:text-[#D8B367]"
                        >
                          {
                            booking.guestName
                          }
                        </Link>

                        <div className="mt-1 flex items-center gap-1.5">
                          <ChannelBadge
                            channel={
                              booking.channel
                            }
                          />

                          {booking.externalBookingId ? (
                            <span className="max-w-[110px] truncate text-[9px] font-medium text-[#82909C]">
                              {
                                booking.externalBookingId
                              }
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {isOperator ? (
                        <span className="truncate text-[11px] font-semibold text-[#A4AFB8]">
                          {booking.property.name}
                        </span>
                      ) : (
                        <Link
                          href={`/properties/${booking.property.id}`}
                          className="truncate text-[11px] font-semibold text-[#A4AFB8] transition hover:text-[#D8B367]"
                        >
                          {booking.property.name}
                        </Link>
                      )}

                      <div>
                        <p className="text-[10px] font-bold text-[#D7DDE1]">
                          {formatDate(
                            booking.checkIn,
                          )}
                        </p>

                        <p className="mt-1 flex items-center gap-1 text-[9px] text-slate-400">
                          <ArrowRight
                            size={9}
                          />

                          {formatDate(
                            booking.checkOut,
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#D7DDE1]">
                        <Moon
                          size={12}
                          className="text-slate-400"
                        />

                        {
                          booking.nights
                        }
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#D7DDE1]">
                        <Users
                          size={12}
                          className="text-slate-400"
                        />

                        {
                          booking.guests
                        }
                      </div>

                      {!isOperator ? (
                      <p className="flex items-center gap-1 text-[11px] font-bold text-[#F4EEDF]">
                        <CircleDollarSign
                          size={12}
                          className="text-[#D8B367]"
                        />

                        {formatCurrency(
                          Number(
                            booking.grossAmount,
                          ),
                          booking.currency,
                        )}
                      </p>
                      ) : (
                        <div aria-hidden="true" />
                      )}

                      <div className="flex flex-col items-start gap-1">
                        <BookingStatusBadge
                          status={
                            booking.bookingStatus
                          }
                        />

                        <OperationalStatus
                          status={
                            booking.operationalStatus
                          }
                        />
                      </div>

                      <div className="flex justify-end">
                        <Link
                          href={`/bookings/${booking.id}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025] text-[#82909C] transition hover:border-[#D8B367]/40 hover:bg-[#D8B367]/[0.06] hover:text-[#D8B367]"
                        >
                          <ArrowRight
                            size={13}
                          />
                        </Link>
                      </div>
                    </article>
                  ),
                )}
              </div>
            </div>
          )}
        </section>

        {!isOperator ? (
        <section className="mt-3 grid gap-2 md:grid-cols-3">
          <MoneySummary
            label="Incasso prenotazioni"
            value={
              formatCurrency(
                grossRevenue,
                "EUR",
              )
            }
            description="Totale lordo delle prenotazioni valide"
          />

          <MoneySummary
            label="Commissioni portali"
            value={
              commissionData.available &&
              commissionData.total !==
                null
                ? formatCurrency(
                    commissionData.total,
                    "EUR",
                  )
                : "\u2014"
            }
            description={
              isFullMonth
                ? commissionData.available
                  ? "Da rendiconti finanziari Horizon"
                  : "Nessun rendiconto commissioni disponibile"
                : "Disponibili sul mese solare completo"
            }
          />

          <MoneySummary
            label="Netto dopo commissioni"
            value={
              netRevenue !==
              null
                ? formatCurrency(
                    netRevenue,
                    "EUR",
                  )
                : "\u2014"
            }
            description="Lordo meno commissioni OTA"
            highlight
          />
        </section>
        ) : null}
      </AppShell>
    </>
  );
}

async function getCommissionSummary({
  propertyId,
  accessiblePropertyIds,
  monthStart,
}: {
  propertyId: string;
  accessiblePropertyIds: string[] | null;
  monthStart: Date;
}) {
  const nextMonth =
    new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      1,
    );

  const reports =
    await prisma.financeReport.findMany({
      where: {
        ...(accessiblePropertyIds
          ? { propertyId: { in: accessiblePropertyIds } }
          : {}),

        ...(propertyId
          ? {
              propertyId,
            }
          : {}),

        referenceMonth: {
          gte:
            monthStart,
          lt:
            nextMonth,
        },
      },

      orderBy: {
        updatedAt:
          "desc",
      },

      include: {
        rules: {
          where: {
            category:
              "OTA_COMMISSION",
          },

          select: {
            calculatedAmount:
              true,
          },
        },
      },
    });

  const latestByProperty =
    new Map<
      string,
      (typeof reports)[number]
    >();

  for (
    const report
    of reports
  ) {
    if (
      !latestByProperty.has(
        report.propertyId,
      )
    ) {
      latestByProperty.set(
        report.propertyId,
        report,
      );
    }
  }

  const selectedReports =
    [
      ...latestByProperty.values(),
    ];

  const hasCommissionRules =
    selectedReports.some(
      (report) =>
        report.rules.length >
        0,
    );

  if (
    !hasCommissionRules
  ) {
    return {
      available:
        false,
      total:
        null,
    };
  }

  const total =
    selectedReports.reduce(
      (
        reportTotal,
        report,
      ) =>
        reportTotal +
        report.rules.reduce(
          (
            ruleTotal,
            rule,
          ) =>
            ruleTotal +
            Math.abs(
              Number(
                rule.calculatedAmount,
              ),
            ),
          0,
        ),
      0,
    );

  return {
    available:
      true,
    total,
  };
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone:
    | "blue"
    | "emerald"
    | "sky"
    | "indigo";
}) {
  const classes = {
    blue:
      "border-[#D8B367]/25 bg-[#D8B367]/[0.08] text-[#D8B367]",
    emerald:
      "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300",
    sky:
      "border-sky-400/20 bg-sky-400/[0.08] text-sky-300",
    indigo:
      "border-indigo-400/20 bg-indigo-400/[0.08] text-indigo-300",
  };

  return (
    <div className="flex min-h-[82px] items-center gap-3.5 rounded-[18px] border border-white/[0.07] bg-[#09131C]/95 px-4 py-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:border-[#D8B367]/25 hover:shadow-[0_16px_34px_rgba(0,0,0,0.24)]">
      <span
        className={[
          "flex h-10 w-10 items-center justify-center rounded-xl border shadow-sm",
          classes[tone],
        ].join(
          " ",
        )}
      >
        {icon}
      </span>

      <div>
        <p className="text-[8px] font-bold uppercase tracking-[0.11em] text-[#82909C]">
          {label}
        </p>

        <p className="mt-0.5 text-[22px] font-black tracking-[-0.04em] text-[#FFF8EA] tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
}

function MoneySummary({
  label,
  value,
  description,
  highlight = false,
}: {
  label: string;
  value: string;
  description: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-4 shadow-sm",
        highlight
          ? "border-[#D8B367]/30 bg-[#D8B367]/[0.07]"
          : "border-white/[0.07] bg-[#09131C]/95",
      ].join(
        " ",
      )}
    >
      <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p
        className={[
          "mt-1 text-xl font-bold tracking-tight",
          highlight
            ? "text-[#D8B367]"
            : "text-[#F4EEDF]",
        ].join(
          " ",
        )}
      >
        {value}
      </p>

      <p className="mt-1 text-[8px] leading-4 text-slate-400">
        {description}
      </p>
    </div>
  );
}

function ChannelBadge({
  channel,
}: {
  channel: string;
}) {
  return (
    <span className="inline-flex rounded-full border border-[#D8B367]/20 bg-[#D8B367]/[0.07] px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[#D8B367]">
      {formatLabel(
        channel,
      )}
    </span>
  );
}

function BookingStatusBadge({
  status,
}: {
  status: string;
}) {
  const cancelled =
    status ===
    "CANCELLED";

  return (
    <span
      className={[
        "inline-flex rounded-full border px-2 py-0.5 text-[8px] font-bold",
        cancelled
          ? "border-rose-400/20 bg-rose-400/[0.08] text-rose-300"
          : "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300",
      ].join(
        " ",
      )}
    >
      {formatLabel(
        status,
      )}
    </span>
  );
}

function OperationalStatus({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className={[
        "text-[8px] font-semibold",
        status === "OK"
          ? "text-slate-400"
          : "text-amber-300",
      ].join(
        " ",
      )}
    >
      {status === "OK"
        ? "Operativit\u00E0 OK"
        : formatLabel(
            status,
          )}
    </span>
  );
}

function getStringParam(
  value:
    | string
    | string[]
    | undefined,
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function normalizeDateInput(
  value: string,
  fallback: string,
) {
  return /^\d{4}-\d{2}-\d{2}$/.test(
    value,
  )
    ? value
    : fallback;
}

function startOfInputDate(
  value: string,
) {
  const date =
    new Date(
      `${value}T00:00:00`,
    );

  return date;
}

function endOfInputDate(
  value: string,
) {
  const date =
    new Date(
      `${value}T23:59:59.999`,
    );

  return date;
}

function formatInputDate(
  date: Date,
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(
      2,
      "0",
    );

  const day =
    String(
      date.getDate(),
    ).padStart(
      2,
      "0",
    );

  return `${year}-${month}-${day}`;
}

function isWholeCalendarMonth(
  from: string,
  to: string,
) {
  const start =
    startOfInputDate(
      from,
    );

  const end =
    startOfInputDate(
      to,
    );

  if (
    start.getDate() !==
    1
  ) {
    return false;
  }

  const lastDay =
    new Date(
      start.getFullYear(),
      start.getMonth() + 1,
      0,
    );

  return (
    end.getFullYear() ===
      lastDay.getFullYear() &&
    end.getMonth() ===
      lastDay.getMonth() &&
    end.getDate() ===
      lastDay.getDate()
  );
}

function formatPeriodLabel(
  from: string,
  to: string,
) {
  const start =
    startOfInputDate(
      from,
    );

  const end =
    startOfInputDate(
      to,
    );

  if (
    isWholeCalendarMonth(
      from,
      to,
    )
  ) {
    const value =
      start.toLocaleDateString(
        "it-IT",
        {
          month:
            "long",
          year:
            "numeric",
        },
      );

    return (
      value
        .charAt(0)
        .toUpperCase() +
      value.slice(1)
    );
  }

  return `${start.toLocaleDateString(
    "it-IT",
  )} \u2014 ${end.toLocaleDateString(
    "it-IT",
  )}`;
}

function formatLabel(
  value: string,
) {
  return value
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


