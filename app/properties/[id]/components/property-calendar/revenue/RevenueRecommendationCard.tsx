import {
  ArrowRight,
  BrainCircuit,
  Clock3,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import type {
  RevenueRecommendation,
} from "./build-period-recommendation";

import {
  formatCompactMoney,
} from "../formatters";

type RevenueRecommendationCardProps = {
  recommendation:
    RevenueRecommendation | null;

  message:
    string | null;

  onApply:
    (
      recommendation:
        RevenueRecommendation,
    ) => void;
};

export function RevenueRecommendationCard({
  recommendation,
  message,
  onApply,
}: RevenueRecommendationCardProps) {
  if (!recommendation) {
    return (
      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-center gap-2">
          <BrainCircuit
            size={14}
            className="text-amber-700"
          />

          <p className="text-[10px] font-semibold text-amber-800">
            Analisi non disponibile
          </p>
        </div>

        <p className="mt-1 text-[9px] leading-4 text-amber-700">
          {message ??
            "Horizon non dispone ancora di dati sufficienti per formulare una raccomandazione affidabile."}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
      <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-sky-50 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <BrainCircuit
                size={15}
              />
            </span>

            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-700">
                Raccomandazione Horizon
              </p>

              <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
                Tariffa suggerita per il periodo
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-white px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-blue-700">
            <Sparkles
              size={9}
            />

            AI
          </span>
        </div>
      </div>

      <div className="p-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
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
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {formatCompactMoney(
                  recommendation.nightlyPrice,
                )}
              </span>

              <span className="text-[8px] text-slate-400">
                / notte
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <div className="flex items-center gap-1.5">
              <Clock3
                size={12}
                className="text-blue-600"
              />

              <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">
                Soggiorno minimo
              </p>
            </div>

            <p className="mt-1 text-sm font-bold text-slate-900">
              {recommendation.minimumStay}{" "}
              {recommendation.minimumStay === 1
                ? "notte"
                : "notti"}
            </p>
          </div>
        </div>

        <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50/50 p-3">
          <div className="flex items-center gap-1.5">
            <BrainCircuit
              size={12}
              className="text-blue-600"
            />

            <p className="text-[8px] font-bold uppercase tracking-wide text-blue-700">
              Perché Horizon lo consiglia
            </p>
          </div>

          <p className="mt-1.5 text-[10px] leading-4 text-slate-600">
            {recommendation.rationale}
          </p>
        </div>

        {message ? (
          <p className="mt-2 text-[9px] leading-4 text-slate-500">
            {message}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() =>
            onApply(
              recommendation,
            )
          }
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Sparkles
            size={14}
          />

          Usa questa tariffa

          <ArrowRight
            size={14}
          />
        </button>

        <p className="mt-2 text-center text-[8px] leading-3 text-slate-400">
          La tariffa non viene applicata finché
          non confermi la modifica.
        </p>
      </div>
    </div>
  );
}
