import Link from "next/link";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import { formatEnum } from "@/lib/format/enum";

type BookingHeroProps = {
  booking: {
    id: string;
    guestId: string | null;
    guestName: string;
    guestEmail: string | null;
    guestPhone: string | null;
    channel: string;
    externalBookingId: string | null;
    checkIn: Date;
    checkOut: Date;
    nights: number;
    guests: number;
    grossAmount: number;
    currency: string;
    bookingStatus: string;
    operationalStatus: string;
    internalNotes: string | null;
    createdAt: Date;
    property: {
      id: string;
      name: string;
      address: string;
      city: string;
      zone: string | null;
    };
    owner: {
      id: string;
      fullName: string;
      email: string;
      phone: string | null;
    };
  };
  openTasksCount: number;
  overdueTasksCount: number;
  daysUntilCheckIn: number;
  stayProgress: number;
};

export function BookingHero({
  booking,
  openTasksCount,
  overdueTasksCount,
  daysUntilCheckIn,
  stayProgress,
}: BookingHeroProps) {
  const stayLabel = getStayLabel({ daysUntilCheckIn, stayProgress });

  return (
    <>
      <section className="bookingHero" style={shellStyle}>
        <div className="bookingHeroHeader" style={headerStyle}>
          <div style={{ minWidth: 0 }}>
            <div style={eyebrowStyle}>PRENOTAZIONE</div>

            <h1 style={titleStyle}>
              {booking.guestId ? (
                <Link
                  href={`/guests/${booking.guestId}`}
                  style={guestLinkStyle}
                >
                  {booking.guestName}
                </Link>
              ) : (
                booking.guestName
              )}
            </h1>

            <p style={subtitleStyle}>
              {booking.property.name} ·{" "}
              {booking.property.zone ?? booking.property.city}
            </p>
          </div>

          <div className="bookingHeroStatus" style={statusStyle}>
            <StatusBadge label={booking.bookingStatus} />
            <StatusBadge label={booking.operationalStatus} />
            <StatusBadge label={booking.channel} tone="blue" compact />
          </div>
        </div>

        <div className="bookingHeroSummary" style={summaryGridStyle}>
          <Detail label="Check-in" value={formatDate(booking.checkIn)} />
          <Detail label="Check-out" value={formatDate(booking.checkOut)} />
          <Detail label="Permanenza" value={`${booking.nights} notti`} />
          <Detail label="Ospiti" value={`${booking.guests}`} />
          <Detail
            label="Valore prenotazione"
            value={formatCurrency(booking.grossAmount, booking.currency)}
            accent
          />
          <Detail label="Proprietario" value={booking.owner.fullName} />
        </div>

        <div className="bookingHeroFooter" style={footerStyle}>
          <div style={stayBlockStyle}>
            <div style={stayTopStyle}>
              <span style={metaLabelStyle}>STATO SOGGIORNO</span>
              <strong style={stayValueStyle}>{stayLabel}</strong>
            </div>

            <div style={progressTrackStyle}>
              <div
                style={{
                  ...progressValueStyle,
                  width: `${Math.min(
                    100,
                    Math.max(0, stayProgress)
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="bookingHeroReference" style={referenceStyle}>
            <span style={metaLabelStyle}>RIFERIMENTO</span>

            <strong style={referenceValueStyle}>
              {booking.externalBookingId ??
                booking.id.slice(-8).toUpperCase()}
            </strong>

            <span style={referenceMetaStyle}>
              {formatEnum(booking.channel)}
            </span>
          </div>

          <div className="bookingHeroTasks" style={taskStyle}>
            <span>
              {openTasksCount === 0
                ? "Nessun task aperto"
                : `${openTasksCount} task aperti`}
            </span>

            {overdueTasksCount > 0 ? (
              <strong style={{ color: "#F0B7A8" }}>
                {overdueTasksCount} scaduti
              </strong>
            ) : (
              <span style={{ color: "#76D6A1" }}>
                Operatività regolare
              </span>
            )}
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .bookingHero {
            padding: 20px !important;
            gap: 20px !important;
            margin-bottom: 24px !important;
            min-width: 0 !important;
            overflow: hidden !important;
          }

          .bookingHeroHeader {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 14px !important;
          }

          .bookingHeroStatus {
            justify-content: flex-start !important;
          }

          .bookingHeroSummary {
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;
            column-gap: 18px !important;
            row-gap: 2px !important;
          }

          .bookingHeroFooter {
            grid-template-columns:
              minmax(0, 1fr) !important;
            gap: 18px !important;
          }

          .bookingHeroReference {
            min-width: 0 !important;
            padding-top: 16px !important;
            border-top:
              1px solid rgba(255,255,255,0.07) !important;
          }

          .bookingHeroReference strong {
            display: block !important;
            max-width: 100% !important;
            white-space: normal !important;
            overflow-wrap: anywhere !important;
            word-break: break-word !important;
          }

          .bookingHeroTasks {
            justify-content: flex-start !important;
          }
        }
      `}</style>
    </>
  );
}

function Detail({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div style={detailStyle}>
      <span style={detailLabelStyle}>{label}</span>

      <strong
        style={{
          ...detailValueStyle,
          color: accent ? "#E3C57E" : "#FFF8EA",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function getStayLabel({
  daysUntilCheckIn,
  stayProgress,
}: {
  daysUntilCheckIn: number;
  stayProgress: number;
}) {
  if (stayProgress >= 100) return "Soggiorno concluso";
  if (stayProgress > 0) return "Ospite in soggiorno";
  if (daysUntilCheckIn === 0) return "Check-in oggi";
  if (daysUntilCheckIn === 1) return "Check-in domani";
  if (daysUntilCheckIn > 1) {
    return `Check-in tra ${daysUntilCheckIn} giorni`;
  }

  return "In attesa";
}

const shellStyle: React.CSSProperties = {
  display: "grid",
  gap: 18,
  marginBottom: 18,
  padding: "22px 24px",
  borderRadius: 22,
  background: "#09131C",
  border: "none",
  boxShadow: "0 20px 55px rgba(0,0,0,0.18)",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 18,
  flexWrap: "wrap",
};

const eyebrowStyle: React.CSSProperties = {
  color: "#D8B367",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "0.14em",
};

const titleStyle: React.CSSProperties = {
  margin: "5px 0 0",
  color: "#FFF8EA",
  fontSize: 25,
  lineHeight: 1.1,
  letterSpacing: "-0.025em",
  fontFamily: "Georgia, 'Times New Roman', serif",
};

const guestLinkStyle: React.CSSProperties = {
  color: "inherit",
  textDecoration: "none",
};

const subtitleStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#70808D",
  fontSize: 13,
};

const statusStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 7,
  flexWrap: "wrap",
};

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))",
  gap: 0,
  borderTop: "1px solid rgba(255,255,255,0.07)",
  borderBottom: "1px solid rgba(255,255,255,0.07)",
};

const detailStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
  padding: "14px 16px 14px 0",
  minWidth: 0,
};

const detailLabelStyle: React.CSSProperties = {
  color: "#70808D",
  fontSize: 10,
  fontWeight: 700,
};

const detailValueStyle: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.35,
  overflowWrap: "anywhere",
};

const footerStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(220px, 1.4fr) minmax(150px, 0.7fr) minmax(160px, 0.8fr)",
  gap: 18,
  alignItems: "center",
};

const stayBlockStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const stayTopStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
};

const metaLabelStyle: React.CSSProperties = {
  color: "#70808D",
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: "0.09em",
};

const stayValueStyle: React.CSSProperties = {
  color: "#FFF8EA",
  fontSize: 12,
};

const progressTrackStyle: React.CSSProperties = {
  width: "100%",
  height: 4,
  overflow: "hidden",
  borderRadius: 999,
  background: "rgba(255,255,255,0.08)",
};

const progressValueStyle: React.CSSProperties = {
  height: "100%",
  borderRadius: 999,
  background: "#D8B367",
};

const referenceStyle: React.CSSProperties = {
  display: "grid",
  gap: 3,
  minWidth: 0,
};

const referenceValueStyle: React.CSSProperties = {
  color: "#FFF8EA",
  fontSize: 11,
  overflowWrap: "anywhere",
};

const referenceMetaStyle: React.CSSProperties = {
  color: "#70808D",
  fontSize: 10,
};

const taskStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  flexWrap: "wrap",
  color: "#A4AFB8",
  fontSize: 11,
};
