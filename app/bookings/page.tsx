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

  const [
    bookings,
    properties,
  ] =
    await Promise.all([
      prisma.booking.findMany({
        where: {
          ...(propertyId
            ? {
                propertyId,
              }
            : {}),

          ...bookingDateWhere,
        },

        orderBy: [
          {
            checkIn:
              "asc",
          },
          {
            createdAt:
              "desc",
          },
        ],

        include: {
          property: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      prisma.property.findMany({
        orderBy: {
          name: "asc",
        },

        select: {
          id: true,
          name: true,
        },
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
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.18em] text-blue-600">
              Operations
            </p>

            <h2 className="mt-1 text-[18px] font-black tracking-[-0.035em] text-slate-950">
              Gestione soggiorni
            </h2>

            <p className="mt-1 text-[9px] font-medium text-slate-400">
              {selectedProperty
                ? `Prenotazioni di ${selectedProperty.name}`
                : "Tutte le prenotazioni del portfolio Horizon"}
            </p>
          </div>

          <Link
            href={
              propertyId
                ? `/bookings/new?propertyId=${encodeURIComponent(
                    propertyId,
                  )}`
                : "/bookings/new"
            }
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2563EB] px-4 text-[10px] font-bold text-white shadow-[0_8px_20px_rgba(37,99,235,0.20)] transition hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-[0_12px_26px_rgba(37,99,235,0.24)]"
          >
            <Plus
              size={14}
            />

            Nuova prenotazione
          </Link>
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
          className="mb-5 rounded-[18px] border border-slate-200/80 bg-white p-4 shadow-[0_8px_26px_rgba(15,23,42,0.045)]"
        >
          <div className="grid gap-2 lg:grid-cols-[minmax(180px,1fr)_155px_155px_220px_auto_auto] lg:items-end">

            <label className="block">
              <span className="mb-1.5 block text-[8px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Cerca
              </span>

              <div className="relative">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  name="search"
                  defaultValue={
                    search
                  }
                  placeholder="Ospite, email o ID..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-[10px] font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </label>

            <BookingPeriodFields
              initialFrom={from}
              initialTo={to}
            />

            <label className="block">
              <span className="mb-1.5 block text-[8px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Struttura
              </span>

              <div className="relative">
                <Building2
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  name="propertyId"
                  defaultValue={
                    propertyId
                  }
                  className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-[10px] font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
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
              className="h-10 rounded-xl bg-[#2563EB] px-5 text-[10px] font-bold text-white shadow-[0_6px_16px_rgba(37,99,235,0.16)] transition hover:bg-[#1D4ED8]"
            >
              Applica
            </button>

            <Link
              href="/bookings"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[9px] font-semibold text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
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
          <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2">
            <p className="text-[9px] font-semibold text-blue-700">
              Vista filtrata:{" "}
              {type ===
              "checkout"
                ? "check-out di oggi"
                : "check-in di oggi"}
              {selectedProperty
                ? ` · ${selectedProperty.name}`
                : ""}
            </p>
          </div>
        ) : null}

        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-blue-600">
              Periodo di riferimento
            </p>

            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              {periodLabel}
            </h2>

            <p className="mt-1 text-[9px] text-slate-400">
              {validBookings.length}{" "}
              {validBookings.length ===
              1
                ? "prenotazione valida"
                : "prenotazioni valide"}
              {" · "}
              criterio: data di check-in
            </p>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {filteredBookings.length ===
          0 ? (
            <div className="px-6 py-16 text-center">
              <CalendarDays
                size={22}
                className="mx-auto text-blue-500"
              />

              <h2 className="mt-3 text-sm font-bold text-slate-900">
                Nessuna prenotazione nel periodo
              </h2>

              <p className="mt-1 text-[10px] text-slate-500">
                Modifica le date oppure gli altri filtri.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[1160px]">

                <div className="grid grid-cols-[minmax(190px,1.3fr)_minmax(175px,1.1fr)_175px_80px_90px_115px_125px_60px] items-center border-b border-slate-200 bg-slate-50/80 px-4 py-3 text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400">
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
                        "grid grid-cols-[minmax(190px,1.3fr)_minmax(175px,1.1fr)_175px_80px_90px_115px_125px_60px] items-center px-4 py-3.5 transition hover:bg-blue-50/30",
                        index <
                        filteredBookings.length -
                          1
                          ? "border-b border-slate-100"
                          : "",
                      ].join(
                        " ",
                      )}
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/bookings/${booking.id}`}
                          className="block truncate text-[11px] font-bold text-slate-900 transition hover:text-blue-700"
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
                            <span className="max-w-[90px] truncate text-[7px] font-medium text-slate-400">
                              {
                                booking.externalBookingId
                              }
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <Link
                        href={`/properties/${booking.property.id}`}
                        className="truncate text-[10px] font-semibold text-slate-600 transition hover:text-blue-700"
                      >
                        {
                          booking.property.name
                        }
                      </Link>

                      <div>
                        <p className="text-[9px] font-bold text-slate-700">
                          {formatDate(
                            booking.checkIn,
                          )}
                        </p>

                        <p className="mt-1 flex items-center gap-1 text-[8px] text-slate-400">
                          <ArrowRight
                            size={9}
                          />

                          {formatDate(
                            booking.checkOut,
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700">
                        <Moon
                          size={12}
                          className="text-slate-400"
                        />

                        {
                          booking.nights
                        }
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700">
                        <Users
                          size={12}
                          className="text-slate-400"
                        />

                        {
                          booking.guests
                        }
                      </div>

                      <p className="flex items-center gap-1 text-[10px] font-bold text-slate-900">
                        <CircleDollarSign
                          size={12}
                          className="text-blue-500"
                        />

                        {formatCurrency(
                          Number(
                            booking.grossAmount,
                          ),
                          booking.currency,
                        )}
                      </p>

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
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
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
                : "—"
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
                : "—"
            }
            description="Lordo meno commissioni OTA"
            highlight
          />
        </section>
      </AppShell>
    </>
  );
}

async function getCommissionSummary({
  propertyId,
  monthStart,
}: {
  propertyId: string;
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
      "border-blue-100 bg-blue-50 text-blue-600",
    emerald:
      "border-emerald-100 bg-emerald-50 text-emerald-600",
    sky:
      "border-sky-100 bg-sky-50 text-sky-600",
    indigo:
      "border-indigo-100 bg-indigo-50 text-indigo-600",
  };

  return (
    <div className="flex min-h-[82px] items-center gap-3.5 rounded-[18px] border border-slate-200/80 bg-white px-4 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.045)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_14px_30px_rgba(37,99,235,0.08)]">
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
        <p className="text-[8px] font-bold uppercase tracking-[0.11em] text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 text-[22px] font-black tracking-[-0.04em] text-slate-950 tabular-nums">
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
          ? "border-blue-200 bg-blue-50/60"
          : "border-slate-200 bg-white",
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
            ? "text-blue-700"
            : "text-slate-900",
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
    <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[7px] font-bold uppercase tracking-wide text-blue-600">
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
        "inline-flex rounded-full border px-2 py-0.5 text-[7px] font-bold",
        cancelled
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700",
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
        "text-[7px] font-semibold",
        status === "OK"
          ? "text-slate-400"
          : "text-amber-600",
      ].join(
        " ",
      )}
    >
      {status === "OK"
        ? "Operatività OK"
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
  )} — ${end.toLocaleDateString(
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





