type TrendPoint = {
  key: string;
  label: string;
  grossRevenue: number;
  netProperty: number;
};

type ChannelPoint = {
  channel: string;
  revenue: number;
};

type PropertyPerformancePoint = {
  id: string;
  name: string;
  city: string;
  zone: string | null;
  grossRevenue: number;
  netProperty: number;
  changePercent: number | null;
};

type DashboardFinanceChartsProps = {
  trend: TrendPoint[];
  channels: ChannelPoint[];
  performance: PropertyPerformancePoint[];
};

const WIDTH = 760;
const HEIGHT = 260;
const LEFT = 52;
const RIGHT = 18;
const TOP = 22;
const BOTTOM = 42;

export function DashboardFinanceCharts({
  trend,
  channels,
  performance,
}: DashboardFinanceChartsProps) {
  return (
    <div className="mb-6 space-y-4">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.75fr)_minmax(320px,0.75fr)]">
      <EconomicTrendChart data={trend} />
      <ChannelDistribution data={channels} />
    </section>

      <PropertyPerformance data={performance} />
    </div>
  );
}

function PropertyPerformance({
  data,
}: {
  data: PropertyPerformancePoint[];
}) {
  return (
    <section className="overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#09131C] shadow-[0_20px_55px_rgba(0,0,0,0.18)]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-4">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#D8B367]">
            Performance per struttura
          </p>

          <p className="mt-1 text-[10px] leading-5 text-[#70808D]">
            Ricavi e netto proprietario negli ultimi 12 mesi per singola struttura.
          </p>
        </div>

        <span className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-[9px] font-semibold text-[#A4AFB8]">
          Ultimi 12 mesi
        </span>
      </div>

      {data.length > 0 ? (
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {data.map((property) => {
            const positive =
              property.changePercent !== null &&
              property.changePercent >= 0;

            const location = [
              property.zone,
              property.city,
            ]
              .filter(Boolean)
              .join(" \u00B7 ");

            return (
              <article
                key={property.id}
                className="rounded-2xl border border-white/[0.07] bg-[#0D1A24] p-3.5 transition hover:border-[#D8B367]/20 hover:bg-[#101E29]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#D8B367]/15 bg-[#D8B367]/[0.07]">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5 text-[#D8B367]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path d="M4 21V3h11v18" />
                      <path d="M15 8h5v13" />
                      <path d="M8 7h3M8 11h3M8 15h3M8 19h3M18 12h1M18 16h1" />
                    </svg>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-[#F7F1E7]">
                      {property.name}
                    </p>

                    <p className="mt-1 truncate text-[9px] text-[#70808D]">
                      {location || property.city}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[8px] font-medium text-[#667582]">
                      Ricavi totali
                    </p>

                    <p className="mt-1 text-[12px] font-semibold tabular-nums text-[#FFF8EA]">
                      {formatMoney(property.grossRevenue)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[8px] font-medium text-[#667582]">
                      Netto proprietario
                    </p>

                    <p className="mt-1 text-[12px] font-semibold tabular-nums text-[#FFF8EA]">
                      {formatMoney(property.netProperty)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  {property.changePercent === null ? (
                    <span className="text-[9px] font-semibold text-[#667582]">
                      Nuovo periodo
                    </span>
                  ) : (
                    <span
                      className={[
                        "inline-flex items-center gap-1 text-[10px] font-bold tabular-nums",
                        positive
                          ? "text-emerald-300"
                          : "text-rose-300",
                      ].join(" ")}
                    >
                      <span aria-hidden="true">
                        {positive ? "\u2191" : "\u2193"}
                      </span>

                      {positive ? "+" : ""}
                      {property.changePercent.toFixed(1)}%
                    </span>
                  )}

                  <span className="text-right text-[8px] text-[#596875]">
                    vs periodo precedente
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="p-4">
          <ChartEmptyState text="Le performance compariranno qui quando saranno disponibili strutture." />
        </div>
      )}
    </section>
  );
}
function EconomicTrendChart({
  data,
}: {
  data: TrendPoint[];
}) {
  const maxValue = Math.max(
    1,
    ...data.flatMap((point) => [
      point.grossRevenue,
      point.netProperty,
    ]),
  );

  const plotWidth =
    WIDTH - LEFT - RIGHT;

  const plotHeight =
    HEIGHT - TOP - BOTTOM;

  const hasData = data.some(
    (point) =>
      point.grossRevenue > 0 ||
      point.netProperty > 0,
  );

  const slotWidth =
    plotWidth /
    Math.max(1, data.length);

  const groupWidth =
    Math.min(
      34,
      slotWidth * 0.62,
    );

  const barGap = 3;

  const barWidth =
    Math.max(
      5,
      (groupWidth - barGap) / 2,
    );

  return (
    <article className="overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#09131C] shadow-[0_20px_55px_rgba(0,0,0,0.18)]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-4">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#D8B367]">
            Performance
          </p>

          <h2 className="mt-1 font-serif text-[19px] font-medium text-[#FFF8EA]">
            Andamento economico
          </h2>

          <p className="mt-1 text-[10px] leading-5 text-[#70808D]">
            Ricavi e netto proprietario dai rendiconti degli ultimi 12 mesi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <ChartLegend
            label="Ricavi totali"
            color="#D8B367"
          />

          <ChartLegend
            label="Netto proprietario"
            color="#3B82F6"
          />
        </div>
      </div>

      <div className="px-4 pb-4 pt-3">
        {hasData ? (
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="h-auto w-full"
            role="img"
            aria-label="Andamento economico degli ultimi dodici mesi"
          >
            {[0, 0.25, 0.5, 0.75, 1].map(
              (ratio) => {
                const y =
                  TOP +
                  plotHeight -
                  ratio *
                    plotHeight;

                return (
                  <g key={ratio}>
                    <line
                      x1={LEFT}
                      x2={WIDTH - RIGHT}
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
                      {formatCompactMoney(
                        maxValue *
                          ratio,
                      )}
                    </text>
                  </g>
                );
              },
            )}

            {data.map(
              (point, index) => {
                const centerX =
                  LEFT +
                  slotWidth *
                    (index + 0.5);

                const grossHeight =
                  (point.grossRevenue /
                    maxValue) *
                  plotHeight;

                const netHeight =
                  (point.netProperty /
                    maxValue) *
                  plotHeight;

                const grossX =
                  centerX -
                  barGap / 2 -
                  barWidth;

                const netX =
                  centerX +
                  barGap / 2;

                const grossY =
                  TOP +
                  plotHeight -
                  grossHeight;

                const netY =
                  TOP +
                  plotHeight -
                  netHeight;

                return (
                  <g key={point.key}>
                    {point.grossRevenue > 0 ? (
                      <rect
                        x={grossX}
                        y={grossY}
                        width={barWidth}
                        height={grossHeight}
                        rx="3"
                        fill="#D8B367"
                      />
                    ) : null}

                    {point.netProperty > 0 ? (
                      <rect
                        x={netX}
                        y={netY}
                        width={barWidth}
                        height={netHeight}
                        rx="3"
                        fill="#3B82F6"
                      />
                    ) : null}

                    <text
                      x={centerX}
                      y={HEIGHT - 15}
                      textAnchor="middle"
                      fill="#687784"
                      fontSize="8"
                      fontWeight="600"
                      fontFamily="Inter, ui-sans-serif, system-ui"
                    >
                      {point.label}
                    </text>
                  </g>
                );
              },
            )}
          </svg>
        ) : (
          <ChartEmptyState text="I dati compariranno qui quando saranno disponibili rendiconti finanziari." />
        )}
      </div>
    </article>
  );
}
function ChannelDistribution({
  data,
}: {
  data: ChannelPoint[];
}) {
  const total = data.reduce(
    (sum, item) =>
      sum + item.revenue,
    0,
  );

  const colors = [
    "#D8B367",
    "#3B82F6",
    "#34D399",
    "#A78BFA",
    "#38BDF8",
    "#F87171",
  ];

  const segments: string[] = [];
  let cursor = 0;

  data.forEach((item, index) => {
    if (total <= 0) {
      return;
    }

    const share =
      (item.revenue / total) *
      100;

    const start = cursor;
    const end =
      cursor + share;

    segments.push(
      `${colors[index % colors.length]} ${start}% ${end}%`,
    );

    cursor = end;
  });

  return (
    <article className="overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#09131C] shadow-[0_20px_55px_rgba(0,0,0,0.18)]">
      <div className="border-b border-white/[0.07] px-5 py-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#D8B367]">
          Channel mix
        </p>

        <h2 className="mt-1 font-serif text-[19px] font-medium text-[#FFF8EA]">
          Ricavi per canale
        </h2>

        <p className="mt-1 text-[10px] leading-5 text-[#70808D]">
          Distribuzione del valore lordo delle prenotazioni.
        </p>
      </div>

      {total > 0 ? (
        <div className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center xl:flex-col">
          <div
            className="relative mx-auto h-[156px] w-[156px] shrink-0 rounded-full"
            style={{
              background: `conic-gradient(${segments.join(", ")})`,
            }}
          >
            <div className="absolute inset-[24px] flex flex-col items-center justify-center rounded-full border border-white/[0.06] bg-[#09131C]">
              <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#667582]">
                Totale
              </span>

              <strong className="mt-1 text-[17px] font-semibold tracking-[-0.03em] text-[#FFF8EA]">
                {formatMoney(total)}
              </strong>
            </div>
          </div>

          <div className="w-full space-y-2.5">
            {data.slice(0, 6).map(
              (item, index) => {
                const percentage =
                  total > 0
                    ? (item.revenue /
                        total) *
                      100
                    : 0;

                return (
                  <div
                    key={item.channel}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            colors[
                              index %
                                colors.length
                            ],
                        }}
                      />

                      <span className="truncate text-[9px] font-semibold text-[#93A0AA]">
                        {formatChannel(
                          item.channel,
                        )}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-[9px] font-semibold tabular-nums text-[#F6F0E6]">
                        {formatMoney(
                          item.revenue,
                        )}
                      </span>

                      <span className="w-9 text-right text-[8px] tabular-nums text-[#667582]">
                        {percentage.toFixed(
                          0,
                        )}
                        %
                      </span>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>
      ) : (
        <div className="p-5">
          <ChartEmptyState text="La distribuzione apparira quando saranno presenti prenotazioni nel periodo." />
        </div>
      )}
    </article>
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
          backgroundColor: color,
        }}
      />
      {label}
    </span>
  );
}

function ChartEmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.015] px-8 text-center">
      <p className="max-w-sm text-[10px] leading-5 text-[#667582]">
        {text}
      </p>
    </div>
  );
}

function formatMoney(
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

function formatCompactMoney(
  value: number,
) {
  if (value >= 1000000) {
    return `${(
      value / 1000000
    ).toFixed(1)}M`;
  }

  if (value >= 1000) {
    return `${Math.round(
      value / 1000,
    )}k`;
  }

  return Math.round(
    value,
  ).toString();
}

function formatChannel(
  channel: string,
) {
  return channel
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}
