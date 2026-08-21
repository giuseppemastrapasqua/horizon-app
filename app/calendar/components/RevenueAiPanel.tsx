import {
  buildChannelPrices,
} from "@/lib/pricing/channel-pricing";

import type {
  RevenueRecommendation,
} from "@/app/properties/[id]/components/property-calendar/revenue/build-period-recommendation";

import {
  formatCurrency,
} from "@/lib/format/currency";

import {
  applyRevenueAiAction,
} from "../actions";

type RevenueAiPanelProps = {
  recommendation:
    RevenueRecommendation | null;

  message:
    string | null;

  marketReferencePrice:
    number | null;

  selectedStandardPrice:
    number;

  revenueDelta:
    number | null;

  revenueDeltaPercent:
    number | null;

  channelCommissions: {
    booking: number | null;
    airbnb: number | null;
    vrbo: number | null;
    horizon: number | null;
  };

  propertyId:
    string;

  month:
    string;

  from:
    string;

  to:
    string;
};

export function RevenueAiPanel({
  recommendation,
  message,
  marketReferencePrice,
  selectedStandardPrice,
  revenueDelta,
  revenueDeltaPercent,
  channelCommissions,
  propertyId,
  month,
  from,
  to,
}: RevenueAiPanelProps) {
  const channelPrices =
    recommendation
      ? buildChannelPrices({
          baseRevenuePrice:
            recommendation.nightlyPrice,
          configs: [
            {
              channel: "BOOKING",
              commissionPercent: channelCommissions.booking,
            },
            {
              channel: "AIRBNB",
              commissionPercent: channelCommissions.airbnb,
            },
            {
              channel: "VRBO",
              commissionPercent: channelCommissions.vrbo,
            },
            {
              channel: "HORIZON",
              commissionPercent: channelCommissions.horizon,
            },
          ],
        })
      : [];


  return (
    <section className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-indigo-600">
            Revenue AI
          </p>

          <h3 className="mt-1 text-sm font-bold text-slate-900">
            Analisi mercato
          </h3>
        </div>

        <span className="rounded-xl bg-indigo-600 px-2.5 py-2 text-[8px] font-black text-white">
          AI
        </span>
      </div>

      {recommendation ? (
        <>
          <div className="mt-3 rounded-xl border border-indigo-100 bg-white/90 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[7px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Prezzo AI consigliato
              </span>

              <span className="rounded-full bg-indigo-50 px-2 py-1 text-[7px] font-bold text-indigo-600">
                Market based
              </span>
            </div>

            <strong className="mt-1 block text-2xl font-black tracking-tight text-indigo-700">
              {formatCurrency(
                recommendation.nightlyPrice,
              )}
            </strong>

            <p className="mt-1 text-[7px] leading-3 text-slate-400">
              Raccomandazione indipendente dalla Standard Rate manuale.
            </p>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-slate-100 bg-white/80 p-2.5">
              <p className="text-[6px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Mercato
              </p>

              <strong className="mt-1 block text-[11px] font-bold text-slate-800">
                {marketReferencePrice !== null
                  ? formatCurrency(
                      marketReferencePrice,
                    )
                  : "—"}
              </strong>
            </div>

            <div className="rounded-xl border border-slate-100 bg-white/80 p-2.5">
              <p className="text-[6px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Standard corrente
              </p>

              <strong className="mt-1 block text-[11px] font-bold text-slate-800">
                {formatCurrency(
                  selectedStandardPrice,
                )}
              </strong>
            </div>
          </div>

          <div className="mt-2 rounded-xl border border-slate-100 bg-white/80 p-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[7px] text-slate-400">
                Delta AI vs Standard
              </span>

              <strong
                className={[
                  "text-[8px] font-bold",
                  revenueDelta === null
                    ? "text-slate-500"
                    : revenueDelta > 0
                      ? "text-emerald-600"
                      : revenueDelta < 0
                        ? "text-rose-600"
                        : "text-slate-700",
                ].join(" ")}
              >
                {revenueDelta !== null
                  ? `${revenueDelta > 0 ? "+" : ""}${formatCurrency(
                      revenueDelta,
                    )}`
                  : "—"}
              </strong>
            </div>

            <div className="mt-1 flex items-center justify-between gap-3">
              <span className="text-[7px] text-slate-400">
                Variazione percentuale
              </span>

              <strong
                className={[
                  "text-[8px] font-bold",
                  revenueDeltaPercent === null
                    ? "text-slate-500"
                    : revenueDeltaPercent > 0
                      ? "text-emerald-600"
                      : revenueDeltaPercent < 0
                        ? "text-rose-600"
                        : "text-slate-700",
                ].join(" ")}
              >
                {revenueDeltaPercent !== null
                  ? `${revenueDeltaPercent > 0 ? "+" : ""}${revenueDeltaPercent.toFixed(
                      1,
                    )}%`
                  : "—"}
              </strong>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-slate-100 bg-white/80 p-2.5">
              <p className="text-[6px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Copertura dati
              </p>

              <strong className="mt-1 block text-[11px] font-bold text-slate-800">
                {recommendation.coveragePercent}%
              </strong>

              <p className="mt-0.5 text-[6px] text-slate-400">
                {recommendation.analyzedNights}
                /
                {recommendation.selectedNights}
                {" "}notti analizzate
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-white/80 p-2.5">
              <p className="text-[6px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Minimum stay
              </p>

              <strong className="mt-1 block text-[11px] font-bold text-slate-800">
                {recommendation.minimumStay}
                {" "}notti
              </strong>

              <p className="mt-0.5 text-[6px] text-slate-400">
                configurazione attuale
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-slate-100 bg-white/80 p-2.5">
            <p className="text-[6px] font-bold uppercase tracking-[0.08em] text-slate-400">
              Prezzi per canale
            </p>

            <p className="mt-1 text-[6px] leading-3 text-slate-400">
              Prezzo pubblico necessario per preservare il valore Revenue AI dopo le commissioni.
            </p>

            <div className="mt-3 space-y-2">
              {channelPrices.map(
                (result) => {
                  const channelLabel =
                    result.channel ===
                    "BOOKING"
                      ? "Booking"
                      : result.channel ===
                          "AIRBNB"
                        ? "Airbnb"
                        : result.channel ===
                            "VRBO"
                          ? "Vrbo"
                          : "Horizon";

                  return (
                    <div
                      key={
                        result.channel
                      }
                      className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <strong className="text-[8px] font-bold text-slate-800">
                          {channelLabel}
                        </strong>

                        {result.status ===
                        "CONFIGURED" ? (
                          <strong className="text-[10px] font-black text-slate-900">
                            {formatCurrency(
                              result.recommendedChannelPrice,
                            )}
                          </strong>
                        ) : (
                          <span className="text-[7px] font-bold text-amber-600">
                            Da configurare
                          </span>
                        )}
                      </div>

                      {result.status ===
                      "CONFIGURED" ? (
                        <div className="mt-2 grid grid-cols-3 gap-2 border-t border-slate-100 pt-2">
                          <div>
                            <p className="text-[6px] uppercase tracking-[0.06em] text-slate-400">
                              Commissione
                            </p>

                            <strong className="mt-0.5 block text-[7px] text-slate-700">
                              {result.commissionPercent.toFixed(
                                2,
                              )}%
                            </strong>
                          </div>

                          <div>
                            <p className="text-[6px] uppercase tracking-[0.06em] text-slate-400">
                              Costo
                            </p>

                            <strong className="mt-0.5 block text-[7px] text-rose-600">
                              {formatCurrency(
                                result.estimatedCommission,
                              )}
                            </strong>
                          </div>

                          <div>
                            <p className="text-[6px] uppercase tracking-[0.06em] text-slate-400">
                              Netto
                            </p>

                            <strong className="mt-0.5 block text-[7px] text-emerald-600">
                              {formatCurrency(
                                result.estimatedNetRevenue,
                              )}
                            </strong>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 border-t border-slate-100 pt-2 text-[6px] leading-3 text-slate-400">
                          Configura la commissione del canale per ottenere il prezzo consigliato.
                        </p>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-2.5">
            <p className="text-[6px] font-bold uppercase tracking-[0.08em] text-indigo-500">
              Analisi Horizon
            </p>

            <p className="mt-1 text-[7px] leading-3.5 text-slate-600">
              {recommendation.rationale}
            </p>

            {message ? (
              <p className="mt-1.5 text-[6px] leading-3 text-slate-400">
                {message}
              </p>
            ) : null}
          </div>

          <form
            action={
              applyRevenueAiAction
            }
            className="mt-3"
          >
            <input
              type="hidden"
              name="propertyId"
              value={propertyId}
            />

            <input
              type="hidden"
              name="month"
              value={month}
            />

            <input
              type="hidden"
              name="from"
              value={from}
            />

            <input
              type="hidden"
              name="to"
              value={to}
            />

            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-[8px] font-bold text-white transition hover:bg-indigo-700"
            >
              Applica Revenue AI
            </button>
          </form>
        </>
      ) : (
        <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 p-3">
          <p className="text-[8px] font-bold text-amber-700">
            Dati di mercato insufficienti
          </p>

          <p className="mt-1 text-[7px] leading-3.5 text-amber-600">
            {message ??
              "Horizon non dispone ancora di dati sufficienti per una raccomandazione affidabile sul periodo selezionato."}
          </p>

          {marketReferencePrice !== null ? (
            <div className="mt-2 flex items-center justify-between border-t border-amber-100 pt-2">
              <span className="text-[7px] text-amber-600">
                Riferimento mercato
              </span>

              <strong className="text-[8px] text-amber-800">
                {formatCurrency(
                  marketReferencePrice,
                )}
              </strong>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}











