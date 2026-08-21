import Link from "next/link";

import {
  ArrowRight,
  BrainCircuit,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import type {
  IntelligenceInsight,
} from "@/lib/intelligence";

export function RevenueIntelligenceInsights({
  insights,
}: {
  insights:
    IntelligenceInsight[];
}) {
  if (
    insights.length === 0
  ) {
    return null;
  }

  return (
    <section className="mt-4 overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-[0_10px_32px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0B3C98] text-white">
            <BrainCircuit
              size={15}
            />
          </span>

          <div>
            <p className="text-[7px] font-black uppercase tracking-[0.15em] text-blue-600">
              Horizon Intelligence
            </p>

            <h2 className="mt-0.5 text-sm font-black text-slate-950">
              Insight sul periodo
            </h2>
          </div>
        </div>

        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[8px] font-bold text-blue-700">
          {insights.length}
          {" "}
          {insights.length === 1
            ? "segnale"
            : "segnali"}
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {insights.map(
          (insight) => {
            const opportunity =
              insight.severity ===
              "OPPORTUNITY";

            const warning =
              insight.severity ===
              "WARNING";

            return (
              <article
                key={insight.id}
                className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={[
                        "flex h-6 w-6 items-center justify-center rounded-lg",
                        opportunity
                          ? "bg-emerald-50 text-emerald-600"
                          : warning
                            ? "bg-amber-50 text-amber-600"
                            : "bg-blue-50 text-blue-600",
                      ].join(
                        " ",
                      )}
                    >
                      {warning ? (
                        <TriangleAlert
                          size={12}
                        />
                      ) : (
                        <Sparkles
                          size={12}
                        />
                      )}
                    </span>

                    <span
                      className={[
                        "text-[7px] font-black uppercase tracking-[0.1em]",
                        opportunity
                          ? "text-emerald-600"
                          : warning
                            ? "text-amber-600"
                            : "text-blue-600",
                      ].join(
                        " ",
                      )}
                    >
                      {opportunity
                        ? "Opportunità"
                        : warning
                          ? "Attenzione"
                          : "Insight"}
                    </span>

                    {insight.date ? (
                      <span className="text-[8px] font-semibold text-slate-400">
                        {insight.date}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-2 text-[12px] font-black text-slate-900">
                    {insight.title}
                  </h3>

                  <p className="mt-1 max-w-4xl text-[9px] leading-4 text-slate-500">
                    {insight.explanation}
                  </p>
                </div>

                {insight.action?.href ? (
                  <Link
                    href={
                      insight.action.href
                    }
                    className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3.5 text-[9px] font-bold text-blue-700 transition hover:border-blue-200 hover:bg-blue-100"
                  >
                    {
                      insight.action
                        .label
                    }

                    <ArrowRight
                      size={12}
                    />
                  </Link>
                ) : null}
              </article>
            );
          },
        )}
      </div>
    </section>
  );
}
