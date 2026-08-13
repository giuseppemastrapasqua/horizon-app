"use client";

import { useRouter } from "next/navigation";
import {
  BedDouble,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Moon,
  Users,
} from "lucide-react";
import {
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  buildPeriodRevenueRecommendation,
  type RevenueRecommendation,
} from "./property-calendar/revenue/build-period-recommendation";

import {
  buildCalendarDays,
} from "./property-calendar/calendar-grid";
import {
  calculateMetrics,
  calculateMetricsForMonth,
  overlapsMonth,
} from "./property-calendar/metrics";
import {
  formatMoney,
} from "./property-calendar/formatters";
import {
  CalendarWeek,
} from "./property-calendar/CalendarWeek";
import {
  CalendarMetricsPanel,
} from "./property-calendar/CalendarMetricsPanel";
import {
  CompactMetric,
  Legend,
} from "./property-calendar/CalendarUi";
import {
  AvailabilityPanel,
} from "./property-calendar/AvailabilityPanel";
import {
  PricingPanel,
} from "./property-calendar/PricingPanel";
import {
  RevenuePanel,
} from "./property-calendar/RevenuePanel";
import type {
  PropertyCalendarProps,
} from "./property-calendar/types";




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
  priceOverrides,
  availabilityBlocks,
  revenueData,
  savePricingAction,
  closePropertyAction,
  openPropertyAction,
}: PropertyCalendarProps) {
  const router = useRouter();
  const today =
    new Date();

  const [
    isSavingPricing,
    startPricingTransition,
  ] =
    useTransition();

  const [
    pricingMessage,
    setPricingMessage,
  ] =
    useState<string | null>(
      null,
    );

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

  const [
    pricingSource,
    setPricingSource,
  ] =
    useState<
      "MANUAL" | "AI"
    >(
      "MANUAL",
    );

  const [
    cleaningCostInput,
    setCleaningCostInput,
  ] =
    useState(
      String(cleaningCost),
    );

  const [
    showAiPreview,
    setShowAiPreview,
  ] =
    useState(false);

  const [
    revenueRecommendation,
    setRevenueRecommendation,
  ] =
    useState<RevenueRecommendation | null>(
      null,
    );

  const [
    revenueMessage,
    setRevenueMessage,
  ] =
    useState<string | null>(
      null,
    );

  const [
    isSavingAvailability,
    startAvailabilityTransition,
  ] =
    useTransition();

  const [
    availabilityMessage,
    setAvailabilityMessage,
  ] =
    useState<string | null>(
      null,
    );

  const selectedRangeHasClosure =
    useMemo(
      () => {
        if (
          !rangeStart ||
          !rangeEnd
        ) {
          return false;
        }

        return availabilityBlocks.some(
          (block) => {
            const blockStart =
              block.startDate.slice(
                0,
                10,
              );

            const blockEnd =
              block.endDate.slice(
                0,
                10,
              );

            return (
              blockStart <=
                rangeEnd &&
              blockEnd >=
                rangeStart
            );
          },
        );
      },
      [
        availabilityBlocks,
        rangeStart,
        rangeEnd,
      ],
    );

  const isStructureOpen =
    !selectedRangeHasClosure;

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

  const normalizedCleaningCost =
    Number(
      cleaningCostInput,
    ) || 0;

  const estimatedCleaningCost =
    metrics.bookingsCount *
    normalizedCleaningCost;

  const calculateRevenueRecommendations =
    () => {
      const result =
        buildPeriodRevenueRecommendation({
          propertyId,
          rangeStart,
          rangeEnd,
          minimumStay,
          revenueData,
        });

      setRevenueRecommendation(
        result.recommendation,
      );

      setRevenueMessage(
        result.message,
      );

      setShowAiPreview(
        true,
      );
    };
  const applyRevenueRecommendation =
    (
      suggestion:
        RevenueRecommendation,
    ) => {
      setNightlyPrice(
        String(
          suggestion.nightlyPrice,
        ),
      );

      setMinimumStay(
        String(
          suggestion.minimumStay,
        ),
      );

      setPricingSource(
        "AI",
      );

      setRevenueMessage(
        "Suggerimento applicato. Puoi modificarlo prima di salvare.",
      );
    };

  const applyPricing =
    () => {
      if (
        !rangeStart ||
        !rangeEnd
      ) {
        setPricingMessage(
          "Seleziona il periodo Da - A.",
        );

        return;
      }


      const formData =
        new FormData();

      formData.set(
        "propertyId",
        propertyId,
      );

    formData.set(
      "source",
      pricingSource,
    );

      formData.set(
        "startDate",
        rangeStart,
      );

      formData.set(
        "endDate",
        rangeEnd,
      );

      formData.set(
        "nightlyPrice",
        nightlyPrice,
      );

      formData.set(
        "minimumStay",
        minimumStay,
      );

      formData.set(
        "maximumStay",
        maximumStay,
      );

      formData.set(
        "cleaningCost",
        cleaningCostInput,
      );

      setPricingMessage(
        null,
      );

      startPricingTransition(
        async () => {
          try {
            await savePricingAction(
              formData,
            );

            setPricingMessage(
              "Tariffe applicate al periodo.",
            );
          } catch (error) {
            setPricingMessage(
              error instanceof Error
                ? error.message
                : "Impossibile salvare le tariffe.",
            );
          }
        },
      );
    };

  const toggleAvailability = () => {
    if (
      !rangeStart ||
      !rangeEnd
    ) {
      setAvailabilityMessage(
        "Seleziona prima il periodo da modificare.",
      );

      return;
    }

    setAvailabilityMessage(
      null,
    );

    const formData =
      new FormData();

    formData.set(
      "propertyId",
      propertyId,
    );

    formData.set(
      "startDate",
      rangeStart,
    );

    formData.set(
      "endDate",
      rangeEnd,
    );

    startAvailabilityTransition(
      async () => {
        try {
          if (
            isStructureOpen
          ) {
            await closePropertyAction(
              formData,
            );

            setAvailabilityMessage(
              "Struttura chiusa nel periodo selezionato.",
            );
          } else {
            await openPropertyAction(
              formData,
            );

            setAvailabilityMessage(
              "Struttura aperta nel periodo selezionato.",
            );
          }

          /*
           * Operazione completata:
           * rimuove la selezione temporanea
           * e ricarica i dati del calendario.
           */
          setRangeStart("");
          setRangeEnd("");

          router.refresh();
        } catch (
          error
        ) {
          console.error(
            error,
          );

          setAvailabilityMessage(
            "Impossibile aggiornare la disponibilità.",
          );
        }
      },
    );
  };
  const handleCalendarDayClick = (
  date: Date,
) => {
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

  const value =
    `${year}-${month}-${day}`;

  if (
    !rangeStart ||
    rangeEnd
  ) {
    setRangeStart(
      value,
    );

    setRangeEnd(
      "",
    );
  } else if (
    value < rangeStart
  ) {
    setRangeStart(
      value,
    );

    setRangeEnd(
      "",
    );
  } else {
    setRangeEnd(
      value,
    );
  }

  setSelectedMonth(
    new Date(
      date.getFullYear(),
      date.getMonth(),
      1,
    ),
  );

  setRevenueRecommendation(
    null,
  );

  setRevenueMessage(
    null,
  );

  setShowAiPreview(
    false,
  );

  setPricingSource(
    "MANUAL",
  );
};

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
      <div className="border-b border-slate-200 px-4 py-3 md:px-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Calendario struttura
            </p>

            <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-slate-950">
              {propertyName}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                moveMonth(-1)
              }
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
              aria-label="Mese precedente"
            >
              <ChevronLeft
                size={17}
              />
            </button>

            <button
              type="button"
              onClick={goToday}
              className="h-8 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Oggi
            </button>

            <button
              type="button"
              onClick={() =>
                moveMonth(1)
              }
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
              aria-label="Mese successivo"
            >
              <ChevronRight
                size={17}
              />
            </button>

            <div className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold capitalize text-white shadow-sm">
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

        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
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
            className="bg-slate-900"
          />
        </div>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_300px]">
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
            <div className="min-w-[660px]">
              <div className="border-b border-slate-200 bg-white px-4 py-3 md:px-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Periodo visualizzato
              </p>

              <h2 className="mt-1 text-lg font-bold capitalize tracking-tight text-slate-950">
                {selectedMonth.toLocaleDateString(
                  "it-IT",
                  {
                    month:
                      "long",
                    year:
                      "numeric",
                  },
                )}
              </h2>
            </div>

            <p className="hidden text-[10px] text-slate-400 md:block">
              Seleziona le date direttamente dal calendario
            </p>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80">
                {WEEKDAYS.map(
                  (weekday) => (
                    <div
                      key={weekday}
                      className="border-r border-slate-200 px-2 py-1.5 text-center text-[9px] font-semibold uppercase tracking-wider text-slate-400 last:border-r-0"
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
                    priceOverrides={
                      priceOverrides
                    }
                    availabilityBlocks={
                      availabilityBlocks
                    }
                    rangeStart={
                      rangeStart
                    }
                    rangeEnd={
                      rangeEnd
                    }
                    nightlyPrice={
                      nightlyPrice
                    }
                    includedGuests={
                      includedGuests
                    }
                  onDayClick={handleCalendarDayClick}
                  />
                ),
              )}
            </div>
          </div>

          <RevenuePanel
            showAiPreview={
              showAiPreview
            }
            recommendation={
              revenueRecommendation
            }
            message={
              revenueMessage
            }
            onAnalyze={
              calculateRevenueRecommendations
            }
            onApplyRecommendation={
              applyRevenueRecommendation
            }
          />
          <CalendarMetricsPanel
            metrics={metrics}
            previousYearMetrics={previousYearMetrics}
            estimatedCleaningCost={estimatedCleaningCost}
          />

      </div>
<aside className="bg-slate-50/55 p-3">
          <div className="space-y-3">

            <PricingPanel
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              nightlyPrice={nightlyPrice}
              minimumStay={minimumStay}
              maximumStay={maximumStay}
              includedGuests={includedGuests}
              extraGuestPrice={extraGuestPrice}
              cleaningCostInput={cleaningCostInput}
              pricingMessage={pricingMessage}
              isSavingPricing={isSavingPricing}
              onRangeStartChange={(value) => {
            setRangeStart(value);

            if (value) {
              const date =
                new Date(
                  `${value}T00:00:00`,
                );

              setSelectedMonth(
                new Date(
                  date.getFullYear(),
                  date.getMonth(),
                  1,
                ),
              );
            }

            if (
              !rangeEnd ||
              rangeEnd < value
            ) {
              setRangeEnd(value);
            }

            setRevenueRecommendation(null);
            setRevenueMessage(null);
            setShowAiPreview(false);
            setPricingSource("MANUAL");
          }}
          onRangeEndChange={(value) => {
            setRangeEnd(value);

            if (value) {
              const date =
                new Date(
                  `${value}T00:00:00`,
                );

              setSelectedMonth(
                new Date(
                  date.getFullYear(),
                  date.getMonth(),
                  1,
                ),
              );
            }

            setRevenueRecommendation(null);
            setRevenueMessage(null);
            setShowAiPreview(false);
            setPricingSource("MANUAL");
          }}
          onNightlyPriceChange={(value) => {
                setNightlyPrice(value);
                setPricingSource("MANUAL");
              }}
              onMinimumStayChange={setMinimumStay}
              onMaximumStayChange={setMaximumStay}
              onIncludedGuestsChange={setIncludedGuests}
              onExtraGuestPriceChange={setExtraGuestPrice}
              onCleaningCostChange={setCleaningCostInput}
              onManualMode={() => {
                setPricingSource("MANUAL");
                setShowAiPreview(false);
              }}
              onApplyPricing={applyPricing}
            />
            <AvailabilityPanel
              isStructureOpen={isStructureOpen}
              isSaving={isSavingAvailability}
              message={availabilityMessage}
              disabled={
                !rangeStart ||
                !rangeEnd
              }
              onToggle={toggleAvailability}
            />


          </div>
        </aside>
      </div>
    </section>
  );
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













