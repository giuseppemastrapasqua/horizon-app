"use client";

import {
  BedDouble,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Moon,
  Plus,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";

type CalendarBooking = {
  id: string;

  channel:
    | "AIRBNB"
    | "BOOKING"
    | "DIRECT"
    | "VRBO"
    | "OTHER";

  guestName: string;

  checkIn: string;
  checkOut: string;

  grossAmount: number;
  currency: string;

  bookingStatus:
    | "PENDING"
    | "CONFIRMED"
    | "CHECKED_IN"
    | "CHECKED_OUT"
    | "CANCELLED";

  integrationConnectionId:
    | string
    | null;
};

type PropertyCalendarProps = {
  propertyId: string;
  propertyName: string;
  bookings: CalendarBooking[];
  cleaningCost: number;
};

type CalendarDay = {
  date: Date;
  dayNumber: number;
  currentMonth: boolean;
};

type CalendarSegment = {
  booking: CalendarBooking;
  startColumn: number;
  endColumn: number;
  lane: number;
};

type CalendarMetrics = {
  occupiedNights: number;
  freeNights: number;
  occupancyRate: number;
  bookingsCount: number;
  grossRevenue: number;
  currency: string;
};

const WEEKDAYS = [
  "Lun",
  "Mar",
  "Mer",
  "Gio",
  "Ven",
  "Sab",
  "Dom",
];

export function PropertyCalendar({
  propertyId,
  propertyName,
  bookings,
  cleaningCost,
}: PropertyCalendarProps) {
  const today =
    new Date();

  const [selectedMonth, setSelectedMonth] =
    useState(
      () =>
        new Date(
          today.getFullYear(),
          today.getMonth(),
          1,
        ),
    );

  /*
   * Preview UI.
   *
   * Questi valori saranno collegati
   * successivamente ai modelli Prisma.
   */
  const [rangeStart, setRangeStart] =
    useState("");

  const [rangeEnd, setRangeEnd] =
    useState("");

  const [nightlyPrice, setNightlyPrice] =
    useState("");

  const [minimumStay, setMinimumStay] =
    useState("2");

  const [maximumStay, setMaximumStay] =
    useState("");

  const [
    includedGuests,
    setIncludedGuests,
  ] =
    useState("2");

  const [
    extraGuestPrice,
    setExtraGuestPrice,
  ] =
    useState("");

  const [pricingMode, setPricingMode] =
    useState<
      "MANUAL" | "AI"
    >("MANUAL");

  const [
    showAiPreview,
    setShowAiPreview,
  ] =
    useState(false);

  const activeBookings =
    useMemo(
      () =>
        bookings.filter(
          (booking) =>
            booking.bookingStatus !==
            "CANCELLED",
        ),
      [bookings],
    );

  const calendarDays =
    useMemo(
      () =>
        buildCalendarDays(
          selectedMonth,
        ),
      [selectedMonth],
    );

  const weeks =
    useMemo(
      () =>
        chunk(
          calendarDays,
          7,
        ),
      [calendarDays],
    );

  const visibleBookings =
    useMemo(
      () =>
        activeBookings.filter(
          (booking) =>
            overlapsMonth(
              booking,
              selectedMonth,
            ),
        ),
      [
        activeBookings,
        selectedMonth,
      ],
    );

  const metrics =
    useMemo(
      () =>
        calculateMetrics({
          bookings:
            visibleBookings,

          month:
            selectedMonth,
        }),
      [
        visibleBookings,
        selectedMonth,
      ],
    );

  const previousMonthMetrics =
    useMemo(
      () =>
        calculateMetricsForMonth(
          activeBookings,
          new Date(
            selectedMonth.getFullYear(),
            selectedMonth.getMonth() -
              1,
            1,
          ),
        ),
      [
        activeBookings,
        selectedMonth,
      ],
    );

  const previousYearMetrics =
    useMemo(
      () =>
        calculateMetricsForMonth(
          activeBookings,
          new Date(
            selectedMonth.getFullYear() -
              1,
            selectedMonth.getMonth(),
            1,
          ),
        ),
      [
        activeBookings,
        selectedMonth,
      ],
    );

  const estimatedCleaningCost =
    metrics.bookingsCount *
    cleaningCost;

  const moveMonth = (
    amount: number,
  ) => {
    setSelectedMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() +
            amount,
          1,
        ),
    );
  };

  const goToday = () => {
    const now =
      new Date();

    setSelectedMonth(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ),
    );
  };

  return (
    <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-200 px-5 py-4 md:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Calendario struttura
            </p>

            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
              {propertyName}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                moveMonth(-1)
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
              aria-label="Mese precedente"
            >
              <ChevronLeft
                size={17}
              />
            </button>

            <button
              type="button"
              onClick={goToday}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Oggi
            </button>

            <button
              type="button"
              onClick={() =>
                moveMonth(1)
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
              aria-label="Mese successivo"
            >
              <ChevronRight
                size={17}
              />
            </button>

            <div className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold capitalize text-white">
              {selectedMonth.toLocaleDateString(
                "it-IT",
                {
                  month:
                    "long",
                  year:
                    "numeric",
                },
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
          <Legend
            label="Booking"
            className="bg-blue-500"
          />

          <Legend
            label="Airbnb"
            className="bg-pink-500"
          />

          <Legend
            label="Vrbo"
            className="bg-orange-500"
          />

          <Legend
            label="Horizon"
            className="bg-slate-950"
          />
        </div>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,3fr)_320px]">
        <div className="min-w-0 border-b border-slate-200 xl:border-b-0 xl:border-r">
          <div className="grid grid-cols-2 border-b border-slate-200 lg:grid-cols-5">
            <CompactMetric
              icon={
                <BedDouble
                  size={15}
                />
              }
              label="Occupazione"
              value={`${metrics.occupancyRate}%`}
            />

            <CompactMetric
              icon={
                <Moon
                  size={15}
                />
              }
              label="Notti"
              value={String(
                metrics.occupiedNights,
              )}
            />

            <CompactMetric
              icon={
                <CalendarDays
                  size={15}
                />
              }
              label="Libere"
              value={String(
                metrics.freeNights,
              )}
            />

            <CompactMetric
              icon={
                <Users
                  size={15}
                />
              }
              label="Prenotazioni"
              value={String(
                metrics.bookingsCount,
              )}
            />

            <CompactMetric
              icon={
                <CircleDollarSign
                  size={15}
                />
              }
              label="Incasso lordo"
              value={formatMoney(
                metrics.grossRevenue,
                metrics.currency,
              )}
              emphasized
            />
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80">
                {WEEKDAYS.map(
                  (weekday) => (
                    <div
                      key={weekday}
                      className="border-r border-slate-200 px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400 last:border-r-0"
                    >
                      {weekday}
                    </div>
                  ),
                )}
              </div>

              {weeks.map(
                (
                  week,
                  weekIndex,
                ) => (
                  <CalendarWeek
                    key={
                      weekIndex
                    }
                    week={week}
                    bookings={
                      activeBookings
                    }
                    today={today}
                  />
                ),
              )}
            </div>
          </div>
        </div>

        <aside className="bg-slate-50/55 p-4">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Azioni rapide
              </p>

              <Link
                href={`/bookings/new?propertyId=${propertyId}`}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus
                  size={16}
                />
                Nuova prenotazione
              </Link>
            </div>

            <div className="rounded-2xl border border-violet-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-600">
                    Tariffe & regole
                  </p>

                  <h3 className="mt-1 text-sm font-semibold text-slate-950">
                    Modifica periodo
                  </h3>
                </div>

                <span className="rounded-full bg-violet-50 px-2 py-1 text-[9px] font-semibold text-violet-700">
                  PREVIEW
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Field
                  label="Da"
                >
                  <input
                    type="date"
                    value={
                      rangeStart
                    }
                    onChange={(
                      event,
                    ) =>
                      setRangeStart(
                        event
                          .target
                          .value,
                      )
                    }
                    className={inputClassName}
                  />
                </Field>

                <Field
                  label="A"
                >
                  <input
                    type="date"
                    value={
                      rangeEnd
                    }
                    onChange={(
                      event,
                    ) =>
                      setRangeEnd(
                        event
                          .target
                          .value,
                      )
                    }
                    className={inputClassName}
                  />
                </Field>
              </div>

              <div className="mt-3">
                <Field
                  label="Prezzo / notte"
                >
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      €
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        nightlyPrice
                      }
                      onChange={(
                        event,
                      ) =>
                        setNightlyPrice(
                          event
                            .target
                            .value,
                        )
                      }
                      placeholder="180"
                      className={`${inputClassName} pl-7`}
                    />
                  </div>
                </Field>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Field
                  label="Minimum stay"
                >
                  <input
                    type="number"
                    min="1"
                    value={
                      minimumStay
                    }
                    onChange={(
                      event,
                    ) =>
                      setMinimumStay(
                        event
                          .target
                          .value,
                      )
                    }
                    className={inputClassName}
                  />
                </Field>

                <Field
                  label="Maximum stay"
                >
                  <input
                    type="number"
                    min="1"
                    value={
                      maximumStay
                    }
                    onChange={(
                      event,
                    ) =>
                      setMaximumStay(
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="∞"
                    className={inputClassName}
                  />
                </Field>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Field
                  label="Ospiti inclusi"
                >
                  <input
                    type="number"
                    min="1"
                    value={
                      includedGuests
                    }
                    onChange={(
                      event,
                    ) =>
                      setIncludedGuests(
                        event
                          .target
                          .value,
                      )
                    }
                    className={inputClassName}
                  />
                </Field>

                <Field
                  label="Extra ospite"
                >
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      extraGuestPrice
                    }
                    onChange={(
                      event,
                    ) =>
                      setExtraGuestPrice(
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="20"
                    className={inputClassName}
                  />
                </Field>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPricingMode(
                      "MANUAL",
                    )
                  }
                  className={[
                    "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                    pricingMode ===
                    "MANUAL"
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-600",
                  ].join(
                    " ",
                  )}
                >
                  Manuale
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPricingMode(
                      "AI",
                    )
                  }
                  className={[
                    "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                    pricingMode ===
                    "AI"
                      ? "border-violet-600 bg-violet-600 text-white"
                      : "border-slate-200 bg-white text-slate-600",
                  ].join(
                    " ",
                  )}
                >
                  Revenue AI
                </button>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAiPreview(
                    (value) =>
                      !value,
                  )
                }
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
              >
                <Sparkles
                  size={15}
                />

                Ottimizza con AI
              </button>

              {showAiPreview ? (
                <AiPreview />
              ) : null}

              <button
                type="button"
                disabled
                className="mt-3 w-full cursor-not-allowed rounded-xl bg-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-500"
                title="Il salvataggio verrà collegato al database nel prossimo passaggio."
              >
                Applica al periodo
              </button>
            </div>

            <ComparisonCard
              title="Vs mese precedente"
              current={metrics}
              previous={
                previousMonthMetrics
              }
            />

            <ComparisonCard
              title="Vs stesso mese anno precedente"
              current={metrics}
              previous={
                previousYearMetrics
              }
            />

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Costi del mese
              </p>

              <div className="mt-3 space-y-2.5">
                <CostRow
                  label="Pulizie"
                  value={formatMoney(
                    estimatedCleaningCost,
                    metrics.currency,
                  )}
                />

                <CostRow
                  label="Commissioni PM"
                  value="Da configurare"
                  muted
                />

                <CostRow
                  label="Commissioni OTA"
                  value="Da configurare"
                  muted
                />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function CalendarWeek({
  week,
  bookings,
  today,
}: {
  week: CalendarDay[];
  bookings: CalendarBooking[];
  today: Date;
}) {
  const weekStart =
    startOfDay(
      week[0]!.date,
    );

  const weekEndExclusive =
    addDays(
      startOfDay(
        week[6]!.date,
      ),
      1,
    );

  const weekBookings =
    bookings.filter(
      (booking) => {
        const checkIn =
          startOfDay(
            new Date(
              booking.checkIn,
            ),
          );

        const checkOut =
          startOfDay(
            new Date(
              booking.checkOut,
            ),
          );

        return (
          checkIn <
            weekEndExclusive &&
          checkOut >
            weekStart
        );
      },
    );

  const segments =
    buildSegments({
      bookings:
        weekBookings,

      weekStart,

      weekEndExclusive,
    });

  const laneCount =
    Math.max(
      1,
      ...segments.map(
        (segment) =>
          segment.lane + 1,
      ),
    );

  const rowHeight =
    Math.max(
      86,
      54 +
        laneCount * 25,
    );

  return (
    <div
      className="relative grid grid-cols-7 border-b border-slate-200 last:border-b-0"
      style={{
        minHeight:
          `${rowHeight}px`,
      }}
    >
      {week.map(
        (day, index) => {
          const isToday =
            sameDay(
              day.date,
              today,
            );

          const isWeekend =
            index >= 5;

          return (
            <div
              key={
                day.date.toISOString()
              }
              className={[
                "relative border-r border-slate-200 px-2 pt-2 last:border-r-0",
                isWeekend
                  ? "bg-slate-50/65"
                  : "bg-white",
                !day.currentMonth
                  ? "opacity-40"
                  : "",
              ].join(
                " ",
              )}
            >
              <span
                className={[
                  "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
                  isToday
                    ? "bg-slate-950 text-white"
                    : "text-slate-600",
                ].join(
                  " ",
                )}
              >
                {
                  day.dayNumber
                }
              </span>
            </div>
          );
        },
      )}

      <div className="pointer-events-none absolute inset-x-0 top-[36px] grid grid-cols-7">
        {segments.map(
          (segment) => {
            const presentation =
              getChannelPresentation(
                segment.booking,
              );

            return (
              <Link
                key={`${segment.booking.id}-${segment.startColumn}-${segment.endColumn}`}
                href={`/bookings/${segment.booking.id}`}
                className={[
                  "pointer-events-auto mx-0.5 flex h-5 items-center overflow-hidden rounded-md px-2 text-[9px] font-bold shadow-sm transition hover:shadow-md",
                  presentation.className,
                ].join(
                  " ",
                )}
                style={{
                  gridColumn: `${segment.startColumn + 1} / ${segment.endColumn + 2}`,

                  marginTop:
                    `${
                      segment.lane *
                      25
                    }px`,
                }}
                title={
                  presentation.title
                }
              >
                <span className="truncate">
                  {
                    presentation.label
                  }
                </span>
              </Link>
            );
          },
        )}
      </div>
    </div>
  );
}

function AiPreview() {
  return (
    <div className="mt-3 space-y-2 rounded-xl border border-violet-200 bg-violet-50/70 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-700">
        Simulazione AI
      </p>

      <AiScenario
        label="Aggressivo"
        price="€ 205"
        stay="2 notti"
      />

      <AiScenario
        label="Bilanciato"
        price="€ 185"
        stay="3 notti"
        recommended
      />

      <AiScenario
        label="Occupazione"
        price="€ 165"
        stay="5 notti"
      />

      <p className="pt-1 text-[9px] leading-4 text-slate-500">
        Valori dimostrativi:
        il motore AI non è
        ancora collegato.
      </p>
    </div>
  );
}

function AiScenario({
  label,
  price,
  stay,
  recommended = false,
}: {
  label: string;
  price: string;
  stay: string;
  recommended?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center justify-between rounded-lg border px-3 py-2",
        recommended
          ? "border-violet-300 bg-white"
          : "border-violet-100 bg-white/60",
      ].join(" ")}
    >
      <div>
        <p className="text-[10px] font-semibold text-slate-800">
          {label}
        </p>

        <p className="text-[9px] text-slate-500">
          {stay}
        </p>
      </div>

      <div className="text-right">
        <p className="text-xs font-bold text-slate-950">
          {price}
        </p>

        {recommended ? (
          <span className="text-[8px] font-semibold uppercase text-violet-600">
            Consigliato
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ComparisonCard({
  title,
  current,
  previous,
}: {
  title: string;
  current: CalendarMetrics;
  previous: CalendarMetrics;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {title}
      </p>

      <div className="mt-3 space-y-2.5">
        <ComparisonRow
          label="Occupazione"
          current={
            current.occupancyRate
          }
          previous={
            previous.occupancyRate
          }
          suffix="%"
        />

        <ComparisonRow
          label="Notti"
          current={
            current.occupiedNights
          }
          previous={
            previous.occupiedNights
          }
        />

        <ComparisonRow
          label="Prenotazioni"
          current={
            current.bookingsCount
          }
          previous={
            previous.bookingsCount
          }
        />

        <ComparisonRow
          label="Incasso"
          current={
            current.grossRevenue
          }
          previous={
            previous.grossRevenue
          }
          currency={
            current.currency
          }
        />
      </div>
    </div>
  );
}

function ComparisonRow({
  label,
  current,
  previous,
  suffix,
  currency,
}: {
  label: string;
  current: number;
  previous: number;
  suffix?: string;
  currency?: string;
}) {
  const delta =
    previous === 0
      ? current === 0
        ? 0
        : 100
      : Math.round(
          (
            (current -
              previous) /
            Math.abs(
              previous,
            )
          ) *
            100,
        );

  const positive =
    delta >= 0;

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] text-slate-500">
        {label}
      </span>

      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-900">
          {currency
            ? formatMoney(
                current,
                currency,
              )
            : `${current}${suffix ?? ""}`}
        </span>

        <span
          className={[
            "inline-flex items-center gap-0.5 text-[9px] font-semibold",
            positive
              ? "text-emerald-600"
              : "text-rose-600",
          ].join(
            " ",
          )}
        >
          {positive ? (
            <TrendingUp
              size={10}
            />
          ) : (
            <TrendingDown
              size={10}
            />
          )}

          {Math.abs(
            delta,
          )}
          %
        </span>
      </div>
    </div>
  );
}

function CostRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] text-slate-500">
        {label}
      </span>

      <span
        className={[
          "text-[11px] font-semibold",
          muted
            ? "text-slate-400"
            : "text-slate-900",
        ].join(
          " ",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children:
    React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-medium text-slate-500">
        {label}
      </span>

      {children}
    </label>
  );
}

function CompactMetric({
  icon,
  label,
  value,
  emphasized = false,
}: {
  icon:
    React.ReactNode;
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div
      className={[
        "border-b border-r border-slate-200 px-3 py-3 last:border-r-0 lg:border-b-0",
        emphasized
          ? "bg-slate-950 text-white"
          : "bg-white",
      ].join(" ")}
    >
      <div
        className={[
          "flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider",
          emphasized
            ? "text-slate-300"
            : "text-slate-400",
        ].join(" ")}
      >
        {icon}
        {label}
      </div>

      <div
        className={[
          "mt-1 text-lg font-semibold tracking-tight",
          emphasized
            ? "text-white"
            : "text-slate-950",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

function Legend({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
      <span
        className={`h-2 w-2 rounded-full ${className}`}
      />

      {label}
    </div>
  );
}

function getChannelPresentation(
  booking: CalendarBooking,
) {
  switch (
    booking.channel
  ) {
    case "BOOKING":
      return {
        label:
          "Booking",

        title:
          `Booking · ${formatDateRange(
            booking,
          )}`,

        className:
          "bg-blue-500 text-white",
      };

    case "AIRBNB":
      return {
        label:
          "Airbnb",

        title:
          `Airbnb · ${formatDateRange(
            booking,
          )}`,

        className:
          "bg-pink-500 text-white",
      };

    case "VRBO":
      return {
        label:
          "Vrbo",

        title:
          `Vrbo · ${formatDateRange(
            booking,
          )}`,

        className:
          "bg-orange-500 text-white",
      };

    case "DIRECT":
      return {
        label:
          booking.guestName ||
          "Horizon",

        title:
          `${booking.guestName} · ${formatDateRange(
            booking,
          )}`,

        className:
          "bg-slate-950 text-white",
      };

    default:
      return {
        label:
          "Altro",

        title:
          `Altro · ${formatDateRange(
            booking,
          )}`,

        className:
          "bg-slate-400 text-white",
      };
  }
}

function buildCalendarDays(
  month: Date,
): CalendarDay[] {
  const monthStart =
    new Date(
      month.getFullYear(),
      month.getMonth(),
      1,
    );

  const monthEnd =
    new Date(
      month.getFullYear(),
      month.getMonth() +
        1,
      0,
    );

  const firstWeekday =
    (
      monthStart.getDay() +
      6
    ) % 7;

  const lastWeekday =
    (
      monthEnd.getDay() +
      6
    ) % 7;

  const gridStart =
    addDays(
      monthStart,
      -firstWeekday,
    );

  const gridEnd =
    addDays(
      monthEnd,
      6 -
        lastWeekday,
    );

  const totalDays =
    differenceInDays(
      addDays(
        gridEnd,
        1,
      ),
      gridStart,
    );

  const days:
    CalendarDay[] = [];

  for (
    let index = 0;
    index < totalDays;
    index += 1
  ) {
    const date =
      addDays(
        gridStart,
        index,
      );

    days.push({
      date,

      dayNumber:
        date.getDate(),

      currentMonth:
        date.getMonth() ===
          month.getMonth() &&
        date.getFullYear() ===
          month.getFullYear(),
    });
  }

  return days;
}

function buildSegments({
  bookings,
  weekStart,
  weekEndExclusive,
}: {
  bookings:
    CalendarBooking[];

  weekStart: Date;
  weekEndExclusive: Date;
}): CalendarSegment[] {
  const ordered =
    [...bookings].sort(
      (left, right) =>
        new Date(
          left.checkIn,
        ).getTime() -
        new Date(
          right.checkIn,
        ).getTime(),
    );

  const laneEnds:
    number[] = [];

  return ordered.map(
    (booking) => {
      const rawStart =
        startOfDay(
          new Date(
            booking.checkIn,
          ),
        );

      const rawEnd =
        startOfDay(
          new Date(
            booking.checkOut,
          ),
        );

      const segmentStart =
        rawStart >
        weekStart
          ? rawStart
          : weekStart;

      const segmentEnd =
        rawEnd <
        weekEndExclusive
          ? rawEnd
          : weekEndExclusive;

      const startColumn =
        differenceInDays(
          segmentStart,
          weekStart,
        );

      const endColumn =
        Math.max(
          startColumn,

          differenceInDays(
            segmentEnd,
            weekStart,
          ) - 1,
        );

      let lane =
        laneEnds.findIndex(
          (lastEnd) =>
            startColumn >
            lastEnd,
        );

      if (lane === -1) {
        lane =
          laneEnds.length;

        laneEnds.push(
          endColumn,
        );
      } else {
        laneEnds[lane] =
          endColumn;
      }

      return {
        booking,
        startColumn,
        endColumn,
        lane,
      };
    },
  );
}

function calculateMetricsForMonth(
  bookings:
    CalendarBooking[],
  month: Date,
) {
  return calculateMetrics({
    bookings:
      bookings.filter(
        (booking) =>
          overlapsMonth(
            booking,
            month,
          ),
      ),

    month,
  });
}

function calculateMetrics({
  bookings,
  month,
}: {
  bookings:
    CalendarBooking[];

  month: Date;
}): CalendarMetrics {
  const monthStart =
    new Date(
      month.getFullYear(),
      month.getMonth(),
      1,
    );

  const monthEnd =
    new Date(
      month.getFullYear(),
      month.getMonth() +
        1,
      1,
    );

  const occupied =
    new Set<string>();

  let grossRevenue = 0;

  for (
    const booking
    of bookings
  ) {
    grossRevenue +=
      booking.grossAmount;

    const bookingStart =
      startOfDay(
        new Date(
          booking.checkIn,
        ),
      );

    const bookingEnd =
      startOfDay(
        new Date(
          booking.checkOut,
        ),
      );

    let cursor =
      bookingStart >
      monthStart
        ? bookingStart
        : monthStart;

    const end =
      bookingEnd <
      monthEnd
        ? bookingEnd
        : monthEnd;

    while (
      cursor < end
    ) {
      occupied.add(
        dateKey(
          cursor,
        ),
      );

      cursor =
        addDays(
          cursor,
          1,
        );
    }
  }

  const daysInMonth =
    differenceInDays(
      monthEnd,
      monthStart,
    );

  const occupiedNights =
    occupied.size;

  const freeNights =
    Math.max(
      0,
      daysInMonth -
        occupiedNights,
    );

  const occupancyRate =
    daysInMonth > 0
      ? Math.round(
          (
            occupiedNights /
            daysInMonth
          ) *
            100,
        )
      : 0;

  return {
    occupiedNights,
    freeNights,
    occupancyRate,

    bookingsCount:
      bookings.length,

    grossRevenue,

    currency:
      bookings[0]
        ?.currency ??
      "EUR",
  };
}

function overlapsMonth(
  booking:
    CalendarBooking,
  month: Date,
) {
  const monthStart =
    new Date(
      month.getFullYear(),
      month.getMonth(),
      1,
    );

  const monthEnd =
    new Date(
      month.getFullYear(),
      month.getMonth() +
        1,
      1,
    );

  const checkIn =
    new Date(
      booking.checkIn,
    );

  const checkOut =
    new Date(
      booking.checkOut,
    );

  return (
    checkIn <
      monthEnd &&
    checkOut >
      monthStart
  );
}

function formatDateRange(
  booking:
    CalendarBooking,
) {
  return `${new Date(
    booking.checkIn,
  ).toLocaleDateString(
    "it-IT",
  )} → ${new Date(
    booking.checkOut,
  ).toLocaleDateString(
    "it-IT",
  )}`;
}

function formatMoney(
  amount: number,
  currency: string,
) {
  return new Intl.NumberFormat(
    "it-IT",
    {
      style:
        "currency",

      currency:
        currency ||
        "EUR",
    },
  ).format(
    amount,
  );
}

function startOfDay(
  date: Date,
) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
}

function addDays(
  date: Date,
  amount: number,
) {
  const result =
    new Date(date);

  result.setDate(
    result.getDate() +
      amount,
  );

  return result;
}

function differenceInDays(
  later: Date,
  earlier: Date,
) {
  return Math.round(
    (
      startOfDay(
        later,
      ).getTime() -
      startOfDay(
        earlier,
      ).getTime()
    ) /
      86_400_000,
  );
}

function sameDay(
  left: Date,
  right: Date,
) {
  return (
    left.getFullYear() ===
      right.getFullYear() &&
    left.getMonth() ===
      right.getMonth() &&
    left.getDate() ===
      right.getDate()
  );
}

function dateKey(
  date: Date,
) {
  return [
    date.getFullYear(),

    String(
      date.getMonth() +
        1,
    ).padStart(
      2,
      "0",
    ),

    String(
      date.getDate(),
    ).padStart(
      2,
      "0",
    ),
  ].join("-");
}

function chunk<T>(
  values: T[],
  size: number,
): T[][] {
  const result:
    T[][] = [];

  for (
    let index = 0;
    index <
    values.length;
    index += size
  ) {
    result.push(
      values.slice(
        index,
        index + size,
      ),
    );
  }

  return result;
}

const inputClassName =
  "h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100";
