import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActionButton } from "@/components/ui/ActionButton";
import { uiTokens } from "@/components/ui/tokens";
import { formatCurrency } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";

export type PropertyBookingItem = {
  id: string;
  guestName: string;
  channel: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: number;
  grossAmount: number;
  bookingStatus: string;
  operationalStatus: string;
};

type PropertyBookingsProps = {
  propertyId: string;
  bookings: PropertyBookingItem[];
};

export function PropertyBookings({
  propertyId,
  bookings,
}: PropertyBookingsProps) {
  return (
    <Panel>
      <SectionTitle
        title="Prenotazioni recenti"
        subtitle="Soggiorni, importi e stato operativo dell’immobile."
        action={
          <ActionButton
            label="Nuova prenotazione"
            href={`/bookings/new?propertyId=${propertyId}`}
            compact
          />
        }
      />

      {bookings.length === 0 ? (
        <EmptyState
          title="Nessuna prenotazione registrata"
          description="Le prenotazioni collegate all’immobile compariranno qui."
          actionLabel="Crea prenotazione"
          actionHref={`/bookings/new?propertyId=${propertyId}`}
        />
      ) : (
        <div style={listStyle}>
          {bookings.map((booking) => (
            <article key={booking.id} style={bookingCardStyle}>
              <div style={headerStyle}>
                <div>
                  <Link
                    href={`/bookings/${booking.id}`}
                    style={bookingTitleStyle}
                  >
                    {booking.guestName}
                  </Link>

                  <p style={dateStyle}>
                    {formatDate(booking.checkIn)} →{" "}
                    {formatDate(booking.checkOut)}
                  </p>
                </div>

                <div style={badgesStyle}>
                  <StatusBadge
                    label={booking.channel}
                    tone="blue"
                    compact
                  />

                  <StatusBadge
                    label={booking.bookingStatus}
                    compact
                  />

                  <StatusBadge
                    label={booking.operationalStatus}
                    compact
                  />
                </div>
              </div>

              <div style={metricsGridStyle}>
                <BookingMetric
                  label="Importo"
                  value={formatCurrency(booking.grossAmount)}
                />

                <BookingMetric
                  label="Notti"
                  value={booking.nights}
                />

                <BookingMetric
                  label="Ospiti"
                  value={booking.guests}
                />

                <BookingMetric
                  label="Check-in"
                  value={booking.checkIn.toLocaleDateString("it-IT")}
                />

                <BookingMetric
                  label="Check-out"
                  value={booking.checkOut.toLocaleDateString("it-IT")}
                />
              </div>

              <div style={footerStyle}>
                <ActionButton
                  label="Apri prenotazione"
                  href={`/bookings/${booking.id}`}
                  variant="secondary"
                  compact
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}

function BookingMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <div style={metricLabelStyle}>{label}</div>
      <strong style={metricValueStyle}>{value}</strong>
    </div>
  );
}

const listStyle = {
  display: "grid",
  gap: uiTokens.spacing.md,
};

const bookingCardStyle = {
  padding: uiTokens.spacing.md,
  borderRadius: uiTokens.radius.lg,
  background: uiTokens.colors.surfaceSoft,
  border: `1px solid ${uiTokens.colors.border}`,
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: uiTokens.spacing.md,
  flexWrap: "wrap" as const,
};

const bookingTitleStyle = {
  color: uiTokens.colors.textPrimary,
  fontSize: "16px",
  fontWeight: uiTokens.fontWeight.strong,
  textDecoration: "none",
};

const dateStyle = {
  margin: `${uiTokens.spacing.xs} 0 0`,
  color: uiTokens.colors.textMuted,
  fontSize: uiTokens.fontSize.sm,
};

const badgesStyle = {
  display: "flex",
  gap: uiTokens.spacing.sm,
  flexWrap: "wrap" as const,
};

const metricsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
  gap: uiTokens.spacing.md,
  marginTop: uiTokens.spacing.md,
  paddingTop: uiTokens.spacing.md,
  borderTop: `1px solid ${uiTokens.colors.border}`,
};

const metricLabelStyle = {
  marginBottom: "4px",
  color: uiTokens.colors.textSubtle,
  fontSize: uiTokens.fontSize.xs,
};

const metricValueStyle = {
  color: uiTokens.colors.textPrimary,
  fontSize: uiTokens.fontSize.sm,
};

const footerStyle = {
  marginTop: uiTokens.spacing.md,
  paddingTop: uiTokens.spacing.md,
  borderTop: `1px solid ${uiTokens.colors.border}`,
};