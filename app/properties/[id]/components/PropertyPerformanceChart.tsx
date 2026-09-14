type PropertyPerformanceBooking = {
  checkIn: string;
  checkOut: string;
  grossAmount: number;
  bookingStatus:
    | "PENDING"
    | "CONFIRMED"
    | "CHECKED_IN"
    | "CHECKED_OUT"
    | "CANCELLED";
};

type PropertyPerformanceChartProps = {
  bookings: PropertyPerformanceBooking[];
};

type MonthlyPerformancePoint = {
  key: string;
  label: string;
  revenue: number;
  occupancy: number;
};

const MONTHS = 12;
const DAY_MS = 24 * 60 * 60 * 1000;

const WIDTH = 760;
const HEIGHT = 280;

const LEFT = 54;
const RIGHT = 48;
const TOP = 24;
const BOTTOM = 46;

export function PropertyPerformanceChart({
  bookings,
}: PropertyPerformanceChartProps) {
  const data =
    buildMonthlyPerformance(
      bookings,
    );

  const maxRevenue = Math.max(
    1,
    ...data.map(
      (point) => point.revenue,
    ),
  );

  const hasData = data.some(
    (point) =>
      point.revenue > 0 ||
      point.occupancy > 0,
  );

  const plotWidth =
    WIDTH - LEFT - RIGHT;

  const plotHeight =
    HEIGHT - TOP - BOTTOM;

  const slotWidth =
    plotWidth /
    Math.max(
      1,
      data.length,
    );

  const barWidth =
    Math.min(
      28,
      slotWidth * 0.46,
    );

  const occupancyPoints =
    data
      .map(
        (point, index) => {
          const x =
            LEFT +
            slotWidth *
              (index + 0.5);

          const y =
            TOP +
            plotHeight -
            (point.occupancy /
              100) *
              plotHeight;

          return `${x},${y}`;
        },
      )
      .join(" ");

  return (
    <section className="mb-4 overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#09131C] shadow-[0_20px_55px_rgba(0,0,0,0.18)]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-4">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#D8B367]">
            Performance
          </p>

          <h2 className="mt-1 font-serif text-[19px] font-medium text-[#FFF8EA]">
            Ricavi e occupazione
          </h2>

          <p className="mt-1 text-[10px] leading-5 text-[#70808D]">
            Andamento della struttura negli ultimi 12 mesi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <ChartLegend
            label="Ricavi lordi"
            color="#D8B367"
          />

          <ChartLegend
            label="Occupazione"
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
            aria-label="Ricavi e occupazione della struttura negli ultimi dodici mesi"
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
                      x2={
                        WIDTH - RIGHT
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
                      {formatCompactMoney(
                        maxRevenue *
                          ratio,
                      )}
                    </text>

                    <text
                      x={
                        WIDTH -
                        RIGHT +
                        10
                      }
                      y={y + 3}
                      textAnchor="start"
                      fill="#596875"
                      fontSize="8"
                      fontFamily="Inter, ui-sans-serif, system-ui"
                    >
                      {Math.round(
                        ratio * 100,
                      )}
                      %
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

                const revenueHeight =
                  (point.revenue /
                    maxRevenue) *
                  plotHeight;

                const revenueY =
                  TOP +
                  plotHeight -
                  revenueHeight;

                return (
                  <g key={point.key}>
                    <title>
                      {`${point.label}: ${formatMoney(point.revenue)} - occupazione ${point.occupancy.toFixed(0)}%`}
                    </title>

                    {point.revenue >
                    0 ? (
                      <rect
                        x={
                          centerX -
                          barWidth / 2
                        }
                        y={revenueY}
                        width={
                          barWidth
                        }
                        height={
                          revenueHeight
                        }
                        rx="4"
                        fill="#D8B367"
                      />
                    ) : null}

                    <text
                      x={centerX}
                      y={
                        HEIGHT - 15
                      }
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

            <polyline
              points={
                occupancyPoints
              }
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {data.map(
              (point, index) => {
                const x =
                  LEFT +
                  slotWidth *
                    (index + 0.5);

                const y =
                  TOP +
                  plotHeight -
                  (point.occupancy /
                    100) *
                    plotHeight;

                return (
                  <circle
                    key={
                      point.key
                    }
                    cx={x}
                    cy={y}
                    r="3"
                    fill="#09131C"
                    stroke="#3B82F6"
                    strokeWidth="2"
                  />
                );
              },
            )}
          </svg>
        ) : (
          <div className="flex min-h-[230px] items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.015] px-8 text-center">
            <p className="max-w-sm text-[10px] leading-5 text-[#667582]">
              I dati compariranno qui quando saranno presenti prenotazioni per la struttura.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function buildMonthlyPerformance(
  bookings: PropertyPerformanceBooking[],
): MonthlyPerformancePoint[] {
  const now = new Date();

  const firstMonth =
    new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() -
          (MONTHS - 1),
        1,
      ),
    );

  return Array.from(
    {
      length: MONTHS,
    },
    (_, index) => {
      const monthStart =
        new Date(
          Date.UTC(
            firstMonth.getUTCFullYear(),
            firstMonth.getUTCMonth() +
              index,
            1,
          ),
        );

      const monthEnd =
        new Date(
          Date.UTC(
            monthStart.getUTCFullYear(),
            monthStart.getUTCMonth() +
              1,
            1,
          ),
        );

      const daysInMonth =
        Math.round(
          (monthEnd.getTime() -
            monthStart.getTime()) /
            DAY_MS,
        );

      const occupiedNights =
        new Set<string>();

      let revenue = 0;

      for (const booking of bookings) {
        if (
          booking.bookingStatus ===
          "CANCELLED"
        ) {
          continue;
        }

        const checkIn =
          startOfUtcDay(
            new Date(
              booking.checkIn,
            ),
          );

        const checkOut =
          startOfUtcDay(
            new Date(
              booking.checkOut,
            ),
          );

        if (
          !Number.isFinite(
            checkIn.getTime(),
          ) ||
          !Number.isFinite(
            checkOut.getTime(),
          ) ||
          checkOut <= checkIn
        ) {
          continue;
        }

        const totalNights =
          Math.max(
            1,
            Math.round(
              (checkOut.getTime() -
                checkIn.getTime()) /
                DAY_MS,
            ),
          );

        let overlapNights = 0;

        for (
          let cursor =
            new Date(checkIn);
          cursor < checkOut;
          cursor = new Date(
            cursor.getTime() +
              DAY_MS,
          )
        ) {
          if (
            cursor >=
              monthStart &&
            cursor < monthEnd
          ) {
            occupiedNights.add(
              cursor
                .toISOString()
                .slice(0, 10),
            );

            overlapNights += 1;
          }
        }

        if (
          overlapNights > 0
        ) {
          revenue +=
            booking.grossAmount *
            (overlapNights /
              totalNights);
        }
      }

      const occupancy =
        daysInMonth > 0
          ? Math.min(
              100,
              (occupiedNights.size /
                daysInMonth) *
                100,
            )
          : 0;

      return {
        key:
          createMonthKey(
            monthStart,
          ),

        label:
          new Intl.DateTimeFormat(
            "it-IT",
            {
              month: "short",
              timeZone:
                "UTC",
            },
          ).format(
            monthStart,
          ),

        revenue:
          roundMoney(
            revenue,
          ),

        occupancy:
          Math.round(
            occupancy * 10,
          ) / 10,
      };
    },
  );
}

function startOfUtcDay(
  date: Date,
) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    ),
  );
}

function createMonthKey(
  date: Date,
) {
  return [
    date.getUTCFullYear(),
    String(
      date.getUTCMonth() +
        1,
    ).padStart(
      2,
      "0",
    ),
  ].join("-");
}

function roundMoney(
  value: number,
) {
  return (
    Math.round(
      (value +
        Number.EPSILON) *
        100,
    ) / 100
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

function formatMoney(
  value: number,
) {
  return new Intl.NumberFormat(
    "it-IT",
    {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits:
        0,
    },
  ).format(value);
}

function formatCompactMoney(
  value: number,
) {
  if (
    value >= 1000000
  ) {
    return `${(
      value / 1000000
    ).toFixed(1)}M`;
  }

  if (
    value >= 1000
  ) {
    return `${Math.round(
      value / 1000,
    )}k`;
  }

  return Math.round(
    value,
  ).toString();
}
