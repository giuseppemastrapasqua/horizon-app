import type { CSSProperties } from "react";

type FinanceMetricsProps = {
  grossRevenue: number;
  bookingsCount: number;
  totalNights: number;
  currency: string;
};

export function FinanceMetrics({
  grossRevenue,
  bookingsCount,
  totalNights,
  currency,
}: FinanceMetricsProps) {
  const averageRevenue =
    bookingsCount > 0
      ? grossRevenue / bookingsCount
      : 0;

  return (
    <section style={metricsGridStyle}>
      <Metric
        label="Ricavo lordo"
        value={formatCurrency(
          grossRevenue,
          currency
        )}
      />

      <Metric
        label="Prenotazioni"
        value={bookingsCount}
      />

      <Metric
        label="Notti"
        value={totalNights}
      />

      <Metric
        label="Ricavo medio"
        value={formatCurrency(
          averageRevenue,
          currency
        )}
      />
    </section>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <article style={metricStyle}>
      <div style={metricLabelStyle}>
        {label}
      </div>

      <strong style={metricValueStyle}>
        {value}
      </strong>
    </article>
  );
}

function formatCurrency(
  value: number,
  currency: string
) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
  }).format(value);
}

const metricsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "16px",
  marginBottom: "20px",
};

const metricStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  padding: "20px",
  border: "1px solid #e2e8f0",
  borderRadius: "18px",
  background: "#ffffff",
};

const metricLabelStyle: CSSProperties = {
  color: "#64748b",
  fontSize: "13px",
  fontWeight: 600,
};

const metricValueStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: "25px",
};