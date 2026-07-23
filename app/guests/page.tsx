import Link from "next/link";

import { Navigation } from "@/components/Navigation";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { uiTokens } from "@/components/ui/tokens";
import { formatCurrency } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import { getGuests } from "@/lib/guests/get-guests";

export default async function GuestsPage() {
  const guests = await getGuests();

  const totalRevenue = guests.reduce(
    (sum, guest) => sum + guest.totalRevenue,
    0
  );

  const returningGuests = guests.filter(
    (guest) => guest.bookingsCount > 1
  ).length;

  return (
    <>
      <Navigation />

      <AppShell
        title="Ospiti"
        subtitle="Profili, soggiorni e valore storico degli ospiti."
      >
        <section style={metricsGridStyle}>
          <MetricCard
            title="Ospiti"
            value={guests.length}
            subtitle="Profili registrati"
            tone="blue"
          />

          <MetricCard
            title="Ospiti abituali"
            value={returningGuests}
            subtitle="Più di un soggiorno"
            tone="violet"
          />

          <MetricCard
            title="Valore complessivo"
            value={formatCurrency(totalRevenue, "EUR")}
            subtitle="Ricavi associati agli ospiti"
            tone="green"
          />
        </section>

        <Panel>
          <SectionTitle
            title="Archivio ospiti"
            subtitle="Elenco dei profili collegati alle prenotazioni."
          />

          {guests.length === 0 ? (
            <EmptyState
              title="Nessun ospite disponibile"
              description="Gli ospiti collegati alle prenotazioni compariranno qui."
            />
          ) : (
            <div style={listStyle}>
              {guests.map((guest) => (
                <article key={guest.id} style={cardStyle}>
                  <div style={headerStyle}>
                    <div>
                      <Link
                        href={`/guests/${guest.id}`}
                        style={titleStyle}
                      >
                        {guest.fullName}
                      </Link>

                      <p style={subtitleStyle}>
                        {guest.email ??
                          guest.phone ??
                          "Contatto non disponibile"}
                      </p>
                    </div>

                    <div style={badgesStyle}>
                      <StatusBadge
                        label={`${guest.bookingsCount} soggiorni`}
                        tone={
                          guest.bookingsCount > 1
                            ? "violet"
                            : "blue"
                        }
                        compact
                      />

                      {guest.bookingsCount > 1 ? (
                        <StatusBadge
                          label="ABITUALE"
                          tone="green"
                          compact
                        />
                      ) : null}
                    </div>
                  </div>

                  <div style={detailsGridStyle}>
                    <Detail
                      label="Valore generato"
                      value={formatCurrency(
                        guest.totalRevenue,
                        guest.currency
                      )}
                    />

                    <Detail
                      label="Ultimo soggiorno"
                      value={
                        guest.latestStay
                          ? formatDate(
                              guest.latestStay.checkIn
                            )
                          : "Nessuno"
                      }
                    />

                    <Detail
                      label="Ultimo immobile"
                      value={
                        guest.latestStay?.property.name ??
                        "Non disponibile"
                      }
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>
      </AppShell>
    </>
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

const metricsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: uiTokens.spacing.md,
  marginBottom: uiTokens.spacing.lg,
};

const listStyle = {
  display: "grid",
  gap: uiTokens.spacing.md,
};

const cardStyle = {
  padding: uiTokens.spacing.lg,
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

const detailsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(160px, 1fr))",
  gap: uiTokens.spacing.md,
  marginTop: uiTokens.spacing.lg,
  paddingTop: uiTokens.spacing.lg,
  borderTop: `1px solid ${uiTokens.colors.border}`,
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