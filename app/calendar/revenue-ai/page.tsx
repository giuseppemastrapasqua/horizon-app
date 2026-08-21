import Link from "next/link";

import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Sparkles,
  TrendingDown,
  TrendingUp,
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
  getPropertyRevenueData,
} from "@/lib/revenue/get-property-revenue-data";

import {
  buildPeriodRevenueRecommendation,
} from "@/app/properties/[id]/components/property-calendar/revenue/build-period-recommendation";

import {
  buildDailyChannelPrices,
} from "@/lib/pricing/daily-channel-pricing";

import {
  getChannelPricingConfig,
} from "@/lib/pricing/get-channel-pricing-config";

import {
  getPricingChannelFromConfig,
} from "@/lib/pricing/get-pricing-channel-from-config";

import {
  applyRevenueAiAction,
} from "../actions";

import {
  ChannelLogo,
} from "../components/ChannelLogo";

import {
  RevenueIntelligenceInsights,
} from "../components/RevenueIntelligenceInsights";

import {
  buildRevenueRecommendationInsights,
} from "@/lib/intelligence";

type RevenueAiPageProps = {
  searchParams: Promise<{
    propertyId?: string | string[];
    from?: string | string[];
    to?: string | string[];
  }>;
};

function getParam(
  value:
    | string
    | string[]
    | undefined,
): string {
  return Array.isArray(value)
    ? value[0] ?? ""
    : value ?? "";
}

function parseDate(
  value: string,
): Date | null {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    return null;
  }

  const date =
    new Date(
      `${value}T12:00:00`,
    );

  return Number.isNaN(
    date.getTime(),
  )
    ? null
    : date;
}

function formatDate(
  date: Date,
): string {
  return new Intl.DateTimeFormat(
    "it-IT",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

function formatCurrency(
  value: number,
): string {
  return new Intl.NumberFormat(
    "it-IT",
    {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    },
  ).format(value);
}

export default async function RevenueAiPage({
  searchParams,
}: RevenueAiPageProps) {
  const params =
    await searchParams;

  const propertyId =
    getParam(
      params.propertyId,
    );

  const requestedFrom =
    parseDate(
      getParam(params.from),
    );

  const requestedTo =
    parseDate(
      getParam(params.to),
    );

  if (
    !propertyId ||
    !requestedFrom ||
    !requestedTo
  ) {
    return (
      <>
        <Navigation />

        <AppShell
          title=""
          subtitle=""
        >
        <main className="mx-auto max-w-6xl p-6">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
            <h1 className="text-lg font-bold text-amber-900">
              Periodo non valido
            </h1>

            <p className="mt-2 text-sm text-amber-700">
              Torna al calendario e seleziona un periodo da analizzare.
            </p>

            <Link
              href="/calendar"
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-amber-900"
            >
              <ArrowLeft size={16} />
              Torna al calendario
            </Link>
          </div>
        </main>
        </AppShell>
      </>
    );
  }

  const rangeFrom =
    requestedFrom <= requestedTo
      ? requestedFrom
      : requestedTo;

  const rangeTo =
    requestedTo >= requestedFrom
      ? requestedTo
      : requestedFrom;

  const property =
    await prisma.property.findUnique({
      where: {
        id: propertyId,
      },

      select: {
        id: true,
        name: true,
        horizonCommissionPercent:
          true,

        ratePlans: {
          orderBy: [
            {
              isDefault: "desc",
            },
            {
              createdAt: "asc",
            },
          ],

          select: {
            code: true,
            isDefault: true,
            basePrice: true,
            minimumStay: true,
          },
        },
      },
    });

  if (!property) {
    return (
      <>
        <Navigation />

        <AppShell
          title=""
          subtitle=""
        >
        <main className="mx-auto max-w-6xl p-6">
          <p className="text-sm text-slate-600">
            Immobile non trovato.
          </p>
        </main>
        </AppShell>
      </>
    );
  }

  const standardRate =
    property.ratePlans.find(
      (ratePlan) =>
        ratePlan.code ===
        "STANDARD",
    ) ??
    property.ratePlans.find(
      (ratePlan) =>
        ratePlan.isDefault,
    ) ??
    null;

  const revenueData =
    await getPropertyRevenueData({
      propertyId,
      startDate: rangeFrom,
      endDate: rangeTo,
    });

  const revenueResult =
    standardRate
      ? buildPeriodRevenueRecommendation({
          propertyId,

          rangeStart:
            getParam(params.from),

          rangeEnd:
            getParam(params.to),

          minimumStay:
            String(
              standardRate.minimumStay,
            ),

          revenueData,
        })
      : null;

  const recommendation =
    revenueResult?.recommendation ??
    null;

  const connections =
    await prisma.integrationConnectionProperty.findMany({
      where: {
        propertyId,
      },

      select: {
        config: true,
      },
    });

  const commissions =
    new Map(
      connections
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
            "BOOKING" |
              "AIRBNB" |
              "VRBO" |
              "HORIZON",
            number | null,
          ] => item !== null,
        ),
    );

  const dailyChannelPrices =
    recommendation?.dailyPrices
      ? buildDailyChannelPrices({
          dailyPrices:
            recommendation.dailyPrices,

          configs: [
            {
              channel: "BOOKING",
              commissionPercent:
                commissions.get(
                  "BOOKING",
                ) ?? null,
            },
            {
              channel: "AIRBNB",
              commissionPercent:
                commissions.get(
                  "AIRBNB",
                ) ?? null,
            },
            {
              channel: "VRBO",
              commissionPercent:
                commissions.get(
                  "VRBO",
                ) ?? null,
            },
            {
              channel: "HORIZON",
              commissionPercent:
                Number(
                  property.horizonCommissionPercent,
                ),
            },
          ],
        })
      : [];

  const averageAiPrice =
    recommendation?.dailyPrices?.length
      ? Math.round(
          recommendation.dailyPrices.reduce(
            (sum, day) =>
              sum +
              day.recommendedPrice,
            0,
          ) /
            recommendation.dailyPrices.length,
        )
      : recommendation?.nightlyPrice ??
        null;

  const standardPrice =
    standardRate
      ? Number(
          standardRate.basePrice,
        )
      : null;

  const delta =
    averageAiPrice !== null &&
    standardPrice !== null &&
    standardPrice > 0
      ? averageAiPrice -
        standardPrice
      : null;

  const deltaPercent =
    delta !== null &&
    standardPrice !== null &&
    standardPrice > 0
      ? (
          delta /
          standardPrice
        ) * 100
      : null;

  const intelligenceInsights =
    recommendation
      ? buildRevenueRecommendationInsights({
          propertyId:
            property.id,

          propertyName:
            property.name,

          recommendation,

          currentPrice:
            standardPrice,
        })
      : [];

  const calendarHref =
    `/calendar?propertyId=${propertyId}` +
    `&from=${getParam(params.from)}` +
    `&to=${getParam(params.to)}`;

  return (
    <>
      <Navigation />

      <AppShell
        title=""
        subtitle=""
      >
      <main className="mx-auto max-w-7xl px-5 py-7">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
          <div>
            <Link
              href={calendarHref}
              className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
            >
              <ArrowLeft size={14} />
              Torna al calendario
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-fuchsia-600 text-white shadow-[0_10px_28px_rgba(79,70,229,0.24)]">
                <Sparkles
                  size={18}
                />
              </div>

              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-indigo-500">
                  Horizon Revenue Intelligence
                </p>

                <h1 className="mt-1 text-[28px] font-black tracking-[-0.045em] text-slate-950">
                  Analisi mercato
                </h1>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/70 px-4 py-3 shadow-[0_6px_20px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-bold text-slate-900">
              {property.name}
            </p>

            <p className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
              <CalendarDays
                size={12}
              />

              {formatDate(
                rangeFrom,
              )}
              {" â†’ "}
              {formatDate(
                rangeTo,
              )}
            </p>
          </div>
        </div>

        {recommendation ? (
          <>
            <section className="grid gap-3 md:grid-cols-4">
              <div className="relative overflow-hidden rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-5 text-white shadow-[0_18px_45px_rgba(79,70,229,0.22)]">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-indigo-100">
                  Prezzo Revenue AI
                </p>

                <p className="mt-3 text-[34px] font-black tracking-[-0.055em] tabular-nums">
                  {formatCurrency(
                    averageAiPrice ??
                      recommendation.nightlyPrice,
                  )}
                </p>

                <p className="mt-2 text-[10px] text-indigo-100">
                  media consigliata per notte
                </p>
              </div>

              <MetricCard
                label="Standard Rate"
                value={
                  standardPrice !== null
                    ? formatCurrency(
                        standardPrice,
                      )
                    : "â€”"
                }
                detail="riferimento attuale"
              />

              <MetricCard
                label="Delta AI"
                value={
                  delta !== null
                    ? `${delta >= 0 ? "+" : ""}${formatCurrency(
                        delta,
                      )}`
                    : "â€”"
                }
                detail={
                  deltaPercent !== null
                    ? `${deltaPercent >= 0 ? "+" : ""}${deltaPercent.toFixed(
                        1,
                      )}% vs Standard`
                    : "confronto non disponibile"
                }
                positive={
                  delta !== null
                    ? delta >= 0
                    : undefined
                }
              />

              <MetricCard
                label="Copertura dati"
                value={`${Math.round(
                  recommendation.coveragePercent,
                )}%`}
                detail={`${recommendation.analyzedNights}/${recommendation.selectedNights} notti analizzate`}
              />
            </section>

            <section className="mt-4 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_32px_rgba(15,23,42,0.05)]">
              <div className="border-b border-slate-100 bg-gradient-to-r from-white via-indigo-50/30 to-violet-50/40 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-sm">
                    <BarChart3
                      size={13}
                    />
                  </span>

                  <div>
                    <p className="text-[7px] font-black uppercase tracking-[0.16em] text-indigo-500">
                      Decision Engine
                    </p>

                    <h2 className="mt-0.5 text-sm font-black text-slate-950">
                      Strategia Horizon
                    </h2>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-[1.55fr_1fr]">
                <div className="p-5 lg:border-r lg:border-slate-100">
                  <p className="text-[8px] font-black uppercase tracking-[0.13em] text-slate-400">
                    PerchÃ© Horizon propone questo prezzo
                  </p>

                  <p className="mt-3 max-w-3xl text-[13px] font-medium leading-6 text-slate-700">
                    {recommendation.rationale}
                  </p>

                  {revenueResult?.message ? (
                    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
                      <p className="text-[7px] font-black uppercase tracking-[0.12em] text-slate-400">
                        Nota del motore
                      </p>

                      <p className="mt-1.5 text-[10px] leading-5 text-slate-500">
                        {revenueResult.message}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="bg-slate-50/35 p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[7px] font-black uppercase tracking-[0.14em] text-slate-400">
                        Vincoli e segnali
                      </p>

                      <p className="mt-1 text-[9px] text-slate-500">
                        Parametri utilizzati nella decisione
                      </p>
                    </div>

                    <span className="flex h-7 w-7 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-[9px] font-black text-indigo-600">
                      âœ¦
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl border border-slate-100 bg-white p-3">
                      <p className="text-[7px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Minimum stay
                      </p>

                      <strong className="mt-1.5 block text-[15px] font-black tracking-[-0.04em] text-slate-950 tabular-nums">
                        {recommendation.minimumStay}
                      </strong>

                      <span className="text-[7px] font-semibold text-slate-400">
                        notti
                      </span>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white p-3">
                      <p className="text-[7px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Selezionate
                      </p>

                      <strong className="mt-1.5 block text-[15px] font-black tracking-[-0.04em] text-slate-950 tabular-nums">
                        {recommendation.selectedNights}
                      </strong>

                      <span className="text-[7px] font-semibold text-slate-400">
                        notti
                      </span>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white p-3">
                      <p className="text-[7px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Analizzate
                      </p>

                      <strong className="mt-1.5 block text-[15px] font-black tracking-[-0.04em] text-slate-950 tabular-nums">
                        {recommendation.analyzedNights}
                      </strong>

                      <span className="text-[7px] font-semibold text-slate-400">
                        notti
                      </span>
                    </div>

                    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-violet-50/60 p-3">
                      <p className="text-[7px] font-bold uppercase tracking-[0.08em] text-indigo-400">
                        Copertura
                      </p>

                      <strong className="mt-1.5 block text-[15px] font-black tracking-[-0.04em] text-indigo-700 tabular-nums">
                        {Math.round(
                          recommendation.coveragePercent,
                        )}%
                      </strong>

                      <span className="text-[7px] font-semibold text-indigo-400">
                        dati mercato
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <RevenueIntelligenceInsights
              insights={
                intelligenceInsights
              }
            />

            <section className="mt-4 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_32px_rgba(15,23,42,0.05)]">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.16em] text-indigo-500">
                    Revenue Intelligence
                  </p>

                  <h2 className="mt-1 text-sm font-black text-slate-950">
                    Pricing giornaliero
                  </h2>

                  <p className="mt-1 text-[9px] text-slate-500">
                    Prezzo Revenue AI e distribuzione pubblica consigliata per canale.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 rounded-xl border border-violet-100 bg-violet-50/70 px-2.5 py-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-[7px] font-black text-white shadow-sm">
                    âœ¦
                  </span>

                  <span className="text-[7px] font-black uppercase tracking-[0.1em] text-violet-600">
                    Revenue AI
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70">
                      <th className="px-5 py-3 text-[7px] font-black uppercase tracking-[0.12em] text-slate-400">
                        Data
                      </th>

                      <th className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-[7px] font-black text-white">
                            âœ¦
                          </span>

                          <span className="text-[7px] font-black uppercase tracking-[0.1em] text-violet-600">
                            Revenue AI
                          </span>
                        </div>
                      </th>

                      <th className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <ChannelLogo
                            channel="BOOKING"
                            size={18}
                          />

                          <span className="text-[7px] font-black uppercase tracking-[0.08em] text-slate-500">
                            Booking
                          </span>
                        </div>
                      </th>

                      <th className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <ChannelLogo
                            channel="AIRBNB"
                            size={18}
                          />

                          <span className="text-[7px] font-black uppercase tracking-[0.08em] text-slate-500">
                            Airbnb
                          </span>
                        </div>
                      </th>

                      <th className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <ChannelLogo
                            channel="VRBO"
                            size={18}
                          />

                          <span className="text-[7px] font-black uppercase tracking-[0.08em] text-slate-500">
                            Vrbo
                          </span>
                        </div>
                      </th>

                      <th className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <ChannelLogo
                            channel="HORIZON"
                            size={18}
                          />

                          <span className="text-[7px] font-black uppercase tracking-[0.08em] text-slate-500">
                            Horizon
                          </span>
                        </div>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {dailyChannelPrices.map(
                      (day) => (
                        <tr
                          key={day.date}
                          className="group border-b border-slate-100/80 transition-colors last:border-b-0 hover:bg-slate-50/70"
                        >
                          <td className="px-5 py-3.5">
                            <strong className="block text-[10px] font-black text-slate-800">
                              {day.date}
                            </strong>
                          </td>

                          <td className="px-3 py-3.5">
                            <div className="inline-flex items-center gap-2 rounded-xl border border-violet-100 bg-violet-50/60 px-2.5 py-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />

                              <strong className="text-[12px] font-black tracking-[-0.03em] text-violet-700 tabular-nums">
                                {formatCurrency(
                                  day.baseRevenuePrice,
                                )}
                              </strong>
                            </div>
                          </td>

                          {day.channels.map(
                            (channel) => (
                              <td
                                key={
                                  channel.channel
                                }
                                className="px-3 py-3.5"
                              >
                                {channel.status ===
                                "CONFIGURED" ? (
                                  <strong className="text-[11px] font-black tracking-[-0.025em] text-slate-800 tabular-nums">
                                    {formatCurrency(
                                      channel.recommendedChannelPrice ??
                                        0,
                                    )}
                                  </strong>
                                ) : (
                                  <span className="text-[11px] font-semibold text-slate-300">
                                    â€”
                                  </span>
                                )}
                              </td>
                            ),
                          )}
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </section>
            <form
              action={
                applyRevenueAiAction
              }
              className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/70 p-4 shadow-[0_8px_26px_rgba(79,70,229,0.06)]"
            >
              <input
                type="hidden"
                name="propertyId"
                value={propertyId}
              />

              <input
                type="hidden"
                name="month"
                value={
                  getParam(params.from).slice(
                    0,
                    7,
                  )
                }
              />

              <input
                type="hidden"
                name="from"
                value={
                  getParam(params.from)
                }
              />

              <input
                type="hidden"
                name="to"
                value={
                  getParam(params.to)
                }
              />

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <CheckCircle2
                  size={15}
                />

                Applica Revenue AI al periodo
              </button>
            </form>
          </>
        ) : (
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="font-bold text-amber-900">
              Dati di mercato insufficienti
            </h2>

            <p className="mt-2 text-sm leading-6 text-amber-700">
              {revenueResult?.message ??
                "Horizon non dispone ancora di dati sufficienti per generare una raccomandazione affidabile."}
            </p>
          </section>
        )}
      </main>
      </AppShell>
    </>
  );
}

function MetricCard({
  label,
  value,
  detail,
  positive,
}: {
  label: string;
  value: string;
  detail: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50/60 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <strong className="text-[22px] font-black tracking-[-0.04em] text-slate-950 tabular-nums">
          {value}
        </strong>

        {positive !== undefined ? (
          positive ? (
            <TrendingUp
              size={15}
              className="text-emerald-500"
            />
          ) : (
            <TrendingDown
              size={15}
              className="text-rose-500"
            />
          )
        ) : null}
      </div>

      <p className="mt-2 text-[10px] text-slate-500">
        {detail}
      </p>
    </div>
  );
}













