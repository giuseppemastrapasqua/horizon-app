import {
  AirDnaClient,
  createAirDnaClientFromEnv,
} from "./airdna-client";

import type {
  RevenueMarketProvider,
  RevenueMarketQuery,
  RevenueMarketResult,
} from "./revenue-market-provider";

type AirDnaMarketSearchResponse = {
  payload?: {
    results?: Array<{
      id: string;
      name: string;
      type: string;
      listing_count?: number;
      location_name?: string;

      location?: {
        state?: string;
        country?: string;
        country_code?: string;
      };
    }>;
  };
};

type AirDnaFuturePricingMetric = {
  date: string;

  available_count?: number;
  booked_count?: number;

  mean_available_rate?: number;
  mean_booked_rate?: number;

  median_available_rate?: number;
  median_booked_rate?: number;

  occupancy?: number;
};

type AirDnaFuturePricingResponse = {
  payload?: {
    metrics?:
      AirDnaFuturePricingMetric[];
  };
};

export class AirDnaRevenueMarketProvider
  implements RevenueMarketProvider
{
  readonly name =
    "AIRDNA";

  constructor(
    private readonly client:
      AirDnaClient,
  ) {}

  async getMarketData(
    query: RevenueMarketQuery,
  ): Promise<RevenueMarketResult> {
    const market =
      await this.searchMarket(
        query,
      );

    const numberOfMonths =
      calculateRequestedMonths(
        query.startDate,
        query.endDate,
      );

    const pricingResponse =
      await this.client.post<
        AirDnaFuturePricingResponse
      >(
        `/market/${encodeURIComponent(
          market.id,
        )}/future_pricing`,
        {
          num_months:
            numberOfMonths,

          filters: [
            {
              field:
                "accommodates",

              type:
                "select",

              value:
                query.property
                  .maxGuests,
            },
          ],

          /*
           * AirDNA utilizza ISO
           * currency code lowercase.
           */
          currency:
            "eur",

          /*
           * Chiediamo anche quartili.
           * Se il pacchetto restituisce
           * i percentili, li potremo
           * integrare nel mapping.
           */
          percentiles: [
            0.25,
            0.5,
            0.75,
          ],
        },
      );

    const rawMetrics =
      pricingResponse.payload
        ?.metrics ??
      [];

    const startTime =
      startOfDay(
        query.startDate,
      ).getTime();

    const endTime =
      startOfDay(
        query.endDate,
      ).getTime();

    const relevantMetrics =
      rawMetrics.filter(
        (metric) => {
          const time =
            parseAirDnaDate(
              metric.date,
            ).getTime();

          return (
            time >= startTime &&
            time <= endTime
          );
        },
      );

    const days =
      relevantMetrics.map(
        (metric) => ({
          date:
            parseAirDnaDate(
              metric.date,
            ),

          /*
           * Per ora utilizziamo la
           * mediana della tariffa
           * DISPONIBILE come segnale
           * centrale del mercato.
           *
           * Non equivale ancora al
           * prezzo consigliato Horizon.
           */
          marketMedianPrice:
            nullableNumber(
              metric
                .median_available_rate,
            ),

          /*
           * Finché non utilizziamo
           * esplicitamente i percentili
           * restituiti dal provider,
           * non inventiamo low/high.
           */
          marketLowPrice:
            null,

          marketHighPrice:
            null,

          marketOccupancy:
            nullableNumber(
              metric.occupancy,
            ),

          competitorAvailability:
            nullableNumber(
              metric
                .available_count,
            ),

          demandIndex:
            buildDemandIndex({
              available:
                metric
                  .available_count,

              booked:
                metric
                  .booked_count,
            }),

          confidence:
            buildMarketConfidence({
              available:
                metric
                  .available_count,

              booked:
                metric
                  .booked_count,
            }),

          factors: {
            meanAvailableRate:
              nullableNumber(
                metric
                  .mean_available_rate,
              ),

            meanBookedRate:
              nullableNumber(
                metric
                  .mean_booked_rate,
              ),

            medianBookedRate:
              nullableNumber(
                metric
                  .median_booked_rate,
              ),

            availableCount:
              nullableNumber(
                metric
                  .available_count,
              ),

            bookedCount:
              nullableNumber(
                metric
                  .booked_count,
              ),
          },
        }),
      );

    return {
      provider:
        this.name,

      capturedAt:
        new Date(),

      currency:
        "EUR",

      market: {
        name:
          market.location_name ??
          market.name,

        adr:
          averageNullable(
            relevantMetrics.map(
              (metric) =>
                metric
                  .mean_booked_rate,
            ),
          ),

        occupancy:
          averageNullable(
            relevantMetrics.map(
              (metric) =>
                metric.occupancy,
            ),
          ),

        revenue:
          null,

        demandIndex:
          averageNullable(
            days.map(
              (day) =>
                day.demandIndex,
            ),
          ),

        bookingPace:
          null,

        activeSupply:
          market.listing_count ??
          null,
      },

      /*
       * Verrà popolato dal package
       * Property Valuations & Comps.
       * Non simuliamo comparabili.
       */
      comparables: [],

      days,

      rawData: {
        market,
        futurePricing:
          pricingResponse,
      },
    };
  }

  private async searchMarket(
    query: RevenueMarketQuery,
  ) {
    const searchTerm =
      [
        query.location.zone,
        query.location.city,
      ]
        .filter(Boolean)
        .join(", ");

    const response =
      await this.client.post<
        AirDnaMarketSearchResponse
      >(
        "/market/search",
        {
          search_term:
            searchTerm,

          pagination: {
            page_size: 10,
            offset: 0,
          },
        },
      );

    const results =
      response.payload
        ?.results ??
      [];

    if (
      results.length === 0
    ) {
      throw new Error(
        `AirDNA non ha trovato un mercato per "${searchTerm}".`,
      );
    }

    /*
     * Preferiamo un submarket/market
     * che corrisponda più precisamente
     * al nome richiesto.
     *
     * Per ora, se AirDNA ordina i
     * risultati per rilevanza,
     * usiamo il primo.
     */
    return results[0]!;
  }
}

export function createAirDnaRevenueMarketProvider() {
  return new AirDnaRevenueMarketProvider(
    createAirDnaClientFromEnv(),
  );
}

function calculateRequestedMonths(
  startDate: Date,
  endDate: Date,
) {
  const start =
    startOfDay(
      startDate,
    );

  const end =
    startOfDay(
      endDate,
    );

  const months =
    (
      end.getFullYear() -
      start.getFullYear()
    ) *
      12 +
    (
      end.getMonth() -
      start.getMonth()
    ) +
    1;

  return Math.min(
    12,
    Math.max(
      1,
      months,
    ),
  );
}

function parseAirDnaDate(
  value: string,
) {
  const [
    year,
    month,
    day,
  ] =
    value
      .split("-")
      .map(Number);

  return new Date(
    year!,
    month! - 1,
    day!,
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

function nullableNumber(
  value:
    number |
    null |
    undefined,
) {
  return typeof value ===
    "number" &&
    Number.isFinite(value)
      ? value
      : null;
}

function averageNullable(
  values:
    Array<
      number |
      null |
      undefined
    >,
) {
  const valid =
    values.filter(
      (
        value,
      ): value is number =>
        typeof value ===
          "number" &&
        Number.isFinite(
          value,
        ),
    );

  if (
    valid.length === 0
  ) {
    return null;
  }

  return (
    valid.reduce(
      (
        total,
        value,
      ) =>
        total +
        value,
      0,
    ) /
    valid.length
  );
}

function buildDemandIndex({
  available,
  booked,
}: {
  available?:
    number;

  booked?:
    number;
}) {
  if (
    typeof available !==
      "number" ||
    typeof booked !==
      "number"
  ) {
    return null;
  }

  const total =
    available +
    booked;

  if (total <= 0) {
    return null;
  }

  /*
   * 0..1
   * Per ora misura soltanto
   * pressione di prenotazione
   * sul campione AirDNA.
   */
  return (
    booked /
    total
  );
}

function buildMarketConfidence({
  available,
  booked,
}: {
  available?:
    number;

  booked?:
    number;
}) {
  if (
    typeof available !==
      "number" ||
    typeof booked !==
      "number"
  ) {
    return null;
  }

  const sampleSize =
    available +
    booked;

  if (
    sampleSize >= 100
  ) {
    return 95;
  }

  if (
    sampleSize >= 50
  ) {
    return 85;
  }

  if (
    sampleSize >= 20
  ) {
    return 70;
  }

  if (
    sampleSize >= 10
  ) {
    return 55;
  }

  return 35;
}
