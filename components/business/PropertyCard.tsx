import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SectionTitle } from "@/components/ui/SectionTitle";

type MonthlyPerformance = {
  label: string;
  revenue: number;
  bookings: number;
};

type FirstBooking = {
  id: string;
  checkIn: Date;
  nights: number;
};

type NextMonth = {
  label: string;
  bookings: number;
  nights: number;
  occupancyRate: number;
  grossRevenue: number;
  firstBooking: FirstBooking | null;
};

export type PropertyCardData = {
  id: string;
  name: string;
  city: string;
  zone: string | null;
  status: string;
  commercialClass: string;
  currentScore: number;
  revenue: number;
  bookingsCount: number;
  futureBookingsCount: number;
  openTasksCount: number;
  monthlyPerformance: MonthlyPerformance[];
  nextMonth: NextMonth;
};

type PropertyCardProps = {
  property: PropertyCardData;
  dark?: boolean;
};

export function PropertyCard({
  property,
  dark = false,
}: PropertyCardProps) {
  const commercialClass =
    property.commercialClass.replaceAll("_", " ");

  return (
    <Panel dark={dark}>
      <SectionTitle
        dark={dark}
        title={property.name}
        subtitle={`${property.zone ?? property.city} • ${commercialClass}`}
        action={<StatusBadge label={property.status} />}
      />

      <div style={metricsStyle}>
        <Info
          title="Ricavi"
          value={formatCurrency(property.revenue)}
          dark={dark}
        />

        <Info
          title="Booking"
          value={property.bookingsCount}
          dark={dark}
        />

        <Info
          title="Booking futuri"
          value={property.futureBookingsCount}
          dark={dark}
        />

        <Info
          title="Task aperti"
          value={property.openTasksCount}
          dark={dark}
        />

        <Score
          score={property.currentScore}
          label={commercialClass}
        />
      </div>

      <div style={chartsStyle}>
        <MiniChart
          title="Ricavi · ultimi 6 mesi"
          data={property.monthlyPerformance}
          valueKey="revenue"
          formatter={formatCompactCurrency}
        />

        <MiniChart
          title="Booking · ultimi 6 mesi"
          data={property.monthlyPerformance}
          valueKey="bookings"
          formatter={(value) => String(value)}
        />
      </div>

      <NextMonthPanel data={property.nextMonth} />

      <div style={footerStyle}>
        <span style={footerNoteStyle}>
          Andamento basato sui check-in registrati.
        </span>

        <Link
          href={`/properties/${property.id}`}
          style={linkStyle}
        >
          Apri immobile →
        </Link>
      </div>
    </Panel>
  );
}

function Info({
  title,
  value,
  dark = false,
}: {
  title: string;
  value: string | number;
  dark?: boolean;
}) {
  return (
    <div>
      <div style={infoTitleStyle}>{title}</div>

      <strong
        style={{
          fontSize: "16px",
          color: dark ? "#ffffff" : "#0f172a",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function Score({
  score,
  label,
}: {
  score: number;
  label: string;
}) {
  return (
    <div style={scoreStyle}>
      <div>
        <div style={infoTitleStyle}>Victory Score</div>

        <div style={scoreValueRowStyle}>
          <strong style={scoreValueStyle}>
            {Math.round(score)}
          </strong>

          <span style={scoreMaxStyle}>/ 100</span>
        </div>
      </div>

      <span style={scoreLabelStyle}>
        {label}
      </span>
    </div>
  );
}

function MiniChart({
  title,
  data,
  valueKey,
  formatter,
}: {
  title: string;
  data: MonthlyPerformance[];
  valueKey: "revenue" | "bookings";
  formatter: (value: number) => string;
}) {
  const values = data.map((item) => item[valueKey]);
  const maxValue = Math.max(...values, 1);
  const total = values.reduce((sum, value) => sum + value, 0);

  return (
    <div style={chartCardStyle}>
      <div style={chartHeaderStyle}>
        <span style={chartTitleStyle}>{title}</span>
        <strong style={chartTotalStyle}>
          {formatter(total)}
        </strong>
      </div>

      <div style={barsStyle}>
        {data.map((item) => {
          const value = item[valueKey];
          const height =
            value === 0
              ? 4
              : Math.max(12, (value / maxValue) * 82);

          return (
            <div
              key={`${valueKey}-${item.label}`}
              style={barColumnStyle}
              title={`${item.label}: ${formatter(value)}`}
            >
              <div style={barAreaStyle}>
                <div
                  style={{
                    ...barStyle,
                    height: `${height}px`,
                  }}
                />
              </div>

              <span style={barLabelStyle}>
                {formatMonthLabel(item.label)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NextMonthPanel({
  data,
}: {
  data: NextMonth;
}) {
  const monthLabel = data.label.toLocaleUpperCase("it-IT");

  return (
    <div style={next30Style}>
      <div style={next30HeaderStyle}>
        <div>
          <div style={next30EyebrowStyle}>
            {monthLabel}
          </div>

          <div style={next30SubtitleStyle}>
            Situazione prenotazioni del mese successivo
          </div>
        </div>

        <strong style={occupancyValueStyle}>
          {data.occupancyRate}% occupazione
        </strong>
      </div>

      <div style={next30MetricsStyle}>
        <ForecastMetric
          title="Prenotazioni"
          value={data.bookings}
        />

        <ForecastMetric
          title="Notti prenotate"
          value={data.nights}
        />

        <ForecastMetric
          title="Occupazione"
          value={`${data.occupancyRate}%`}
        />
      </div>

      <div style={occupancyTrackStyle}>
        <div
          style={{
            ...occupancyFillStyle,
            width: `${data.occupancyRate}%`,
          }}
        />
      </div>

      <div style={grossRevenueStyle}>
        <span style={infoTitleStyle}>
          Lordo prenotazioni con check-in nel mese
        </span>

        <strong style={grossRevenueValueStyle}>
          {formatCurrency(data.grossRevenue)}
        </strong>
      </div>

      {data.firstBooking ? (
        <div style={nextArrivalStyle}>
          <div>
            <div style={infoTitleStyle}>
              Primo arrivo del mese
            </div>

            <strong style={nextArrivalTitleStyle}>
              {formatDate(data.firstBooking.checkIn)}
            </strong>

            <div style={nextArrivalMetaStyle}>
              {data.firstBooking.nights}{" "}
              {data.firstBooking.nights === 1
                ? "notte"
                : "notti"}
            </div>
          </div>

          <Link
            href={`/bookings/${data.firstBooking.id}`}
            style={bookingLinkStyle}
          >
            Apri booking →
          </Link>
        </div>
      ) : (
        <div style={emptyForecastStyle}>
          Nessun arrivo previsto nel mese.
        </div>
      )}
    </div>
  );
}
function ForecastMetric({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div style={forecastMetricStyle}>
      <span style={infoTitleStyle}>{title}</span>
      <strong style={forecastMetricValueStyle}>
        {value}
      </strong>
    </div>
  );
}

function formatDate(value: Date) {
  return value.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
  });
}

function formatMonthLabel(value: string) {
  const clean = value.replace(".", "").trim();

  if (!clean) {
    return value;
  }

  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

const metricsStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(4, minmax(90px, 1fr)) minmax(150px, 1.2fr)",
  gap: "18px",
  alignItems: "center",
  marginBottom: "22px",
};

const scoreStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  padding: "12px 14px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(148,163,184,0.18)",
};

const scoreValueRowStyle = {
  display: "flex",
  alignItems: "baseline",
  gap: "5px",
  marginTop: "3px",
};

const scoreValueStyle = {
  color: "#22c55e",
  fontSize: "30px",
  lineHeight: 1,
  fontWeight: 900,
};

const scoreMaxStyle = {
  color: "#94a3b8",
  fontSize: "11px",
};

const scoreLabelStyle = {
  padding: "5px 8px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  color: "#ffffff",
  fontSize: "9px",
  fontWeight: 800,
  textAlign: "center" as const,
  maxWidth: "90px",
};

const chartsStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px",
};

const chartCardStyle = {
  padding: "16px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(148,163,184,0.18)",
};

const chartHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "14px",
};

const chartTitleStyle = {
  color: "#cbd5e1",
  fontSize: "11px",
  fontWeight: 800,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const chartTotalStyle = {
  color: "#ffffff",
  fontSize: "13px",
};

const barsStyle = {
  height: "112px",
  display: "grid",
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
  gap: "8px",
  alignItems: "end",
};

const barColumnStyle = {
  minWidth: 0,
  display: "grid",
  gridTemplateRows: "86px 18px",
  gap: "5px",
  alignItems: "end",
};

const barAreaStyle = {
  height: "86px",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
};

const barStyle = {
  width: "70%",
  maxWidth: "28px",
  minWidth: "8px",
  borderRadius: "7px 7px 3px 3px",
  background:
    "linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)",
  boxShadow: "0 6px 14px rgba(37,99,235,0.18)",
};

const barLabelStyle = {
  overflow: "hidden",
  color: "#94a3b8",
  fontSize: "9px",
  textAlign: "center" as const,
  whiteSpace: "nowrap" as const,
};

const next30Style = {
  marginTop: "14px",
  padding: "16px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(148,163,184,0.18)",
};

const next30HeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "16px",
};

const next30EyebrowStyle = {
  color: "#cbd5e1",
  fontSize: "11px",
  fontWeight: 800,
  letterSpacing: "0.05em",
};

const next30SubtitleStyle = {
  marginTop: "4px",
  color: "#64748b",
  fontSize: "10px",
};

const occupancyValueStyle = {
  color: "#22c55e",
  fontSize: "13px",
  whiteSpace: "nowrap" as const,
};

const next30MetricsStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "12px",
  marginTop: "16px",
};

const forecastMetricStyle = {
  display: "grid",
  gap: "4px",
};

const forecastMetricValueStyle = {
  color: "#ffffff",
  fontSize: "17px",
};

const occupancyTrackStyle = {
  height: "8px",
  marginTop: "16px",
  overflow: "hidden",
  borderRadius: "999px",
  background: "rgba(148,163,184,0.14)",
};

const occupancyFillStyle = {
  height: "100%",
  borderRadius: "999px",
  background:
    "linear-gradient(90deg, #2563eb 0%, #22c55e 100%)",
};

const grossRevenueStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  marginTop: "16px",
  padding: "12px 14px",
  borderRadius: "12px",
  background: "rgba(37,99,235,0.08)",
  border: "1px solid rgba(59,130,246,0.18)",
};

const grossRevenueValueStyle = {
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: 900,
  whiteSpace: "nowrap" as const,
};

const nextArrivalStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  marginTop: "16px",
  paddingTop: "14px",
  borderTop: "1px solid rgba(148,163,184,0.14)",
};

const nextArrivalTitleStyle = {
  display: "block",
  marginTop: "4px",
  color: "#ffffff",
  fontSize: "13px",
};

const nextArrivalMetaStyle = {
  marginTop: "3px",
  color: "#94a3b8",
  fontSize: "10px",
};

const bookingLinkStyle = {
  flexShrink: 0,
  padding: "8px 11px",
  borderRadius: "10px",
  background: "#1e293b",
  border: "1px solid rgba(148,163,184,0.28)",
  color: "#ffffff",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 800,
};

const emptyForecastStyle = {
  marginTop: "16px",
  paddingTop: "14px",
  borderTop: "1px solid rgba(148,163,184,0.14)",
  color: "#94a3b8",
  fontSize: "11px",
};

const footerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "14px",
  marginTop: "16px",
};

const footerNoteStyle = {
  color: "#64748b",
  fontSize: "10px",
};

const linkStyle = {
  flexShrink: 0,
  textAlign: "center" as const,
  textDecoration: "none",
  padding: "9px 13px",
  borderRadius: "11px",
  background: "#1e293b",
  border: "1px solid rgba(148,163,184,0.28)",
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: 800,
};

const infoTitleStyle = {
  color: "#94a3b8",
  fontSize: "11px",
  marginBottom: "4px",
};
