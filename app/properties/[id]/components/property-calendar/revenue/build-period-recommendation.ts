import {
  buildRevenuePricingDecision,
} from "@/lib/revenue/engine/build-revenue-pricing-decision";

import type {
  RevenuePricingDecision,
} from "@/lib/revenue/engine/revenue-engine-types";

import {
  buildComparablePositioning,
} from "@/lib/revenue/engine/build-comparable-positioning";

import {
  buildRevenueSignals,
} from "@/lib/revenue/engine/build-revenue-signals";

import type {
  CalendarRevenueData,
} from "../types";

export type RevenueRecommendation = {
  nightlyPrice: number;
  minimumStay: number;
  rationale: string;
  analyzedNights: number;
  selectedNights: number;
  coveragePercent: number;

  dailyPrices?: Array<{
    date: string;
    recommendedPrice: number;

    contributions:
      RevenuePricingDecision["contributions"];

    explanation:
      RevenuePricingDecision["explanation"];
  }>;
};

type BuildPeriodRevenueRecommendationInput = {
  propertyId: string;
  rangeStart: string;
  rangeEnd: string;
  minimumStay: string;
  revenueData: CalendarRevenueData;
};

type BuildPeriodRevenueRecommendationResult = {
  recommendation:
    RevenueRecommendation | null;

  message: string;
};

type RevenueFallbackBaseline = {
  price: number;
  source:
    | "SNAPSHOT"
    | "COMPARABLES";
  confidence: number;
  rationale: string;
};

function buildFallbackMarketBaseline({
  revenueData,
}: {
  revenueData: CalendarRevenueData;
}): RevenueFallbackBaseline | null {
  /*
   * 1. Snapshot mercato.
   *
   * Lo utilizziamo soltanto se contiene
   * un ADR valido e se non Ã¨ troppo vecchio.
   *
   * Non vogliamo trasformare uno snapshot
   * storico in una previsione futura certa.
   */
  const snapshot =
    revenueData.snapshot;

  if (
    snapshot?.marketAdr !== null &&
    snapshot?.marketAdr !== undefined &&
    snapshot.marketAdr > 0
  ) {
    const capturedAt =
      new Date(
        snapshot.capturedAt,
      );

    const ageMs =
      Date.now() -
      capturedAt.getTime();

    const ageDays =
      ageMs /
      (
        1000 *
        60 *
        60 *
        24
      );

    if (
      Number.isFinite(ageDays) &&
      ageDays >= 0 &&
      ageDays <= 30
    ) {
      return {
        price:
          Math.round(
            snapshot.marketAdr,
          ),

        source:
          "SNAPSHOT",

        confidence:
          55,

        rationale:
          "Tariffa stimata dall'ultimo snapshot di mercato disponibile.",
      };
    }
  }

  /*
   * 2. Comparable properties.
   *
   * Se non abbiamo uno snapshot recente,
   * costruiamo una baseline usando proprietÃ 
   * comparabili che abbiano un prezzo valido.
   */
  const comparablePrices =
    revenueData.comparables
      .map(
        (comparable) =>
          comparable.adr ??
          comparable.nightlyPrice,
      )
      .filter(
        (
          price,
        ): price is number =>
          price !== null &&
          Number.isFinite(price) &&
          price > 0,
      )
      .sort(
        (a, b) =>
          a - b,
      );

  if (
    comparablePrices.length === 0
  ) {
    return null;
  }

  /*
   * Usiamo la mediana anzichÃ© la media
   * per ridurre l'impatto degli outlier.
   */
  const middle =
    Math.floor(
      comparablePrices.length /
        2,
    );

  const median =
    comparablePrices.length % 2 ===
    0
      ? (
          comparablePrices[
            middle - 1
          ] +
          comparablePrices[
            middle
          ]
        ) /
        2
      : comparablePrices[
          middle
        ];

  return {
    price:
      Math.round(
        median,
      ),

    source:
      "COMPARABLES",

    confidence:
      comparablePrices.length >= 5
        ? 50
        : 40,

    rationale:
      `Tariffa stimata sulla mediana di ${comparablePrices.length} strutture comparabili.`,
  };
}
export function buildPeriodRevenueRecommendation({
  propertyId,
  rangeStart,
  rangeEnd,
  minimumStay,
  revenueData,
}: BuildPeriodRevenueRecommendationInput):
  BuildPeriodRevenueRecommendationResult {
  if (
    !rangeStart ||
    !rangeEnd
  ) {
    return {
      recommendation: null,
      message:
        "Seleziona prima il periodo da analizzare.",
    };
  }

  const startDate =
    new Date(
      `${rangeStart}T00:00:00`,
    );

  const endDate =
    new Date(
      `${rangeEnd}T00:00:00`,
    );

  const selectedNights =
    Math.max(
      1,
      Math.round(
        (
          endDate.getTime() -
          startDate.getTime()
        ) /
          (
            1000 *
            60 *
            60 *
            24
          ),
      ) + 1,
    );

  const selectedDays =
    revenueData.days.filter(
      (day) => {
        const dateKey =
          day.date.slice(
            0,
            10,
          );

        return (
          dateKey >= rangeStart &&
          dateKey <= rangeEnd
        );
      },
    );


  if (
    selectedDays.length === 0
  ) {
    const fallback =
      buildFallbackMarketBaseline({
        revenueData,
      });

    if (fallback) {
      const currentMinimumStay =
        Math.max(
          1,
          Number.parseInt(
            minimumStay,
            10,
          ) || 1,
        );

      return {
        recommendation: {
          nightlyPrice:
            fallback.price,

          minimumStay:
            currentMinimumStay,

          rationale:
            fallback.rationale,

          analyzedNights:
            0,

          selectedNights,

          coveragePercent:
            0,
        },

        message:
          fallback.source ===
          "SNAPSHOT"
            ? `Nessun dato giornaliero disponibile. Horizon usa uno snapshot di mercato recente con confidenza stimata ${fallback.confidence}%.`
            : `Nessun dato giornaliero disponibile. Horizon usa una baseline da strutture comparabili con confidenza stimata ${fallback.confidence}%.`,
      };
    }

    return {
      recommendation: null,
      message:
        "Horizon non dispone ancora di dati di mercato sufficienti per il periodo selezionato.",
    };
  }

  const decisions =
    selectedDays.flatMap(
      (day) => {
        /*
         * Il Comparable Positioning descrive
         * il posizionamento STRUTTURALE
         * dell'alloggio rispetto al mercato.
         *
         * Non confrontiamo i comparables con
         * il prezzo del singolo giorno, perché
         * eventi e picchi di domanda renderebbero
         * artificialmente economici i comparables.
         *
         * Usiamo quindi l'ADR generale dello
         * snapshot di mercato come riferimento.
         */
        const positioning =
          buildComparablePositioning({
            marketReference:
              revenueData.snapshot
                ?.marketAdr ??
              day.marketMedianPrice,

            propertyProfile: {
              maxGuests:
                revenueData.property
                  ?.maxGuests ??
                null,

              bedrooms:
                revenueData.property
                  ?.bedrooms ??
                null,

              bathrooms:
                revenueData.property
                  ?.bathrooms ??
                null,
            },

            comparables:
              revenueData.comparables,
          });

        const positionedMarketPrice =
          day.marketMedianPrice ===
            null
            ? null
            : Math.round(
                day.marketMedianPrice *
                  positioning.positioningFactor,
              );

        const signalSet =
          buildRevenueSignals({
            propertyId,

            date:
              new Date(
                day.date,
              ),

            market: {
              medianPrice:
                positionedMarketPrice,
              occupancy:
                day.marketOccupancy,
              demandIndex:
                day.demandIndex,
              competitorAvailability:
                day.competitorAvailability,
              confidence:
                day.confidence,
            },

            property: {
              occupancy:
                day.propertyOccupancy,
              bookingPace:
                day.bookingPace,
            },

            calendar: {
              leadTimeDays:
                day.leadTimeDays,
              gapBeforeNights:
                day.gapBeforeNights,
              gapAfterNights:
                day.gapAfterNights,
            },

            event: {
              score:
                day.eventScore,
            },
          });

        if (!signalSet.usable) {
          return [];
        }

        try {
          const decision =
            buildRevenuePricingDecision({
              signalSet,
              strategy:
                "BALANCED",
            });

          /*
           * MARKET GUARDRAIL
           *
           * Il Comparable Positioning e il Revenue Engine
           * possono ottimizzare il prezzo, ma il risultato
           * finale non deve allontanarsi eccessivamente
           * dal mercato giornaliero originale.
           *
           * Prima versione:
           * massimo +/-15% rispetto al marketMedianPrice.
           */
          const originalMarketPrice =
            day.marketMedianPrice;

          const marketGuardrailMin =
            originalMarketPrice === null
              ? null
              : Math.round(
                  originalMarketPrice *
                    0.85,
                );

          const marketGuardrailMax =
            originalMarketPrice === null
              ? null
              : Math.round(
                  originalMarketPrice *
                    1.15,
                );

          const guardedPrice =
            marketGuardrailMin === null ||
            marketGuardrailMax === null
              ? decision.recommendedPrice
              : Math.max(
                  marketGuardrailMin,
                  Math.min(
                    marketGuardrailMax,
                    decision.recommendedPrice,
                  ),
                );

          const guardrailApplied =
            guardedPrice !==
            decision.recommendedPrice;

          return [
            {
              ...decision,

              recommendedPrice:
                guardedPrice,

              explanation: [
                ...decision.explanation,

                ...(positioning.usable
                  ? [
                      positioning.rationale,
                    ]
                  : []),

                ...(guardrailApplied
                  ? [
                      `Market Guardrail applicato: prezzo AI limitato a ${guardedPrice} EUR per restare entro +/-15% dal mercato giornaliero.`,
                    ]
                  : []),
              ],

              date:
                day.date.slice(
                  0,
                  10,
                ),
            },
          ];
        } catch {
          return [];
        }
      },
    );

  const analyzedNights =
    decisions.length;

  const coveragePercent =
    Math.round(
      (
        analyzedNights /
        selectedNights
      ) *
        100,
    );


  if (
    analyzedNights === 0 ||
    coveragePercent < 50
  ) {
    const fallback =
      buildFallbackMarketBaseline({
        revenueData,
      });

    if (fallback) {
      const currentMinimumStay =
        Math.max(
          1,
          Number.parseInt(
            minimumStay,
            10,
          ) || 1,
        );

      return {
        recommendation: {
          nightlyPrice:
            fallback.price,

          minimumStay:
            currentMinimumStay,

          rationale:
            `${fallback.rationale} I segnali giornalieri disponibili non raggiungono ancora la copertura minima richiesta.`,

          analyzedNights,
          selectedNights,
          coveragePercent,
        },

        message:
          `Copertura giornaliera ${coveragePercent}% (${analyzedNights}/${selectedNights} notti affidabili). Horizon utilizza una baseline ${fallback.source === "SNAPSHOT" ? "di mercato" : "da comparabili"} con confidenza stimata ${fallback.confidence}%.`,
      };
    }

    return {
      recommendation: null,
      message:
        `Dati insufficienti: ${analyzedNights} notti affidabili su ${selectedNights} (${coveragePercent}%). Non Ã¨ disponibile nemmeno una baseline di mercato affidabile.`,
    };
  }

  const nightlyPrice =
    Math.round(
      decisions.reduce(
        (
          total,
          decision,
        ) =>
          total +
          decision.recommendedPrice,
        0,
      ) /
        decisions.length,
    );

  const dailyPrices =
    decisions.map(
      (decision) => ({
        date:
          decision.date,

        recommendedPrice:
          decision.recommendedPrice,

        contributions:
          decision.contributions,

        explanation:
          decision.explanation,
      }),
    );
  const currentMinimumStay =
    Math.max(
      1,
      Number.parseInt(
        minimumStay,
        10,
      ) || 1,
    );

  const rationale =
    Array.from(
      new Set(
        decisions.flatMap(
          (decision) =>
            decision.explanation,
        ),
      ),
    )
      .slice(0, 5)
      .join(" ");

  return {
    recommendation: {
      nightlyPrice,
      minimumStay:
        currentMinimumStay,
      rationale:
        rationale ||
        "Raccomandazione costruita sui dati di mercato disponibili.",
      analyzedNights,
      selectedNights,
      coveragePercent,
      dailyPrices,
    },

    message:
      coveragePercent === 100
        ? `Analizzate ${analyzedNights} notti con dati affidabili.`
        : `Analisi basata su ${analyzedNights} notti affidabili su ${selectedNights} (${coveragePercent}% di copertura).`,
  };
}










