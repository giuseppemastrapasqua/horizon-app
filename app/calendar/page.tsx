import { CalendarRangeController } from "@/components/calendar/CalendarRangeController";
import { CalendarPeriodEditor } from "./components/CalendarPeriodEditor";
import Link from "next/link";

import {
  ArrowRight,
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  LockKeyhole,
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
  calculateDerivedRatePrice,
  resolveStandardRateForDate,
} from "@/lib/pricing/resolve-standard-rate";

import {
} from "@/lib/revenue/get-property-revenue-data";

import {
  getChannelPricingConfig,
} from "@/lib/pricing/get-channel-pricing-config";

import {
  getPricingChannelFromConfig,
} from "@/lib/pricing/get-pricing-channel-from-config";

import {
  buildChannelPrices,
} from "@/lib/pricing/channel-pricing";

import {
  ChannelLogo,
} from "./components/ChannelLogo";

import {
  CalendarDayPricing,
} from "./components/CalendarDayPricing";

import {
  applyRevenueAiAction,
  saveCalendarPeriodAction,
} from "./actions";

type CalendarPageProps = {
  searchParams: Promise<{
    month?:
      | string
      | string[];

    propertyId?:
      | string
      | string[];

    from?:
      | string
      | string[];

    to?:
      | string
      | string[];
  }>;
};

type RatePlanData = {
  id: string;
  name: string;
  code: string;
  active: boolean;
  isDefault: boolean;
  basePrice: number;
  minimumStay: number;
  maximumStay: number | null;
  rules: Array<{
    adjustmentValue:
      number | null;
  }>;
};

export default async function CalendarPage({
  searchParams,
}: CalendarPageProps) {
  const params =
    await searchParams;

  const requestedMonth =
    getStringParam(
      params.month,
    );

  const requestedPropertyId =
    getStringParam(
      params.propertyId,
    );

  const monthStart =
    parseMonth(
      requestedMonth,
    );

  const nextMonth =
    new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      1,
    );

  const monthEnd =
    new Date(
      nextMonth.getTime() - 1,
    );

  const previousMonth =
    new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() - 1,
      1,
    );

  const followingMonth =
    new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      1,
    );

  const properties =
    await prisma.property.findMany({
      orderBy: {
        name:
          "asc",
      },

      select: {
        id: true,
        name: true,
        address: true,
        city: true,
      },
    });

  const selectedProperty =
    properties.find(
      (property) =>
        property.id ===
        requestedPropertyId,
    ) ??
    properties[0] ??
    null;

  const channelConnections =
    selectedProperty
      ? await prisma.integrationConnectionProperty.findMany({
          where: {
            propertyId:
              selectedProperty.id,
          },

          select: {
            config: true,

            connection: {
              select: {
                connectorKey: true,
              },
            },
          },
        })
      : [];

  const channelCommissionByChannel =
    new Map(
      channelConnections
        .map((item) => {
          const channel =
            getPricingChannelFromConfig(
              item.config,
            );

          if (!channel) {
            return null;
          }

          return [
            channel,
            getChannelPricingConfig(
              item.config,
            ).commissionPercent,
          ] as const;
        })
        .filter(
          (
            item,
          ): item is readonly [
            "BOOKING" | "AIRBNB" | "VRBO" | "HORIZON",
            number | null,
          ] => item !== null,
        ),
    );
  const propertyData =
    selectedProperty
      ? await prisma.property.findUnique({
          where: {
            id:
              selectedProperty.id,
          },

          select: {
            id: true,
            name: true,
            horizonCommissionPercent: true,

            bookings: {
              where: {
                bookingStatus: {
                  not:
                    "CANCELLED",
                },

                checkIn: {
                  lt:
                    nextMonth,
                },

                checkOut: {
                  gt:
                    monthStart,
                },
              },

              orderBy: {
                checkIn:
                  "asc",
              },

              select: {
                id: true,
                guestName: true,
                checkIn: true,
                checkOut: true,
                guests: true,
                channel: true,
                bookingStatus: true,
              },
            },

            ratePlans: {
              orderBy: [
                {
                  isDefault:
                    "desc",
                },
                {
                  createdAt:
                    "asc",
                },
              ],

              select: {
                id: true,
                name: true,
                code: true,
                active: true,
                isDefault: true,
                basePrice: true,
                minimumStay: true,
                maximumStay: true,

                rules: {
                  where: {
                    name: {
                      startsWith:
                        "HORIZON_RATE_DISCOUNT_",
                    },
                  },

                  orderBy: {
                    priority:
                      "desc",
                  },

                  select: {
                    adjustmentValue:
                      true,
                  },
                },
              },
            },

            priceOverrides: {
              where: {
                startDate: {
                  lt:
                    nextMonth,
                },

                endDate: {
                  gte:
                    monthStart,
                },
              },

              orderBy: {
                updatedAt:
                  "desc",
              },

              select: {
                id: true,
                startDate: true,
                endDate: true,
                nightlyPrice: true,
                minimumStay: true,
                maximumStay: true,
                source: true,
              },
            },

            availabilityBlocks: {
              where: {
                startDate: {
                  lt:
                    nextMonth,
                },

                endDate: {
                  gte:
                    monthStart,
                },
              },

              orderBy: {
                startDate:
                  "asc",
              },

              select: {
                id: true,
                startDate: true,
                endDate: true,
                source: true,
                note: true,
              },
            },
          },
        })
      : null;

  const ratePlans: RatePlanData[] =
    propertyData?.ratePlans.map(
      (ratePlan) => ({
        id:
          ratePlan.id,

        name:
          ratePlan.name,

        code:
          ratePlan.code,

        active:
          ratePlan.active,

        isDefault:
          ratePlan.isDefault,

        basePrice:
          Number(
            ratePlan.basePrice,
          ),

        minimumStay:
          ratePlan.minimumStay,

        maximumStay:
          ratePlan.maximumStay,

        rules:
          ratePlan.rules.map(
            (rule) => ({
              adjustmentValue:
                rule.adjustmentValue ===
                null
                  ? null
                  : Number(
                      rule.adjustmentValue,
                    ),
            }),
          ),
      }),
    ) ?? [];

  const standardRate =
    ratePlans.find(
      (ratePlan) =>
        ratePlan.code ===
        "STANDARD",
    ) ??
    ratePlans.find(
      (ratePlan) =>
        ratePlan.isDefault,
    ) ??
    null;


  console.log("CALENDAR STANDARD DEBUG", {
    propertyId:
      selectedProperty?.id ?? null,

    propertyName:
      selectedProperty?.name ?? null,

    standardRate,

    ratePlans:
      ratePlans.map(
        (ratePlan) => ({
          code: ratePlan.code,
          basePrice: ratePlan.basePrice,
          active: ratePlan.active,
          isDefault: ratePlan.isDefault,
        }),
      ),
  });
  const requestedFrom =
    parseOptionalCalendarDate(
      getStringParam(
        params.from,
      ),
    ) ??
    monthStart;

  const requestedTo =
    parseOptionalCalendarDate(
      getStringParam(
        params.to,
      ),
    ) ??
    monthEnd;

  const rangeFrom =
    requestedFrom <= requestedTo
      ? requestedFrom
      : requestedTo;

  const rangeTo =
    requestedTo >= requestedFrom
      ? requestedTo
      : requestedFrom;

  const resolvedStandard =
    propertyData
      ? resolveStandardRateForDate({
          date:
            rangeFrom,

          configuredPrice:
            standardRate?.basePrice ??
            0,

          priceOverrides:
            propertyData.priceOverrides,
        })
      : {
          price: 0,
          source:
            "CONFIGURED" as const,
          override: null,
        };

  /*
   * selectedStandardPrice resta disponibile
   * per i form e le preview già esistenti,
   * ma ora deriva dal resolver centrale.
   */
  const selectedStandardPrice =
    resolvedStandard.price;

  const effectiveStandardOverride =
    resolvedStandard.override;

  const effectiveStandardPrice =
    resolvedStandard.price;

  const effectiveStandardSource =
    resolvedStandard.source === "AI"
      ? "Revenue AI"
      : resolvedStandard.source === "MANUAL"
        ? "Manuale"
        : "Configurata";

  const isRevenueAiMode =
    resolvedStandard.source === "AI";

  const isManualMode =
    resolvedStandard.source === "MANUAL";


  const selectedPeriodClosed =
    propertyData
      ? isCalendarRangeFullyBlocked({
          from:
            rangeFrom,

          to:
            rangeTo,

          blocks:
            propertyData.availabilityBlocks,
        })
      : false;

  const calendarDays =
    buildCalendarDays(
      monthStart,
    );

  const monthLabel =
    formatMonthLabel(
      monthStart,
    );

  return (
    <>
      <Navigation />

      <AppShell
        title=""
        subtitle=""
      >
                <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          <h1 className="text-[22px] font-black tracking-tight text-slate-950">
            Calendario
          </h1>

          <span className="text-[16px] font-bold text-blue-600">
            {monthLabel}
          </span>

          {selectedProperty ? (
            <span className="text-[9px] font-medium text-slate-400">
              {selectedProperty.name}
            </span>
          ) : null}
        </div>

        <section className="mb-3 flex flex-wrap items-end justify-end gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={buildCalendarUrl({
                month:
                  formatMonthParam(
                    previousMonth,
                  ),

                propertyId:
                  selectedProperty?.id ??
                  "",
              })}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              aria-label="Mese precedente"
            >
              <ChevronLeft
                size={16}
              />
            </Link>

            <form
              method="get"
              className="flex flex-wrap items-end gap-2"
            >
              <label className="block">
                <span className="mb-1 block text-[8px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Mese
                </span>

                <input
                  type="month"
                  name="month"
                  defaultValue={
                    formatMonthParam(
                      monthStart,
                    )
                  }
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-semibold text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[8px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Struttura
                </span>

                <select
                  name="propertyId"
                  defaultValue={
                    selectedProperty?.id ??
                    ""
                  }
                  className="h-10 min-w-[240px] rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-semibold text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                >
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
              </label>

              <button
                type="submit"
                className="h-10 rounded-xl bg-blue-600 px-4 text-[10px] font-semibold text-white transition hover:bg-blue-700"
              >
                Apri
              </button>
            </form>

            <Link
              href={buildCalendarUrl({
                month:
                  formatMonthParam(
                    followingMonth,
                  ),

                propertyId:
                  selectedProperty?.id ??
                  "",
              })}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              aria-label="Mese successivo"
            >
              <ChevronRight
                size={16}
              />
            </Link>
          </div>
        </section>

        {!propertyData ? (
          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <Building2
              size={24}
              className="mx-auto text-blue-500"
            />

            <h2 className="mt-3 text-sm font-bold text-slate-900">
              Nessuna struttura disponibile
            </h2>
          </section>
        ) : (
          <div className="space-y-4">
            <div className="min-w-0 space-y-4">
              <div className="rounded-[22px] border border-slate-200/70 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.045)]">
                <div className="flex items-start justify-between gap-8">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <span className="text-[7px] font-black uppercase tracking-[0.14em] text-slate-400">
                        Legenda
                      </span>

                      <span className="flex items-center gap-1.5 text-[8px] font-semibold text-emerald-700">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Aperto
                      </span>

                      <span className="flex items-center gap-1.5 text-[8px] font-semibold text-rose-700">
                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                        Chiuso
                      </span>

                      <span className="flex items-center gap-1.5 text-[8px] font-semibold text-emerald-600">
                        <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-black">
                          IN
                        </span>
                        Check-in
                      </span>

                      <span className="flex items-center gap-1.5 text-[8px] font-semibold text-rose-600">
                        <span className="rounded-md bg-rose-50 px-1.5 py-0.5 font-black">
                          OUT
                        </span>
                        Check-out
                      </span>

                      <span className="flex items-center gap-1.5 text-[8px] font-semibold text-slate-600">
                        <span className="h-2 w-2 rounded-full bg-slate-400" />
                        Prenotato
                      </span>

                      <span className="flex items-center gap-1.5 text-[8px] font-semibold text-violet-700">
                        <span className="flex h-4 w-4 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-indigo-600 text-[6px] font-black text-white">
                          ✦
                        </span>
                        Revenue AI
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-5 border-t border-slate-100 pt-3">
                      <span className="flex items-center gap-1.5 text-[7px] font-bold text-slate-600">
                        <ChannelLogo channel="BOOKING" size={15} />
                        Booking
                      </span>

                      <span className="flex items-center gap-1.5 text-[7px] font-bold text-slate-600">
                        <ChannelLogo channel="AIRBNB" size={15} />
                        Airbnb
                      </span>

                      <span className="flex items-center gap-1.5 text-[7px] font-bold text-slate-600">
                        <ChannelLogo channel="VRBO" size={15} />
                        Vrbo
                      </span>

                      <span className="flex items-center gap-1.5 text-[7px] font-bold text-slate-600">
                        <ChannelLogo channel="HORIZON" size={15} />
                        Horizon
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-start gap-3">
                    <CalendarRangeController
                      key={`${toCalendarDateValue(rangeFrom)}-${toCalendarDateValue(rangeTo)}-${selectedProperty?.id ?? ""}`}
                      from={toCalendarDateValue(rangeFrom)}
                      to={toCalendarDateValue(rangeTo)}
                      propertyId={selectedProperty?.id ?? ""}
                      month={formatMonthParam(monthStart)}
                    />

                    <CalendarPeriodEditor
                      propertyId={selectedProperty?.id ?? ""}
                      month={formatMonthParam(monthStart)}
                      from={toCalendarDateValue(rangeFrom)}
                      to={toCalendarDateValue(rangeTo)}
                      price={effectiveStandardPrice}
                      source={effectiveStandardSource}
                      minimumStay={standardRate?.minimumStay ?? 1}
                      closed={selectedPeriodClosed}
                      revenueAiAvailable={Boolean(standardRate)}
                    />
                  </div>
                </div>
              </div>
              <section className="min-w-0 overflow-hidden rounded-[24px] border border-slate-200/70 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.055)]">
              <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60">
                {[
                  "Lun",
                  "Mar",
                  "Mer",
                  "Gio",
                  "Ven",
                  "Sab",
                  "Dom",
                ].map(
                  (weekday) => (
                    <div
                      key={
                        weekday
                      }
                      className="px-2 py-2.5 text-center text-[7px] font-black uppercase tracking-[0.16em] text-slate-400"
                    >
                      {weekday}
                    </div>
                  ),
                )}
              </div>

              <div className="grid grid-cols-7">
                {calendarDays.map(
                  (day) => {
                    const inMonth =
                      day.getMonth() ===
                      monthStart.getMonth();

                    const bookings =
                      propertyData.bookings.filter(
                        (booking) =>
                          isNightOccupied(
                            day,
                            booking.checkIn,
                            booking.checkOut,
                          ),
                      );

                    const checkIns =
                      propertyData.bookings.filter(
                        (booking) =>
                          isSameDay(
                            day,
                            booking.checkIn,
                          ),
                      );

                    const checkOuts =
                      propertyData.bookings.filter(
                        (booking) =>
                          isSameDay(
                            day,
                            booking.checkOut,
                          ),
                      );

                    const block =
                      propertyData.availabilityBlocks.find(
                        (
                          availabilityBlock,
                        ) =>
                          isDateInsideRange(
                            day,
                            availabilityBlock.startDate,
                            availabilityBlock.endDate,
                          ),
                      );

                    const calendarDate =
                      toCalendarDateValue(
                        day,
                      );

                    const dayStandard =
                      resolveStandardRateForDate({
                        date:
                          day,

                        configuredPrice:
                          standardRate?.basePrice ??
                          0,

                        priceOverrides:
                          propertyData.priceOverrides,
                      });

                    const dayOriginPrice =
                      dayStandard.price;

                    const dayOriginSource =
                      dayStandard.source;
                    const dayOriginChannelPrices =
                      buildChannelPrices({
                        baseRevenuePrice:
                          dayOriginPrice,

                        configs: [
                          {
                            channel: "BOOKING",
                            commissionPercent:
                              channelCommissionByChannel.get(
                                "BOOKING",
                              ) ?? null,
                          },
                          {
                            channel: "AIRBNB",
                            commissionPercent:
                              channelCommissionByChannel.get(
                                "AIRBNB",
                              ) ?? null,
                          },
                          {
                            channel: "VRBO",
                            commissionPercent:
                              channelCommissionByChannel.get(
                                "VRBO",
                              ) ?? null,
                          },
                          {
                            channel: "HORIZON",
                            commissionPercent:
                              propertyData.horizonCommissionPercent != null
                                ? Number(
                                    propertyData.horizonCommissionPercent,
                                  )
                                : null,
                          },
                        ],
                      });

                    const isToday =
                      isSameDay(
                        day,
                        new Date(),
                      );

                    const isWeekend =
                      day.getDay() === 0 ||
                      day.getDay() === 6;

                    return (
                      <div
                        key={
                          day.toISOString()
                        }
                        data-calendar-date={
                          toCalendarDateValue(
                            day,
                          )
                        }
                        className={[
                          "group relative min-h-[116px] border-b border-r border-slate-100 px-3.5 py-3 transition-all duration-200 hover:z-10 hover:bg-blue-50/30",
                          inMonth
                            ? isWeekend
                              ? "bg-slate-50/35"
                              : "bg-white"
                            : "bg-slate-50/40",
                          isToday
                            ? "bg-blue-50/60"
                            : "",
                        ].join(
                          " ",
                        )}
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span
                            className={[
                              "flex h-7 min-w-7 items-center justify-center rounded-lg px-1 text-[15px] font-semibold tracking-[-0.02em] transition-all",
                              isToday
                                ? "bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.22)]"
                                : inMonth
                                  ? "text-[#0F172A]"
                                  : "text-slate-300",
                            ].join(
                              " ",
                            )}
                          >
                            {
                              day.getDate()
                            }
                          </span>

                          {block ? (
                            <span
                              title={
                                block.note ??
                                "DisponibilitÃ  bloccata"
                              }
                              className="flex h-5 w-5 items-center justify-center rounded-md bg-rose-50 text-rose-500"
                            >
                              <LockKeyhole
                                size={11}
                              />
                            </span>
                          ) : bookings.length >
                            0 ? (
                            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-50 text-emerald-500">
                              <CircleCheck
                                size={11}
                              />
                            </span>
                          ) : (
                            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-50 text-slate-300">
                              <CircleX
                                size={11}
                              />
                            </span>
                          )}
                        </div>

                        {inMonth ? (
                          <>

                            <div className="mb-2">
                              <CalendarDayPricing
                                dateKey={
                                  calendarDate
                                }
                                dayLabel={day.toLocaleDateString(
                                  "it-IT",
                                  {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  },
                                )}
                                price={
                                  dayOriginPrice
                                }
                                source={
                                  dayOriginSource
                                }
                                channels={
                                  dayOriginChannelPrices
                                }
                                minimumStay={
                                  standardRate?.minimumStay ??
                                  1
                                }
                                closed={
                                  Boolean(
                                    block,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              {checkIns.map(
                                (
                                  booking,
                                ) => (
                                  <Link
                                    key={`in-${booking.id}`}
                                    href={`/bookings/${booking.id}`}
                                    className="group/event flex min-w-0 items-center gap-1.5 rounded-md bg-emerald-50/70 px-1.5 py-1 text-[6px] font-bold text-emerald-700 transition hover:bg-emerald-100"
                                    title={`Check-in · ${booking.guestName}`}
                                  >
                                    <span className="shrink-0 rounded bg-emerald-100 px-1 py-0.5 text-[5px] font-black uppercase tracking-[0.08em] text-emerald-700">
                                      IN
                                    </span>

                                    <span className="min-w-0 truncate">
                                      {
                                        booking.guestName
                                      }
                                    </span>
                                  </Link>
                                ),
                              )}

                              {checkOuts.map(
                                (
                                  booking,
                                ) => (
                                  <Link
                                    key={`out-${booking.id}`}
                                    href={`/bookings/${booking.id}`}
                                    className="group/event flex min-w-0 items-center gap-1.5 rounded-md bg-rose-50/70 px-1.5 py-1 text-[6px] font-bold text-rose-700 transition hover:bg-rose-100"
                                    title={`Check-out · ${booking.guestName}`}
                                  >
                                    <span className="shrink-0 rounded bg-rose-100 px-1 py-0.5 text-[5px] font-black uppercase tracking-[0.08em] text-rose-700">
                                      OUT
                                    </span>

                                    <span className="min-w-0 truncate">
                                      {
                                        booking.guestName
                                      }
                                    </span>
                                  </Link>
                                ),
                              )}

                              {bookings
                                .filter(
                                  (
                                    booking,
                                  ) =>
                                    !isSameDay(
                                      day,
                                      booking.checkIn,
                                    ) &&
                                    !isSameDay(
                                      day,
                                      booking.checkOut,
                                    ),
                                )
                                .slice(
                                  0,
                                  1,
                                )
                                .map(
                                  (
                                    booking,
                                  ) => (
                                    <Link
                                      key={`stay-${booking.id}`}
                                      href={`/bookings/${booking.id}`}
                                      className="flex min-w-0 items-center gap-1.5 rounded-md bg-slate-100/70 px-1.5 py-1 text-[6px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
                                    >
                                      {
                                        booking.guestName
                                      }
                                    </Link>
                                  ),
                                )}
                            </div>
                          </>
                        ) : null}
                      </div>
                    );
                  },
                )}
              </div>
              </section>


            </div>


            <div className="space-y-4">
              <section className="hidden">
                <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-blue-600">
                  Gestione periodo
                </p>

                <h3 className="mt-1 text-sm font-bold text-slate-900">
                  Prezzo e disponibilità
                </h3>

                                <CalendarRangeController
                  key={`${toCalendarDateValue(rangeFrom)}-${toCalendarDateValue(rangeTo)}-${selectedProperty?.id ?? ""}`}
                  from={
                    toCalendarDateValue(
                      rangeFrom,
                    )
                  }
                  to={
                    toCalendarDateValue(
                      rangeTo,
                    )
                  }
                  propertyId={
                    selectedProperty?.id ??
                    ""
                  }
                  month={
                    formatMonthParam(
                      monthStart,
                    )
                  }
                />

                <div className="mt-4 grid gap-3 border-t border-[#E2E8F0] pt-4 lg:grid-cols-[minmax(180px,280px)_220px_minmax(180px,1fr)] lg:items-end">
                  <div className="mb-1.5">
                    <p className="text-[7px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Modalità prezzo
                    </p>

                    <p className="mt-1 text-[8px] leading-4 text-slate-500">
                      Scegli come determinare il prezzo del periodo selezionato.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 p-1 shadow-inner">
                    <form
                      action={
                        applyRevenueAiAction
                      }
                    >
                      <input
                        type="hidden"
                        name="propertyId"
                        value={
                          selectedProperty?.id ??
                          ""
                        }
                      />

                      <input
                        type="hidden"
                        name="month"
                        value={
                          formatMonthParam(
                            monthStart,
                          )
                        }
                      />

                      <input
                        type="hidden"
                        name="from"
                        value={
                          toCalendarDateValue(
                            rangeFrom,
                          )
                        }
                      />

                      <input
                        type="hidden"
                        name="to"
                        value={
                          toCalendarDateValue(
                            rangeTo,
                          )
                        }
                      />

                      <button
                        type="submit"
                        className={[
                          "relative h-full w-full rounded-xl px-3 py-3 text-left transition-all duration-200",
                          isRevenueAiMode
                            ? "bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.22)]"
                            : "bg-transparent text-slate-600 hover:bg-white hover:shadow-sm",
                        ].join(
                          " ",
                        )}
                      >
                        <span className="flex items-start gap-2">
                          <span
                            className={[
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[9px] font-black transition",
                              isRevenueAiMode
                                ? "bg-white/15 text-white ring-1 ring-white/20"
                                : "bg-[#E0F2FE] text-[#2563EB]",
                            ].join(
                              " ",
                            )}
                          >
                            ✦
                          </span>

                          <span className="min-w-0">
                            <strong
                              className={[
                                "block text-[9px] font-black",
                                isRevenueAiMode
                                  ? "text-white"
                                  : "text-slate-800",
                              ].join(
                                " ",
                              )}
                            >
                              Revenue AI
                            </strong>

                            <span
                              className={[
                                "mt-0.5 block text-[6px] leading-3",
                                isRevenueAiMode
                                  ? "text-blue-100"
                                  : "text-slate-300",
                              ].join(
                                " ",
                              )}
                            >
                              Ottimizzazione dinamica
                            </span>

                            {isRevenueAiMode ? (
                              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[6px] font-black uppercase tracking-[0.08em] text-white ring-1 ring-white/15">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                                Attiva
                              </span>
                            ) : null}
                          </span>
                        </span>
                      </button>
                    </form>

                    <div
                      className={[
                        "relative rounded-xl px-3 py-3 transition-all duration-200",
                        isManualMode
                          ? "bg-[#0F172A] text-white shadow-sm"
                          : "bg-transparent text-slate-600",
                      ].join(
                        " ",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={[
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[9px] font-black",
                            isManualMode
                              ? "bg-white/10 text-white ring-1 ring-white/15"
                              : "bg-white text-slate-700 shadow-sm",
                          ].join(
                            " ",
                          )}
                        >
                          €
                        </span>

                        <span className="min-w-0">
                          <strong
                            className={[
                              "block text-[9px] font-black",
                              isManualMode
                                ? "text-white"
                                : "text-slate-800",
                            ].join(
                              " ",
                            )}
                          >
                            Manuale
                          </strong>

                          <span
                            className={[
                              "mt-0.5 block text-[6px] leading-3",
                              isManualMode
                                ? "text-slate-300"
                                : "text-slate-300",
                            ].join(
                              " ",
                            )}
                          >
                            Prezzo personalizzato
                          </span>

                          {isManualMode ? (
                            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[6px] font-black uppercase tracking-[0.08em] text-white ring-1 ring-white/10">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                              Attiva
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/70 px-2.5 py-2.5">
                      <p className="text-[6px] font-black uppercase tracking-[0.12em] text-slate-400">
                        Prezzo
                      </p>

                      <strong className="mt-1 block text-[13px] font-black tracking-[-0.04em] text-slate-950 tabular-nums">
                        {formatCurrency(
                          effectiveStandardPrice,
                        )}
                      </strong>

                      <p className="mt-0.5 truncate text-[6px] font-semibold text-slate-400">
                        {effectiveStandardSource}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/70 px-2.5 py-2.5">
                      <p className="text-[6px] font-black uppercase tracking-[0.12em] text-slate-400">
                        Min stay
                      </p>

                      <strong className="mt-1 block text-[13px] font-black tracking-[-0.04em] text-slate-950">
                        {standardRate?.minimumStay ??
                          1}
                      </strong>

                      <p className="mt-0.5 text-[6px] font-semibold text-slate-400">
                        notti
                      </p>
                    </div>

                    <div
                      className={[
                        "rounded-xl border px-2.5 py-2.5",
                        selectedPeriodClosed
                          ? "border-rose-100 bg-rose-50/60"
                          : "border-emerald-100 bg-emerald-50/60",
                      ].join(
                        " ",
                      )}
                    >
                      <p className="text-[6px] font-black uppercase tracking-[0.12em] text-slate-400">
                        Stato
                      </p>

                      <strong
                        className={[
                          "mt-1 block text-[10px] font-black",
                          selectedPeriodClosed
                            ? "text-rose-600"
                            : "text-emerald-600",
                        ].join(
                          " ",
                        )}
                      >
                        {selectedPeriodClosed
                          ? "Chiuso"
                          : "Aperto"}
                      </strong>

                      <span
                        className={[
                          "mt-1 block h-1.5 w-1.5 rounded-full",
                          selectedPeriodClosed
                            ? "bg-rose-400"
                            : "bg-emerald-400",
                        ].join(
                          " ",
                        )}
                      />
                    </div>
                  </div>

                  <form
                    action={
                      saveCalendarPeriodAction
                    }
                    className="mt-4 grid gap-3 border-t border-[#E2E8F0] pt-4 lg:grid-cols-[minmax(180px,280px)_220px_minmax(180px,1fr)] lg:items-end"
                  >
                    <input
                      type="hidden"
                      name="propertyId"
                      value={
                        selectedProperty?.id ??
                        ""
                      }
                    />

                    <input
                      type="hidden"
                      name="month"
                      value={
                        formatMonthParam(
                          monthStart,
                        )
                      }
                    />

                    <input
                      type="hidden"
                      name="from"
                      value={
                        toCalendarDateValue(
                          rangeFrom,
                        )
                      }
                    />

                    <input
                      type="hidden"
                      name="to"
                      value={
                        toCalendarDateValue(
                          rangeTo,
                        )
                      }
                    />

                    <label
                      className={[
                        "block rounded-xl transition",
                        isRevenueAiMode
                          ? "opacity-60"
                          : "opacity-100",
                      ].join(
                        " ",
                      )}
                    >
                      <span className="mb-1 block text-[7px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Override manuale
                      </span>

                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                          €
                        </span>

                        <input
                          type="number"
                          name="standardRate"
                          min="1"
                          step="0.01"
                          defaultValue={
                            selectedStandardPrice
                          }
                          className={[
                            "h-10 w-full rounded-xl border pl-7 pr-3 text-[11px] font-bold outline-none transition",
                            isRevenueAiMode
                              ? "border-slate-100 bg-slate-50 text-slate-400"
                              : isManualMode
                                ? "border-slate-300 bg-white text-slate-950 shadow-sm focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                                : "border-slate-200 bg-white text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-100",
                          ].join(
                            " ",
                          )}
                        />
                      </div>
                    </label>

                    <p className="mb-1 mt-3 text-[7px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Disponibilità
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="submit"
                        name="availability"
                        value="OPEN"
                        className="rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-[8px] font-bold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        Aperto
                      </button>

                      <button
                        type="submit"
                        name="availability"
                        value="CLOSED"
                        className="rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-[8px] font-bold text-rose-700 transition hover:bg-rose-100"
                      >
                        Chiuso
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-2 text-[7px]">
                      <span className="text-slate-400">
                        Stato periodo
                      </span>

                      <strong
                        className={
                          selectedPeriodClosed
                            ? "text-rose-600"
                            : "text-emerald-600"
                        }
                      >
                        {selectedPeriodClosed
                          ? "Chiuso"
                          : "Aperto"}
                      </strong>
                    </div>
                  </form>

                  <Link
                    href={`/calendar/revenue-ai?propertyId=${selectedProperty?.id ?? ""}&from=${toCalendarDateValue(
                      rangeFrom,
                    )}&to=${toCalendarDateValue(
                      rangeTo,
                    )}`}
                    className="group mt-4 flex items-center justify-between rounded-xl border border-[#2563EB] bg-[#2563EB] px-4 py-3 text-white shadow-sm transition hover:border-[#1D4ED8] hover:bg-[#1D4ED8]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#2563EB] shadow-sm">
                        <BarChart3
                          size={15}
                        />
                      </span>

                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">
                          Horizon Revenue Intelligence
                        </p>

                        <p className="mt-0.5 text-[12px] font-semibold text-[#0F172A]">
                          Apri analisi mercato
                        </p>
                      </div>
                    </div>

                    <ArrowRight
                      size={15}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </Link>
                </div>
              </section>


              <section className="rounded-[24px] border border-slate-200/70 bg-white p-5 shadow-[0_16px_42px_rgba(15,23,42,0.06)]">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[7px] font-black uppercase tracking-[0.16em] text-blue-600">
                      Pricing
                    </p>

                    <h3 className="mt-1 text-sm font-black text-slate-950">
                      Tariffe attive
                    </h3>

                    <p className="mt-1 text-[7px] text-slate-400">
                      Prezzi calcolati sulla Standard effettiva del periodo
                    </p>
                  </div>

                  <Link
                    href={`/rate-types?propertyId=${encodeURIComponent(
                      selectedProperty?.id ??
                        "",
                    )}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[7px] font-bold text-slate-600 transition hover:border-blue-200 hover:text-blue-700 hover:shadow-sm"
                  >
                    Configura

                    <ArrowRight
                      size={11}
                    />
                  </Link>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {ratePlans
                    .filter(
                      (ratePlan) =>
                        ratePlan.active,
                    )
                    .map(
                      (
                        ratePlan,
                      ) => {
                        const adjustment =
                          getRateAdjustment(
                            ratePlan,
                          );

                        const isStandard =
                          ratePlan.code ===
                          "STANDARD";

                        const preview =
                          isStandard
                            ? effectiveStandardPrice
                            : calculateDerivedRatePrice(
                                effectiveStandardPrice,
                                adjustment,
                              );

                        return (
                          <div
                            key={
                              ratePlan.id
                            }
                            className={[
                              "relative min-h-[150px] overflow-hidden rounded-[20px] border p-4 transition-all duration-300 hover:-translate-y-1",
                              isStandard
                                ? "border-violet-300/70 bg-gradient-to-br from-violet-50 via-white to-indigo-50 shadow-[0_14px_32px_rgba(109,40,217,0.11)]"
                                : "border-slate-200/70 bg-gradient-to-br from-white via-white to-blue-50/40 shadow-[0_8px_24px_rgba(15,23,42,0.04)] hover:border-blue-200 hover:shadow-[0_16px_34px_rgba(37,99,235,0.09)]",
                            ].join(
                              " ",
                            )}
                          >
                            {isStandard ? (
                              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
                            ) : null}

                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {isStandard ? (
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-indigo-600 text-[7px] font-black text-white shadow-sm">
                                      {effectiveStandardSource ===
                                      "Revenue AI"
                                        ? "✦"
                                        : "€"}
                                    </span>
                                  ) : null}

                                  <strong className="truncate text-[9px] font-black text-slate-800">
                                    {
                                      ratePlan.name
                                    }
                                  </strong>
                                </div>

                                <p className="mt-1.5 text-[6px] font-bold uppercase tracking-[0.1em] text-slate-400">
                                  {isStandard
                                    ? `Standard · ${effectiveStandardSource}`
                                    : `${adjustment >= 0 ? "+" : ""}${adjustment}% da Standard`}
                                </p>
                              </div>

                              <span
                                className={[
                                  "shrink-0 rounded-full px-2 py-0.5 text-[6px] font-black uppercase tracking-[0.08em]",
                                  isStandard
                                    ? "bg-indigo-100 text-indigo-700"
                                    : "bg-slate-100 text-slate-500",
                                ].join(
                                  " ",
                                )}
                              >
                                {isStandard
                                  ? "Base"
                                  : "Derivata"}
                              </span>
                            </div>

                            <div className="mt-4 flex items-end justify-between gap-3">
                              <div>
                                <strong
                                  className={[
                                    "block text-[26px] font-black tracking-[-0.055em] tabular-nums",
                                    ratePlan.code === "STANDARD"
                                      ? "text-violet-700"
                                      : ratePlan.code === "NON_REFUNDABLE"
                                        ? "text-emerald-700"
                                        : ratePlan.code === "WEEKLY"
                                          ? "text-blue-700"
                                          : "text-amber-700",
                                  ].join(
                                    " ",
                                  )}
                                >
                                  {formatCurrency(
                                    preview,
                                  )}
                                </strong>

                                <p className="mt-1 text-[6px] font-semibold text-slate-400">
                                  Min{" "}
                                  {
                                    ratePlan.minimumStay
                                  }
                                  {" notti · Max "}
                                  {ratePlan.maximumStay ??
                                    "∞"}
                                </p>
                              </div>

                              {isStandard &&
                              effectiveStandardSource ===
                                "Revenue AI" ? (
                                <span className="rounded-lg bg-violet-50 px-2 py-1 text-[6px] font-black uppercase tracking-[0.08em] text-violet-600">
                                  AI
                                </span>
                              ) : null}
                            </div>
                          </div>
                        );
                      },
                    )}
                </div>
              </section>

            </div>
          </div>
        )}
      </AppShell>
    </>
  );
}
function parseOptionalCalendarDate(
  value: string,
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    return null;
  }

  const date =
    new Date(
      `${value}T00:00:00`,
    );

  return Number.isNaN(
    date.getTime(),
  )
    ? null
    : date;
}

function addCalendarDays(
  date: Date,
  days: number,
) {
  const result =
    new Date(date);

  result.setDate(
    result.getDate() +
      days,
  );

  return result;
}



function isCalendarRangeFullyBlocked({
  from,
  to,
  blocks,
}: {
  from: Date;
  to: Date;

  blocks: Array<{
    startDate: Date;
    endDate: Date;
  }>;
}) {
  let cursor =
    startOfDay(from);

  const end =
    startOfDay(to);

  while (cursor <= end) {
    const blocked =
      blocks.some(
        (block) =>
          isDateInsideRange(
            cursor,
            block.startDate,
            block.endDate,
          ),
      );

    if (!blocked) {
      return false;
    }

    cursor =
      addCalendarDays(
        cursor,
        1,
      );
  }

  return true;
}

function toCalendarDateValue(
  date: Date,
) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(
    2,
    "0",
  )}-${String(
    date.getDate(),
  ).padStart(
    2,
    "0",
  )}`;
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

function parseMonth(
  value: string,
) {
  if (
    /^\d{4}-\d{2}$/.test(
      value,
    )
  ) {
    const [
      year,
      month,
    ] =
      value
        .split("-")
        .map(
          Number,
        );

    if (
      month >= 1 &&
      month <= 12
    ) {
      return new Date(
        year,
        month - 1,
        1,
      );
    }
  }

  const today =
    new Date();

  return new Date(
    today.getFullYear(),
    today.getMonth(),
    1,
  );
}

function formatMonthParam(
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
  ].join("-");
}

function formatMonthLabel(
  date: Date,
) {
  const value =
    date.toLocaleDateString(
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

function buildCalendarUrl({
  month,
  propertyId,
}: {
  month: string;
  propertyId: string;
}) {
  const params =
    new URLSearchParams();

  params.set(
    "month",
    month,
  );

  if (
    propertyId
  ) {
    params.set(
      "propertyId",
      propertyId,
    );
  }

  return `/calendar?${params.toString()}`;
}

function buildCalendarDays(
  monthStart: Date,
) {
  const firstDay =
    new Date(
      monthStart,
    );

  const mondayOffset =
    (firstDay.getDay() +
      6) %
    7;

  const calendarStart =
    new Date(
      firstDay,
    );

  calendarStart.setDate(
    calendarStart.getDate() -
      mondayOffset,
  );

  return Array.from(
    {
      length:
        42,
    },
    (
      _,
      index,
    ) => {
      const day =
        new Date(
          calendarStart,
        );

      day.setDate(
        day.getDate() +
          index,
      );

      return day;
    },
  );
}

function startOfDay(
  value: Date,
) {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
  );
}

function isSameDay(
  first: Date,
  second: Date,
) {
  return (
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() ===
      second.getMonth() &&
    first.getDate() ===
      second.getDate()
  );
}

function isNightOccupied(
  day: Date,
  checkIn: Date,
  checkOut: Date,
) {
  const target =
    startOfDay(
      day,
    );

  const arrival =
    startOfDay(
      checkIn,
    );

  const departure =
    startOfDay(
      checkOut,
    );

  return (
    target >= arrival &&
    target < departure
  );
}

function isDateInsideRange(
  day: Date,
  startDate: Date,
  endDate: Date,
) {
  const target =
    startOfDay(
      day,
    );

  const start =
    startOfDay(
      startDate,
    );

  const end =
    startOfDay(
      endDate,
    );

  return (
    target >= start &&
    target <= end
  );
}

function getStandardPriceForDate({
  date,
  fallback,
  priceOverrides,
}: {
  date: Date;

  fallback: number;

  priceOverrides: Array<{
    startDate: Date;
    endDate: Date;
    nightlyPrice:
      unknown;
  }>;
}) {
  const override =
    priceOverrides.find(
      (
        item,
      ) =>
        item.nightlyPrice !==
          null &&
        isDateInsideRange(
          date,
          item.startDate,
          item.endDate,
        ),
    );

  if (
    !override ||
    override.nightlyPrice ===
      null
  ) {
    return fallback;
  }

  return Number(
    override.nightlyPrice,
  );
}

function getRateAdjustment(
  ratePlan: RatePlanData,
) {
  if (
    ratePlan.code ===
    "STANDARD"
  ) {
    return 0;
  }

  const adjustment =
    ratePlan.rules[0]
      ?.adjustmentValue;

  return adjustment ??
    0;
}

function formatCurrency(
  value: number,
) {
  return new Intl.NumberFormat(
    "it-IT",
    {
      style:
        "currency",

      currency:
        "EUR",

      minimumFractionDigits:
        0,

      maximumFractionDigits:
        2,
    },
  ).format(
    value,
  );
}
