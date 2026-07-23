import Link from "next/link";
import { ActionButton } from "@/components/ui/ActionButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { uiTokens } from "@/components/ui/tokens";
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
  return (
    <section style={heroStyle}>
      <div style={contentStyle}>
        <div style={topRowStyle}>
          <div>
            <div style={eyebrowStyle}>BOOKING WORKSPACE</div>

           <h1 style={titleStyle}>
  {booking.guestId ? (
    <Link
      href={`/guests/${booking.guestId}`}
      style={{
        color: "inherit",
        textDecoration: "none",
      }}
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

          <div style={statusRowStyle}>
            <StatusBadge
              label={booking.bookingStatus}
            />

            <StatusBadge
              label={booking.operationalStatus}
            />
          </div>
        </div>

        <div style={badgeRowStyle}>
          <StatusBadge
            label={booking.channel}
            tone="blue"
            compact
          />

          <StatusBadge
            label={`${booking.nights} notti`}
            tone="default"
            compact
          />

          <StatusBadge
            label={`${booking.guests} ospiti`}
            tone="violet"
            compact
          />

          <StatusBadge
            label={`${openTasksCount} task aperti`}
            tone={openTasksCount > 0 ? "yellow" : "green"}
            compact
          />

          <StatusBadge
            label={
              overdueTasksCount > 0
                ? `${overdueTasksCount} task scaduti`
                : "Nessun task scaduto"
            }
            tone={overdueTasksCount > 0 ? "red" : "green"}
            compact
          />
        </div>

        <div style={detailsGridStyle}>
          <Detail
            label="Check-in"
            value={formatDate(booking.checkIn)}
          />

          <Detail
            label="Check-out"
            value={formatDate(booking.checkOut)}
          />

          <Detail
            label="Importo"
            value={formatCurrency(
              booking.grossAmount,
              booking.currency
            )}
          />

          <Detail
            label="Proprietario"
            value={booking.owner.fullName}
          />

          <Detail
            label="Contatto ospite"
            value={
              booking.guestPhone ??
              booking.guestEmail ??
              "Non indicato"
            }
          />
        </div>

        <div style={actionsStyle}>
          <ActionButton
            label="Apri immobile"
            href={`/properties/${booking.property.id}`}
          />

          <ActionButton
            label="Owner workspace"
            href={`/owners/${booking.owner.id}`}
            variant="secondary"
          />

          <ActionButton
            label="Nuovo task"
            href={`/tasks/new?propertyId=${booking.property.id}&bookingId=${booking.id}`}
            variant="secondary"
          />

          <ActionButton
            label="Documenti"
            href={`/documents?propertyId=${booking.property.id}`}
            variant="secondary"
          />
        </div>
      </div>

      <aside style={summaryCardStyle}>
        <span style={summaryEyebrowStyle}>
          STATO SOGGIORNO
        </span>

        <strong style={summaryValueStyle}>
          {getStayLabel({
            daysUntilCheckIn,
            stayProgress,
          })}
        </strong>

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

        <span style={progressTextStyle}>
          {stayProgress.toFixed(0)}% completato
        </span>

        <div style={summaryDividerStyle} />

        <span style={summaryLabelStyle}>
          CODICE PRENOTAZIONE
        </span>

        <strong style={summaryCodeStyle}>
          {booking.externalBookingId ??
            booking.id.slice(-8).toUpperCase()}
        </strong>

        <span style={summaryMetaStyle}>
          {formatEnum(booking.channel)}
        </span>
      </aside>
    </section>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <div style={detailLabelStyle}>{label}</div>
      <strong style={detailValueStyle}>{value}</strong>
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
  if (stayProgress >= 100) {
    return "Soggiorno concluso";
  }

  if (stayProgress > 0) {
    return "Ospite in soggiorno";
  }

  if (daysUntilCheckIn === 0) {
    return "Check-in oggi";
  }

  if (daysUntilCheckIn === 1) {
    return "Check-in domani";
  }

  if (daysUntilCheckIn > 1) {
    return `Check-in tra ${daysUntilCheckIn} giorni`;
  }

  return "In attesa";
}

const heroStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 250px",
  gap: uiTokens.spacing.lg,
  alignItems: "stretch",
  marginBottom: uiTokens.spacing.lg,
  padding: uiTokens.spacing.xl,
  borderRadius: uiTokens.radius.xl,
  background:
    "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
  border: `1px solid ${uiTokens.colors.border}`,
  boxShadow: uiTokens.shadow.panel,
};

const contentStyle = {
  display: "grid",
  gap: uiTokens.spacing.lg,
};

const topRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: uiTokens.spacing.md,
  flexWrap: "wrap" as const,
};

const statusRowStyle = {
  display: "flex",
  gap: uiTokens.spacing.sm,
  flexWrap: "wrap" as const,
};

const eyebrowStyle = {
  color: uiTokens.colors.textMuted,
  fontSize: uiTokens.fontSize.xs,
  fontWeight: uiTokens.fontWeight.strong,
  letterSpacing: "0.08em",
};

const titleStyle = {
  margin: `${uiTokens.spacing.xs} 0 0`,
  color: uiTokens.colors.textPrimary,
  fontSize: "34px",
  lineHeight: 1.1,
  letterSpacing: "-0.04em",
};

const subtitleStyle = {
  margin: `${uiTokens.spacing.sm} 0 0`,
  color: uiTokens.colors.textMuted,
  fontSize: uiTokens.fontSize.md,
};

const badgeRowStyle = {
  display: "flex",
  gap: uiTokens.spacing.sm,
  flexWrap: "wrap" as const,
};

const detailsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(130px, 1fr))",
  gap: uiTokens.spacing.md,
};

const detailLabelStyle = {
  marginBottom: "4px",
  color: uiTokens.colors.textSubtle,
  fontSize: uiTokens.fontSize.xs,
};

const detailValueStyle = {
  color: uiTokens.colors.textPrimary,
  fontSize: uiTokens.fontSize.sm,
};

const actionsStyle = {
  display: "flex",
  gap: uiTokens.spacing.sm,
  flexWrap: "wrap" as const,
};

const summaryCardStyle = {
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  gap: uiTokens.spacing.sm,
  padding: uiTokens.spacing.lg,
  borderRadius: uiTokens.radius.xl,
  background: uiTokens.colors.primary,
  color: uiTokens.colors.primaryText,
  boxShadow: uiTokens.shadow.elevated,
  textAlign: "center" as const,
};

const summaryEyebrowStyle = {
  color: "#94a3b8",
  fontSize: uiTokens.fontSize.xs,
  fontWeight: uiTokens.fontWeight.strong,
  letterSpacing: "0.08em",
};

const summaryValueStyle = {
  color: "#ffffff",
  fontSize: "22px",
  lineHeight: 1.2,
};

const progressTrackStyle = {
  width: "100%",
  height: "8px",
  marginTop: uiTokens.spacing.sm,
  overflow: "hidden",
  borderRadius: uiTokens.radius.pill,
  background: "rgba(255,255,255,0.12)",
};

const progressValueStyle = {
  height: "100%",
  borderRadius: uiTokens.radius.pill,
  background: "#4ade80",
};

const progressTextStyle = {
  color: "#cbd5e1",
  fontSize: uiTokens.fontSize.xs,
};

const summaryDividerStyle = {
  width: "100%",
  height: "1px",
  margin: uiTokens.spacing.sm,
  background: "rgba(255,255,255,0.12)",
};

const summaryLabelStyle = {
  color: "#94a3b8",
  fontSize: "9px",
  fontWeight: uiTokens.fontWeight.strong,
};

const summaryCodeStyle = {
  color: "#ffffff",
  fontSize: "15px",
  letterSpacing: "0.06em",
};

const summaryMetaStyle = {
  color: "#cbd5e1",
  fontSize: uiTokens.fontSize.xs,
};