import { CalendarRangeController } from "@/components/calendar/CalendarRangeController";
import { CalendarPeriodEditor } from "./components/CalendarPeriodEditor";
import Link from "next/link";

import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarPlus,
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
  getAccessiblePropertyIds,
  requireUser,
} from "@/lib/auth/guards";

import {
  calculateDerivedRatePrice,
  resolveStandardRateForDate,
} from "@/lib/pricing/resolve-standard-rate";


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

import { ClosedAvailabilityRibbon } from "./components/ClosedAvailabilityRibbon";

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
  const user = await requireUser();
  const isOperator = user.role === "OPERATOR";

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

  const accessiblePropertyIds =
    await getAccessiblePropertyIds();

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
      where:
        accessiblePropertyIds !== null
          ? {
              id: {
                in: accessiblePropertyIds,
              },
            }
          : undefined,

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
    selectedProperty && !isOperator
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
  const managementPropertyData =
    selectedProperty && !isOperator
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

  const operatorPropertyData =
    selectedProperty && isOperator
      ? await prisma.property.findUnique({
          where: {
            id:
              selectedProperty.id,
          },

          select: {
            id: true,
            name: true,

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

  const propertyData =
    isOperator
      ? operatorPropertyData
        ? {
            ...operatorPropertyData,
            horizonCommissionPercent: null,
            ratePlans: [],
            priceOverrides: [],
          }
        : null
      : managementPropertyData;
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
   * per i form e le preview gi\u00E0 esistenti,
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
return (
    <>
      <Navigation />

      <AppShell
        title="Calendario"
        subtitle={selectedProperty?.name ?? "Disponibilit\u00E0, prenotazioni e pricing."}
      >
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
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-[#09131C] text-[#A4AFB8] transition hover:border-[#D8B367]/40 hover:bg-[#D8B367]/[0.06] hover:text-[#D8B367]"
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
                <span className="mb-1 block text-[8px] font-bold uppercase tracking-[0.1em] text-[#82909C]">
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
                  className="h-10 rounded-xl border border-white/[0.08] bg-[#050B11]/70 px-3 text-[10px] font-semibold text-[#E8E1D5] outline-none [color-scheme:dark] focus:border-[#D8B367]/60 focus:ring-2 focus:ring-[#D8B367]/10"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[8px] font-bold uppercase tracking-[0.1em] text-[#82909C]">
                  Struttura
                </span>

                <select
                  name="propertyId"
                  defaultValue={
                    selectedProperty?.id ??
                    ""
                  }
                  className="h-10 min-w-[240px] rounded-xl border border-white/[0.08] bg-[#050B11]/70 px-3 text-[10px] font-semibold text-[#E8E1D5] outline-none focus:border-[#D8B367]/60 focus:ring-2 focus:ring-[#D8B367]/10"
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
                className="h-10 rounded-xl bg-[#D8B367] px-4 text-[10px] font-bold text-[#07111A] transition hover:bg-[#E5C47F]"
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
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-[#09131C] text-[#A4AFB8] transition hover:border-[#D8B367]/40 hover:bg-[#D8B367]/[0.06] hover:text-[#D8B367]"
              aria-label="Mese successivo"
            >
              <ChevronRight
                size={16}
              />
            </Link>
          </div>
        </section>

        {!propertyData ? (
          <section className="rounded-2xl border border-white/[0.07] bg-[#09131C]/95 px-6 py-16 text-center shadow-[0_16px_38px_rgba(0,0,0,0.20)]">
            <Building2
              size={24}
              className="mx-auto text-[#D8B367]"
            />

            <h2 className="mt-3 text-sm font-bold text-[#FFF8EA]">
              Nessuna struttura disponibile
            </h2>
          </section>
        ) : (
          <div className="space-y-4">
            <div className="min-w-0 space-y-4">
              <div className="rounded-[22px] border border-white/[0.07] bg-[#09131C]/95 px-5 py-4 shadow-[0_14px_34px_rgba(0,0,0,0.20)]">
                <div className="flex items-start justify-between gap-8">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <span className="text-[9px] font-black uppercase tracking-[0.14em] text-[#82909C]">
                        Legenda
                      </span>

                      <span className="flex items-center gap-1.5 text-[9px] font-semibold text-emerald-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Aperto
                      </span>

                      <span className="flex items-center gap-1.5 text-[9px] font-semibold text-emerald-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Chiusura manuale
                      </span>

                      <span className="flex items-center gap-1.5 text-[9px] font-semibold text-rose-300">
                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                        Chiuso senza prenotazione
                      </span>

                      <span className="flex items-center gap-1.5 text-[9px] font-semibold text-emerald-300">
                        <span className="rounded-md border border-emerald-400/20 bg-emerald-400/[0.08] px-1.5 py-0.5 font-black">
                          IN
                        </span>
                        Check-in
                      </span>

                      <span className="flex items-center gap-1.5 text-[9px] font-semibold text-rose-300">
                        <span className="rounded-md border border-rose-400/20 bg-rose-400/[0.08] px-1.5 py-0.5 font-black">
                          OUT
                        </span>
                        Check-out
                      </span>

                      <span className="flex items-center gap-1.5 text-[9px] font-semibold text-[#A4AFB8]">
                        <span className="h-2 w-2 rounded-full bg-slate-400" />
                        Prenotato
                      </span>

                      <span className="flex items-center gap-1.5 text-[9px] font-semibold text-violet-300">
                        <span className="flex h-4 w-4 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-indigo-600 text-[8px] font-black text-white">
                          {"\u2726"}
                        </span>
                        Revenue AI
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-5 border-t border-white/[0.06] pt-3">
                      <span className="flex items-center gap-1.5 text-[9px] font-bold text-[#A4AFB8]">
                        <ChannelLogo channel="BOOKING" size={15} />
                        Booking
                      </span>

                      <span className="flex items-center gap-1.5 text-[9px] font-bold text-[#A4AFB8]">
                        <ChannelLogo channel="AIRBNB" size={15} />
                        Airbnb
                      </span>

                      <span className="flex items-center gap-1.5 text-[9px] font-bold text-[#A4AFB8]">
                        <ChannelLogo channel="VRBO" size={15} />
                        Vrbo
                      </span>

                      <span className="flex items-center gap-1.5 text-[9px] font-bold text-[#A4AFB8]">
                        <ChannelLogo channel="HORIZON" size={15} />
                        Horizon
                      </span>
                    </div>
                  </div>

                  {!isOperator ? (
                    <div className="flex shrink-0 items-start gap-3">

                      <CalendarRangeController
                        key={`${toCalendarDateValue(rangeFrom)}-${toCalendarDateValue(rangeTo)}-${selectedProperty?.id ?? ""}`}
                        from={toCalendarDateValue(rangeFrom)}
                        to={toCalendarDateValue(rangeTo)}
                        propertyId={selectedProperty?.id ?? ""}
                        month={formatMonthParam(monthStart)}
                      />

                      <div className="flex w-[225px] flex-col gap-2">
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

                        <Link
                          href={`/bookings/new?propertyId=${encodeURIComponent(selectedProperty?.id ?? "")}`}
                          className="inline-flex h-10 w-[225px] items-center justify-center gap-2 rounded-xl bg-[#D8B367] px-5 text-[14px] font-semibold text-[#07111A] shadow-[0_10px_24px_rgba(216,179,103,0.14)] transition hover:bg-[#E5C47F]"
                        >
                          <CalendarPlus size={14} />
                          Crea prenotazione
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              <section className="min-w-0 overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#09131C]/95 shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
              <div className="grid grid-cols-7 border-b border-white/[0.07] bg-[#09131C]/[0.025]">
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
                      className="px-2 py-3 text-center text-[9px] font-black uppercase tracking-[0.14em] text-[#82909C]"
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


                    const displayBooking =
                      bookings[0] ??
                      checkIns[0] ??
                      checkOuts[0] ??
                      null;
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
                          "group relative min-h-[132px] border-b border-r border-white/[0.055] px-3 py-3 transition-all duration-200 hover:z-10 hover:bg-[#09131C]/[0.035]",
                          inMonth
                            ? isWeekend
                              ? "bg-[#09131C]"
                              : "bg-[#09131C]"
                            : "bg-[#071019]",
                          isToday
                            ? "bg-[#D8B367]/[0.07]"
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
                                ? "bg-[#D8B367] text-[#07111A] shadow-[0_4px_14px_rgba(216,179,103,0.20)]"
                                : inMonth
                                  ? "text-[#E9C46A]"
                                  : "text-[#46535E]",
                            ].join(
                              " ",
                            )}
                          >
                            {
                              day.getDate()
                            }
                          </span>

                          
                        </div>
                          {inMonth ? (
                            displayBooking ? (
                              <Link
                                href={`/bookings/${displayBooking.id}`}
                                title={`${displayBooking.channel} \u00B7 ${displayBooking.guestName}`}
                                className={`relative z-[2] mt-4 -mx-3.5 flex h-7 w-[calc(100%+1.75rem)] items-center px-4 text-left text-[12px] font-semibold text-[#07111A] shadow-sm transition hover:z-[3] hover:brightness-95 ${getBookingChannelBarClass(displayBooking.channel)}`}
                                style={{
                                  clipPath:
                                    isSameDay(day, displayBooking.checkIn)
                                      ? "polygon(16px 0, 100% 0, 100% 100%, 0 100%)"
                                      : isSameDay(day, displayBooking.checkOut)
                                        ? "polygon(0 0, 100% 0, calc(100% - 16px) 100%, 0 100%)"
                                        : undefined,
                                }}
                              >
                                {isSameDay(day, displayBooking.checkIn) ? (
                                  <span className="flex min-w-0 items-center gap-2 text-[#07111A]">
                                    <ChannelLogo
                                      channel={displayBooking.channel}
                                      size={18}
                                      variant="brand"
                                    />

                                    <span className="truncate text-[#07111A]">
                                      {displayBooking.guestName}
                                    </span>
                                  </span>
                                ) : null}
                              </Link>
                            ) : block ? (
                              isOperator ? (
                                <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.035] px-2 py-1.5 text-[9px] font-bold text-[#82909C]">
                                  Bloccato
                                </div>
                              ) : (
                                <ClosedAvailabilityRibbon
                                  dateKey={calendarDate}
                                  price={dayOriginPrice}
                                  source={
                                    dayOriginSource === "AI"
                                      ? "Revenue AI"
                                      : dayOriginSource === "MANUAL"
                                        ? "Manuale"
                                        : "Configurata"
                                  }
                                  minimumStay={standardRate?.minimumStay ?? 1}
                                  isStart={isSameDay(day, block.startDate)}
                                  isEnd={isSameDay(day, block.endDate)}
                                />
                              )
                            ) : (
                              <div className="mb-2">
                                {!isOperator ? (
                                  <CalendarDayPricing
                                    dateKey={calendarDate}
                                    dayLabel={day.toLocaleDateString("it-IT", {
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                    })}
                                    price={dayOriginPrice}
                                    source={dayOriginSource}
                                    channels={dayOriginChannelPrices}
                                    minimumStay={standardRate?.minimumStay ?? 1}
                                    closed={Boolean(block)}
                                  />
                                ) : null}
                              </div>
                            )
                        ) : null}
                      </div>
                    );
                  },
                )}
              </div>
              </section>


            </div>


            <div className="space-y-4">
              {!isOperator ? (
              <section className="rounded-[24px] border border-white/[0.07] bg-[#09131C] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#D8B367]">
                      Pricing
                    </p>

                    <h3 className="mt-1 !font-sans text-sm font-semibold text-[#FFF8EA]">
                      Tariffe attive
                    </h3>

                    <p className="mt-1 text-[10px] text-[#82909C]">
                      Prezzi calcolati sulla Standard effettiva del periodo
                    </p>
                  </div>

                  <Link
                    href={`/rate-types?propertyId=${encodeURIComponent(
                      selectedProperty?.id ??
                        "",
                    )}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-[9px] font-bold text-[#A4AFB8] transition hover:border-[#D8B367]/40 hover:text-[#D8B367] hover:shadow-sm"
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
                                ? "border-violet-400/20 bg-gradient-to-br from-violet-500/[0.10] via-[#0B1721] to-indigo-500/[0.06] shadow-[0_14px_32px_rgba(0,0,0,0.18)]"
                                : "border-white/[0.07] bg-gradient-to-br from-[#0B1721] via-[#09131C] to-[#07111A] shadow-[0_10px_26px_rgba(0,0,0,0.16)] hover:border-[#D8B367]/20 hover:shadow-[0_16px_34px_rgba(0,0,0,0.24)]",
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
                                        ? "\u2726"
                                        : "\u20AC"}
                                    </span>
                                  ) : null}

                                  <strong className="truncate text-[11px] font-black text-[#F4EEDF]">
                                    {
                                      ratePlan.name
                                    }
                                  </strong>
                                </div>

                                <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#82909C]">
                                  {isStandard
                                    ? `Standard \u00B7 ${effectiveStandardSource}`
                                    : `${adjustment >= 0 ? "+" : ""}${adjustment}% da Standard`}
                                </p>
                              </div>

                              <span
                                className={[
                                  "shrink-0 rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.08em]",
                                  isStandard
                                    ? "border border-indigo-400/20 bg-indigo-400/[0.08] text-indigo-300"
                                    : "border border-white/[0.06] bg-white/[0.035] text-[#82909C]",
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
                                      ? "text-violet-300"
                                      : ratePlan.code === "NON_REFUNDABLE"
                                        ? "text-emerald-300"
                                        : ratePlan.code === "WEEKLY"
                                          ? "text-sky-300"
                                          : "text-amber-300",
                                  ].join(
                                    " ",
                                  )}
                                >
                                  {formatCurrency(
                                    preview,
                                  )}
                                </strong>

                                <p className="mt-1 text-[9px] font-semibold text-[#82909C]">
                                  Min{" "}
                                  {
                                    ratePlan.minimumStay
                                  }
                                  {" notti \u00B7 Max "}
                                  {ratePlan.maximumStay ??
                                    "\u221E"}
                                </p>
                              </div>

                              {isStandard &&
                              effectiveStandardSource ===
                                "Revenue AI" ? (
                                <span className="rounded-lg border border-violet-400/20 bg-violet-400/[0.08] px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-violet-300">
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
              ) : null}

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



function getBookingChannelBarClass(channel?: string) {
  switch (channel) {
    case "BOOKING":
      return "bg-blue-500";
    case "AIRBNB":
      return "bg-rose-500";
    case "HORIZON":
      return "bg-sky-500";
    case "VRBO":
      return "bg-violet-500";
    default:
      return "bg-slate-400";
  }
}
function getBookingChannelClasses(channel: string) {
  switch (channel) {
    case "BOOKING":
      return "bg-blue-50 text-sky-300 hover:bg-blue-100";
    case "AIRBNB":
      return "bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100";
    case "HORIZON":
      return "bg-sky-50 text-sky-700 hover:bg-sky-100";
    case "VRBO":
      return "bg-violet-50 text-violet-300 hover:bg-violet-100";
    default:
      return "bg-slate-100 text-slate-700 hover:bg-slate-200";
  }
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
        mondayOffset +
          new Date(
            monthStart.getFullYear(),
            monthStart.getMonth() + 1,
            0,
          ).getDate() <=
        35
          ? 35
          : 42,
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
