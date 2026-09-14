type RevenuePricePoint = {
  date: string;
  recommendedPrice: number;
};

type RevenuePricingChartProps = {
  dailyPrices: RevenuePricePoint[];
  standardPrice: number | null;
};

const WIDTH = 900;
const HEIGHT = 300;
const LEFT = 56;
const RIGHT = 28;
const TOP = 24;
const BOTTOM = 48;

export function RevenuePricingChart({
  dailyPrices,
  standardPrice,
}: RevenuePricingChartProps) {
  const data = dailyPrices
    .filter(
      (day) =>
        Number.isFinite(
          day.recommendedPrice,
        ) &&
        day.recommendedPrice >= 0,
    )
    .map((day) => ({
      ...day,
      parsedDate:
        parseDate(day.date),
    }))
    .filter(
      (
        day,
      ): day is RevenuePricePoint & {
        parsedDate: Date;
      } =>
        day.parsedDate !== null,
    );

  const values = [
    ...data.map(
      (day) =>
        day.recommendedPrice,
    ),
    ...(standardPrice !== null
      ? [standardPrice]
      : []),
  ];

  const maxValue = Math.max(
    1,
    ...values,
  );

  const paddedMax =
    Math.ceil(
      (maxValue * 1.12) / 10,
    ) * 10;

  const plotWidth =
    WIDTH - LEFT - RIGHT;

  const plotHeight =
    HEIGHT - TOP - BOTTOM;

  const xForIndex = (
    index: number,
  ) =>
    data.length <= 1
      ? LEFT + plotWidth / 2
      : LEFT +
        (index /
          (data.length - 1)) *
          plotWidth;

  const yForValue = (
    value: number,
  ) =>
    TOP +
    plotHeight -
    (value / paddedMax) *
      plotHeight;

  const horizonPoints =
    data
      .map(
        (day, index) =>
          `${xForIndex(index)},${yForValue(day.recommendedPrice)}`,
      )
      .join(" ");

  const labelStep =
    Math.max(
      1,
      Math.ceil(
        data.length / 8,
      ),
    );

  return (
    <section className="mt-4 overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#09131C] shadow-[0_20px_55px_rgba(0,0,0,0.18)]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-4">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#D8B367]">
            Confronto tariffe
          </p>

          <h2 className="mt-1 font-serif text-[19px] font-medium text-[#FFF8EA]">
            Standard Rate vs Tariffa Horizon
          </h2>

          <p className="mt-1 text-[10px] leading-5 text-[#70808D]">
            Raccomandazione notte per notte rispetto alla tariffa base attuale.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <ChartLegend
            label="Tariffa Horizon"
            color="#D8B367"
          />

          {standardPrice !== null ? (
            <ChartLegend
              label="Standard Rate"
              color="#3B82F6"
            />
          ) : null}
        </div>
      </div>

      <div className="px-4 pb-4 pt-3">
        {data.length > 0 ? (
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="h-auto w-full"
            role="img"
            aria-label="Confronto tra Standard Rate e tariffa Horizon consigliata"
          >
            {[0, 0.25, 0.5, 0.75, 1].map(
              (ratio) => {
                const value =
                  paddedMax *
                  ratio;

                const y =
                  yForValue(
                    value,
                  );

                return (
                  <g key={ratio}>
                    <line
                      x1={LEFT}
                      x2={
                        WIDTH -
                        RIGHT
                      }
                      y1={y}
                      y2={y}
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="1"
                    />

                    <text
                      x={LEFT - 10}
                      y={y + 3}
                      textAnchor="end"
                      fill="#596875"
                      fontSize="8"
                      fontFamily="Inter, ui-sans-serif, system-ui"
                    >
                      {formatCurrency(
                        value,
                      )}
                    </text>
                  </g>
                );
              },
            )}

            {standardPrice !== null ? (
              <>
                <line
                  x1={LEFT}
                  x2={
                    WIDTH - RIGHT
                  }
                  y1={yForValue(
                    standardPrice,
                  )}
                  y2={yForValue(
                    standardPrice,
                  )}
                  stroke="#3B82F6"
                  strokeWidth="2"
                  strokeDasharray="6 5"
                />

                <text
                  x={
                    WIDTH -
                    RIGHT -
                    4
                  }
                  y={
                    yForValue(
                      standardPrice,
                    ) - 7
                  }
                  textAnchor="end"
                  fill="#60A5FA"
                  fontSize="8"
                  fontWeight="700"
                  fontFamily="Inter, ui-sans-serif, system-ui"
                >
                  Standard{" "}
                  {formatCurrency(
                    standardPrice,
                  )}
                </text>
              </>
            ) : null}

            <polyline
              points={
                horizonPoints
              }
              fill="none"
              stroke="#D8B367"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {data.map(
              (day, index) => {
                const x =
                  xForIndex(index);

                const y =
                  yForValue(
                    day.recommendedPrice,
                  );

                const showLabel =
                  index === 0 ||
                  index ===
                    data.length - 1 ||
                  index %
                    labelStep ===
                    0;

                return (
                  <g
                    key={`${day.date}-${index}`}
                  >
                    <title>
                      {`${formatDate(day.parsedDate)}: Horizon ${formatCurrency(day.recommendedPrice)}${standardPrice !== null ? ` - Standard ${formatCurrency(standardPrice)}` : ""}`}
                    </title>

                    <circle
                      cx={x}
                      cy={y}
                      r="2.7"
                      fill="#09131C"
                      stroke="#D8B367"
                      strokeWidth="2"
                    />

                    {showLabel ? (
                      <text
                        x={x}
                        y={
                          HEIGHT -
                          16
                        }
                        textAnchor={
                          index === 0
                            ? "start"
                            : index ===
                                data.length -
                                  1
                              ? "end"
                              : "middle"
                        }
                        fill="#687784"
                        fontSize="8"
                        fontWeight="600"
                        fontFamily="Inter, ui-sans-serif, system-ui"
                      >
                        {formatShortDate(
                          day.parsedDate,
                        )}
                      </text>
                    ) : null}
                  </g>
                );
              },
            )}
          </svg>
        ) : (
          <div className="flex min-h-[230px] items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.015] px-8 text-center">
            <p className="max-w-sm text-[10px] leading-5 text-[#667582]">
              Il confronto comparir\u00E0 qui quando Horizon avr\u00E0 generato raccomandazioni giornaliere.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function ChartLegend({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-[8px] font-semibold text-[#7D8B96]">
      <span
        className="h-2 w-2 rounded-full"
        style={{
          backgroundColor:
            color,
        }}
      />

      {label}
    </span>
  );
}

function parseDate(
  value: string,
): Date | null {
  const date =
    /^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
      ? new Date(
          `${value}T12:00:00`,
        )
      : new Date(value);

  return Number.isNaN(
    date.getTime(),
  )
    ? null
    : date;
}

function formatDate(
  date: Date,
) {
  return new Intl.DateTimeFormat(
    "it-IT",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

function formatShortDate(
  date: Date,
) {
  return new Intl.DateTimeFormat(
    "it-IT",
    {
      day: "numeric",
      month: "short",
    },
  ).format(date);
}

function formatCurrency(
  value: number,
) {
  return new Intl.NumberFormat(
    "it-IT",
    {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    },
  ).format(value);
}
