import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Navigation } from "@/components/Navigation";
import { AppShell } from "@/components/AppShell";
import { ActionButton } from "@/components/ui/ActionButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { uiTokens } from "@/components/ui/tokens";
import { formatCurrency } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";

export default async function BookingsPage() {
  const bookings = await prisma.booking.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      property: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return (
    <>
      <Navigation />

      <AppShell
        title="Prenotazioni"
        subtitle="Gestisci soggiorni, ospiti e attività operative."
      >
        <div style={topBarStyle}>
          <div />

          <ActionButton
            label="Nuova prenotazione"
            href="/bookings/new"
          />
        </div>

        {bookings.length === 0 ? (
          <EmptyState
            title="Nessuna prenotazione"
            description="Crea la prima prenotazione per iniziare."
            actionLabel="Nuova prenotazione"
            actionHref="/bookings/new"
          />
        ) : (
          <div style={listStyle}>
            {bookings.map((booking) => (
              <article key={booking.id} style={cardStyle}>
                <div style={headerStyle}>
                  <div>
                    <Link
                      href={`/bookings/${booking.id}`}
                      style={titleStyle}
                    >
                      {booking.guestName}
                    </Link>

                    <p style={subtitleStyle}>
                      {booking.property.name}
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

                <div style={metricsStyle}>
                  <Metric
                    label="Check-in"
                    value={formatDate(booking.checkIn)}
                  />

                  <Metric
                    label="Check-out"
                    value={formatDate(booking.checkOut)}
                  />

                  <Metric
                    label="Notti"
                    value={booking.nights}
                  />

                  <Metric
                    label="Ospiti"
                    value={booking.guests}
                  />

                  <Metric
                    label="Importo"
                    value={formatCurrency(
                      Number(booking.grossAmount),
                      booking.currency
                    )}
                  />
                </div>

                <div style={footerStyle}>
                  <ActionButton
                    label="Apri prenotazione"
                    href={`/bookings/${booking.id}`}
                    compact
                  />

                  <ActionButton
                    label="Apri immobile"
                    href={`/properties/${booking.property.id}`}
                    variant="secondary"
                    compact
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </AppShell>
    </>
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
    <div>
      <div style={metricLabelStyle}>{label}</div>
      <strong style={metricValueStyle}>{value}</strong>
    </div>
  );
}

const topBarStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: uiTokens.spacing.lg,
};

const listStyle = {
  display: "grid",
  gap: uiTokens.spacing.md,
};

const cardStyle = {
  padding: uiTokens.spacing.lg,
  borderRadius: uiTokens.radius.lg,
  background: uiTokens.colors.surface,
  border: `1px solid ${uiTokens.colors.border}`,
  boxShadow: uiTokens.shadow.soft,
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: uiTokens.spacing.md,
  flexWrap: "wrap" as const,
};

const titleStyle = {
  color: uiTokens.colors.textPrimary,
  fontSize: "18px",
  fontWeight: uiTokens.fontWeight.strong,
  textDecoration: "none",
};

const subtitleStyle = {
  margin: `${uiTokens.spacing.xs} 0 0`,
  color: uiTokens.colors.textMuted,
};

const badgesStyle = {
  display: "flex",
  gap: uiTokens.spacing.sm,
  flexWrap: "wrap" as const,
};

const metricsStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(120px, 1fr))",
  gap: uiTokens.spacing.md,
  marginTop: uiTokens.spacing.lg,
  paddingTop: uiTokens.spacing.lg,
  borderTop: `1px solid ${uiTokens.colors.border}`,
};

const metricLabelStyle = {
  color: uiTokens.colors.textSubtle,
  fontSize: uiTokens.fontSize.xs,
};

const metricValueStyle = {
  display: "block",
  marginTop: "4px",
  color: uiTokens.colors.textPrimary,
};

const footerStyle = {
  display: "flex",
  gap: uiTokens.spacing.sm,
  marginTop: uiTokens.spacing.lg,
  paddingTop: uiTokens.spacing.lg,
  borderTop: `1px solid ${uiTokens.colors.border}`,
  flexWrap: "wrap" as const,
};