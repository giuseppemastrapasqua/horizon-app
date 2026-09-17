import { formatCurrency } from "@/lib/format/currency";
import { formatPercentage } from "@/lib/format/percentage";

type BookingKPIsProps = {
  grossAmount: number;
  currency: string;
  nightlyRate: number;
  nights: number;
  guests: number;
  totalTaskCount: number;
  openTasksCount: number;
  completedTasksCount: number;
  overdueTasksCount: number;
  documentsCount: number;
  stayProgress: number;
  daysUntilCheckIn: number;
  daysUntilCheckOut: number;
};

export function BookingKPIs({
  grossAmount,
  currency,
  nightlyRate,
  nights,
  guests,
  openTasksCount,
  overdueTasksCount,
  documentsCount,
  stayProgress,
}: BookingKPIsProps) {
  const items = [
    {
      label: "Valore",
      value: formatCurrency(grossAmount, currency),
      meta: `${nights} notti · ${guests} ospiti`,
      accent: true,
    },
    {
      label: "ADR",
      value: formatCurrency(nightlyRate, currency),
      meta: "Ricavo medio per notte",
    },
    {
      label: "Operatività",
      value:
        openTasksCount === 0
          ? "In ordine"
          : `${openTasksCount} aperti`,
      meta:
        overdueTasksCount > 0
          ? `${overdueTasksCount} task scaduti`
          : "Nessun task scaduto",
    },
    {
      label: "Soggiorno",
      value: formatPercentage(stayProgress),
      meta: `${documentsCount} documenti collegati`,
    },
  ];

  return (
    <>
      <section className="bookingKpis" style={gridStyle}>
        {items.map((item) => (
          <article
            className="bookingKpiCard"
            key={item.label}
            style={cardStyle}
          >
            <span style={labelStyle}>{item.label}</span>

            <strong
              className="bookingKpiValue"
              style={{
                ...valueStyle,
                color: item.accent ? "#E3C57E" : "#FFF8EA",
              }}
            >
              {item.value}
            </strong>

            <span style={metaStyle}>{item.meta}</span>
          </article>
        ))}
      </section>

      <style>{`
        @media (max-width: 768px) {
          .bookingKpis {
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;
            gap: 14px !important;
            margin-bottom: 24px !important;
          }

          .bookingKpiCard {
            min-width: 0 !important;
            padding: 16px 14px !important;
          }

          .bookingKpiValue {
            font-size: clamp(16px, 5vw, 21px) !important;
            line-height: 1.15 !important;
            white-space: normal !important;
            overflow-wrap: anywhere !important;
          }

          .bookingKpiCard span {
            min-width: 0 !important;
            overflow-wrap: anywhere !important;
          }
        }
      `}</style>
    </>
  );
}

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 10,
  marginBottom: 18,
};

const cardStyle: React.CSSProperties = {
  display: "grid",
  gap: 5,
  minWidth: 0,
  padding: "14px 16px",
  borderRadius: 16,
  background: "#09131C",
  border: "none",
};

const labelStyle: React.CSSProperties = {
  color: "#70808D",
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const valueStyle: React.CSSProperties = {
  fontSize: 18,
  lineHeight: 1.15,
};

const metaStyle: React.CSSProperties = {
  color: "#70808D",
  fontSize: 10,
  lineHeight: 1.35,
};
