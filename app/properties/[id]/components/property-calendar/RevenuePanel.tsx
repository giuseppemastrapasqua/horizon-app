import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  Clock3,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import type {
  RevenueRecommendation,
} from "./revenue/build-period-recommendation";

type RevenuePanelProps = {
  showAiPreview: boolean;

  recommendation:
    RevenueRecommendation | null;

  message:
    string | null;

  onAnalyze:
    () => void;

  onApplyRecommendation:
    (
      recommendation:
        RevenueRecommendation,
    ) => void;
};

export function RevenuePanel({
  showAiPreview,
  recommendation,
  message,
  onAnalyze,
  onApplyRecommendation,
}: RevenuePanelProps) {
  return (
    <section className="border-b border-slate-200 bg-white px-4 py-4 md:px-5">
      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-sky-50/60 shadow-sm">
        <div className="p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                  <BrainCircuit
                    size={19}
                  />
                </span>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700">
                      Horizon Revenue
                    </p>

                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-white px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-blue-700">
                      <Sparkles
                        size={9}
                      />

                      AI
                    </span>
                  </div>

                  <h3 className="mt-0.5 text-sm font-bold tracking-tight text-slate-900">
                    Analisi intelligente del periodo
                  </h3>
                </div>
              </div>

              <p className="mt-2 max-w-2xl text-[10px] leading-4 text-slate-500">
                Horizon combina domanda, occupazione, mercato
                e disponibilità per suggerire una tariffa
                coerente con il periodo selezionato.
              </p>
            </div>

            {!showAiPreview ? (
              <button
                type="button"
                onClick={onAnalyze}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Sparkles
                  size={14}
                />

                Analizza periodo

                <ArrowRight
                  size={14}
                />
              </button>
            ) : recommendation ? (
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[auto_auto_minmax(190px,1fr)_auto] sm:items-stretch xl:max-w-3xl">
                <div className="rounded-xl border border-blue-100 bg-white px-3 py-2.5 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp
                      size={12}
                      className="text-blue-600"
                    />

                    <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">
                      Prezzo consigliato
                    </p>
                  </div>

                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-bold tracking-tight text-slate-900">
                      {recommendation.nightlyPrice} €
                    </span>

                    <span className="text-[8px] text-slate-400">
                      / notte
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-blue-100 bg-white px-3 py-2.5 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <Clock3
                      size={12}
                      className="text-blue-600"
                    />

                    <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">
                      Min stay
                    </p>
                  </div>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {recommendation.minimumStay}{" "}
                    {recommendation.minimumStay === 1
                      ? "notte"
                      : "notti"}
                  </p>
                </div>

                <div className="min-w-0 rounded-xl border border-blue-100 bg-white px-3 py-2.5 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <BrainCircuit
                      size={12}
                      className="text-blue-600"
                    />

                    <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">
                      Perché Horizon
                    </p>
                  </div>

                  <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-slate-600">
                    {recommendation.rationale}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onApplyRecommendation(
                      recommendation,
                    )
                  }
                  className="inline-flex min-h-[58px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <Sparkles
                    size={14}
                  />

                  Usa tariffa
                </button>
              </div>
            ) : (
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                <div className="min-w-0 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-[9px] font-semibold text-amber-800">
                    Analisi non disponibile
                  </p>

                  {message ? (
                    <p className="mt-0.5 max-w-md text-[9px] leading-4 text-amber-700">
                      {message}
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={onAnalyze}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                >
                  <Sparkles
                    size={14}
                  />

                  Riprova
                </button>
              </div>
            )}
          </div>

          {showAiPreview &&
          recommendation?.dailyPrices?.length ? (
            <div className="mt-4 border-t border-blue-100 pt-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Dettaglio pricing
                  </p>

                  <p className="mt-0.5 text-[9px] text-slate-400">
                    Driver economici che hanno inciso sul prezzo giornaliero.
                  </p>
                </div>

                <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-[8px] font-bold text-blue-700">
                  {recommendation.analyzedNights} notti
                </span>
              </div>

              <div className="grid gap-2 lg:grid-cols-2 xl:grid-cols-3">
                {recommendation.dailyPrices.map(
                  (daily) => {
                    const drivers =
                      daily.contributions
                        .filter(
                          (item) =>
                            item.code !==
                              "STRATEGY" &&
                            Math.abs(
                              item.adjustmentPercent,
                            ) >= 0.1,
                        )
                        .sort(
                          (left, right) =>
                            Math.abs(
                              right.adjustmentPercent,
                            ) -
                            Math.abs(
                              left.adjustmentPercent,
                            ),
                        )
                        .slice(
                          0,
                          5,
                        );

                    const guardrailExplanation =
                      daily.explanation.find(
                        (text) =>
                          text.includes(
                            "Market Guardrail",
                          ),
                      );

                    return (
                      <div
                        key={daily.date}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">
                              {formatRevenueDate(
                                daily.date,
                              )}
                            </p>

                            <p className="mt-0.5 text-base font-bold tracking-tight text-slate-900">
                              {
                                daily.recommendedPrice
                              }{" "}
                              €
                            </p>
                          </div>

                          {guardrailExplanation ? (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[7px] font-bold uppercase tracking-wide text-amber-700">
                              Guardrail
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-2 space-y-1">
                          {drivers.map(
                            (driver) => {
                              const positive =
                                driver.adjustmentPercent >
                                0;

                              return (
                                <div
                                  key={`${daily.date}-${driver.code}`}
                                  className="flex items-center justify-between gap-2 text-[8px]"
                                >
                                  <div className="flex min-w-0 items-center gap-1.5">
                                    {positive ? (
                                      <ArrowUpRight
                                        size={
                                          10
                                        }
                                        className="shrink-0 text-emerald-600"
                                      />
                                    ) : (
                                      <ArrowDownRight
                                        size={
                                          10
                                        }
                                        className="shrink-0 text-rose-500"
                                      />
                                    )}

                                    <span className="truncate text-slate-600">
                                      {
                                        driver.label
                                      }
                                    </span>
                                  </div>

                                  <span
                                    className={
                                      positive
                                        ? "shrink-0 font-bold text-emerald-700"
                                        : "shrink-0 font-bold text-rose-600"
                                    }
                                  >
                                    {formatDriverPercent(
                                      driver.adjustmentPercent,
                                    )}
                                  </span>
                                </div>
                              );
                            },
                          )}
                        </div>

                        {guardrailExplanation ? (
                          <p className="mt-2 border-t border-amber-100 pt-2 text-[8px] leading-3.5 text-amber-700">
                            {
                              guardrailExplanation
                            }
                          </p>
                        ) : null}
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          ) : null}
          {showAiPreview &&
          recommendation &&
          message ? (
            <div className="mt-3 border-t border-blue-100 pt-2">
              <p className="text-[9px] leading-4 text-slate-400">
                {message}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
function formatRevenueDate(
  value: string,
) {
  const date =
    new Date(
      `${value}T00:00:00`,
    );

  return new Intl.DateTimeFormat(
    "it-IT",
    {
      day:
        "2-digit",

      month:
        "short",
    },
  ).format(
    date,
  );
}

function formatDriverPercent(
  value: number,
) {
  if (
    value > 0
  ) {
    return `+${value}%`;
  }

  return `${value}%`;
}


