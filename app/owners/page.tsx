import Link from "next/link";
import { BookingOperationalStatus, TaskStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Navigation } from "@/components/Navigation";
import { AppShell } from "@/components/AppShell";

export default async function OwnersPage() {
  const now = new Date();

  const owners = await prisma.user.findMany({
    where: {
      role: UserRole.OWNER,
    },
    orderBy: {
      fullName: "asc",
    },
    include: {
      properties: {
        include: {
          bookings: true,
          tasks: true,
        },
      },
      bookings: true,
      tasks: true,
    },
  });

  const totalProperties = owners.reduce(
    (sum, owner) => sum + owner.properties.length,
    0
  );

  const totalRevenue = owners.reduce(
    (ownerSum, owner) =>
      ownerSum +
      owner.bookings.reduce(
        (bookingSum, booking) =>
          bookingSum + Number(booking.grossAmount),
        0
      ),
    0
  );

  const totalOpenTasks = owners.reduce(
    (sum, owner) =>
      sum +
      owner.tasks.filter(
        (task) =>
          task.status !== TaskStatus.DONE &&
          task.status !== TaskStatus.CANCELLED
      ).length,
    0
  );

  const totalOperationalAlerts = owners.reduce(
    (sum, owner) =>
      sum +
      owner.bookings.filter(
        (booking) =>
          booking.operationalStatus !== BookingOperationalStatus.OK
      ).length,
    0
  );

  return (
    <>
      <Navigation />

      <AppShell
        title="Proprietari"
        subtitle="Portfolio, ricavi, prenotazioni e criticità per proprietario."
      >
        <section style={summaryGridStyle}>
          <SummaryCard title="Proprietari" value={owners.length} />
          <SummaryCard title="Immobili gestiti" value={totalProperties} />
          <SummaryCard
            title="Ricavi complessivi"
            value={`${totalRevenue.toFixed(2)} €`}
          />
          <SummaryCard
            title="Alert operativi"
            value={totalOperationalAlerts}
            tone={totalOperationalAlerts > 0 ? "red" : "default"}
          />
        </section>

        <section
          style={{
            ...summaryGridStyle,
            marginBottom: "30px",
          }}
        >
          <SummaryCard title="Task aperti" value={totalOpenTasks} />
          <SummaryCard
            title="Media immobili / owner"
            value={
              owners.length > 0
                ? (totalProperties / owners.length).toFixed(1)
                : "0"
            }
          />
          <SummaryCard
            title="Ricavo medio / owner"
            value={
              owners.length > 0
                ? `${(totalRevenue / owners.length).toFixed(2)} €`
                : "0.00 €"
            }
          />
          <SummaryCard
            title="Owner senza immobili"
            value={owners.filter((owner) => owner.properties.length === 0).length}
          />
        </section>

        {owners.length === 0 ? (
          <section style={emptyStateStyle}>
            <strong>Nessun proprietario trovato</strong>

            <p style={{ margin: "7px 0 0 0", color: "#64748b" }}>
              Nel database non risultano utenti con ruolo OWNER.
            </p>
          </section>
        ) : (
          <div style={{ display: "grid", gap: "20px" }}>
            {owners.map((owner) => {
              const ownerRevenue = owner.bookings.reduce(
                (sum, booking) => sum + Number(booking.grossAmount),
                0
              );

              const futureBookings = owner.bookings.filter(
                (booking) => booking.checkIn > now
              );

              const currentBookings = owner.bookings.filter(
                (booking) =>
                  booking.checkIn <= now && booking.checkOut > now
              );

              const openTasks = owner.tasks.filter(
                (task) =>
                  task.status !== TaskStatus.DONE &&
                  task.status !== TaskStatus.CANCELLED
              );

              const operationalAlerts = owner.bookings.filter(
                (booking) =>
                  booking.operationalStatus !==
                  BookingOperationalStatus.OK
              );

              const averagePropertyScore =
                owner.properties.length > 0
                  ? owner.properties.reduce(
                      (sum, property) => sum + property.currentScore,
                      0
                    ) / owner.properties.length
                  : 0;

              return (
                <section key={owner.id} style={ownerCardStyle}>
                  <div style={ownerHeaderStyle}>
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          flexWrap: "wrap",
                        }}
                      >
                        <h2
                          style={{
                            margin: 0,
                            color: "#0f172a",
                            fontSize: "23px",
                          }}
                        >
                          <Link
                            href={`/owners/${owner.id}`}
                            style={ownerTitleStyle}
                          >
                            {owner.fullName}
                          </Link>
                        </h2>

                        <OwnerStatusBadge status={owner.status} />
                      </div>

                      <p
                        style={{
                          margin: "8px 0 0 0",
                          color: "#64748b",
                        }}
                      >
                        {owner.email}
                        {owner.phone ? ` · ${owner.phone}` : ""}
                      </p>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      <Link
                        href={`/owners/${owner.id}`}
                        style={primaryButtonStyle}
                      >
                        Apri dashboard owner
                      </Link>
                    </div>
                  </div>

                  <div style={metricsGridStyle}>
                    <MiniMetric
                      title="Immobili"
                      value={owner.properties.length}
                    />

                    <MiniMetric
                      title="Ricavi"
                      value={`${ownerRevenue.toFixed(2)} €`}
                    />

                    <MiniMetric
                      title="Booking futuri"
                      value={futureBookings.length}
                    />

                    <MiniMetric
                      title="Booking in corso"
                      value={currentBookings.length}
                    />

                    <MiniMetric
                      title="Task aperti"
                      value={openTasks.length}
                    />

                    <MiniMetric
                      title="Criticità"
                      value={operationalAlerts.length}
                      tone={operationalAlerts.length > 0 ? "red" : "default"}
                    />

                    <MiniMetric
                      title="Score medio"
                      value={averagePropertyScore.toFixed(0)}
                    />

                    <MiniMetric
                      title="Stato account"
                      value={owner.status}
                    />
                  </div>

                  <div style={propertiesSectionStyle}>
                    <div style={sectionHeaderStyle}>
                      <strong style={{ color: "#0f172a" }}>
                        Portfolio immobili
                      </strong>

                      <span
                        style={{
                          color: "#64748b",
                          fontSize: "13px",
                        }}
                      >
                        {owner.properties.length} immobili
                      </span>
                    </div>

                    {owner.properties.length === 0 ? (
                      <div style={inlineEmptyStateStyle}>
                        Nessun immobile collegato.
                      </div>
                    ) : (
                      <div style={{ display: "grid", gap: "10px" }}>
                        {owner.properties.map((property) => {
                          const propertyRevenue = property.bookings.reduce(
                            (sum, booking) =>
                              sum + Number(booking.grossAmount),
                            0
                          );

                          const propertyOpenTasks = property.tasks.filter(
                            (task) =>
                              task.status !== TaskStatus.DONE &&
                              task.status !== TaskStatus.CANCELLED
                          );

                          return (
                            <Link
                              key={property.id}
                              href={`/properties/${property.id}`}
                              style={propertyRowStyle}
                            >
                              <div>
                                <strong style={{ color: "#0f172a" }}>
                                  {property.name}
                                </strong>

                                <div
                                  style={{
                                    marginTop: "4px",
                                    color: "#64748b",
                                    fontSize: "13px",
                                  }}
                                >
                                  {property.zone ?? property.city} ·{" "}
                                  {property.commercialClass}
                                </div>
                              </div>

                              <div style={propertyMetricsStyle}>
                                <PropertyMetric
                                  label="Score"
                                  value={property.currentScore}
                                />

                                <PropertyMetric
                                  label="Ricavi"
                                  value={`${propertyRevenue.toFixed(2)} €`}
                                />

                                <PropertyMetric
                                  label="Task"
                                  value={propertyOpenTasks.length}
                                />
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </AppShell>
    </>
  );
}

function SummaryCard({
  title,
  value,
  tone = "default",
}: {
  title: string;
  value: string | number;
  tone?: "default" | "red";
}) {
  return (
    <div
      style={{
        background: tone === "red" ? "#fff7f7" : "#ffffff",
        border:
          tone === "red"
            ? "1px solid #fecaca"
            : "1px solid #e2e8f0",
        borderRadius: "20px",
        padding: "20px 22px",
        boxShadow: "0 8px 26px rgba(15, 23, 42, 0.05)",
      }}
    >
      <div
        style={{
          color: "#64748b",
          fontSize: "13px",
          fontWeight: 700,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: "9px",
          color: tone === "red" ? "#be123c" : "#0f172a",
          fontSize: "30px",
          fontWeight: 900,
          letterSpacing: "-0.03em",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MiniMetric({
  title,
  value,
  tone = "default",
}: {
  title: string;
  value: string | number;
  tone?: "default" | "red";
}) {
  return (
    <div>
      <div style={metricLabelStyle}>{title}</div>

      <strong
        style={{
          color: tone === "red" ? "#be123c" : "#0f172a",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function PropertyMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <div
        style={{
          color: "#94a3b8",
          fontSize: "11px",
          fontWeight: 700,
        }}
      >
        {label}
      </div>

      <strong
        style={{
          display: "block",
          marginTop: "3px",
          color: "#0f172a",
          fontSize: "13px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function OwnerStatusBadge({ status }: { status: string }) {
  const isActive = status === "ACTIVE";

  return (
    <span
      style={{
        padding: "6px 9px",
        borderRadius: "999px",
        background: isActive ? "#ecfdf5" : "#f1f5f9",
        color: isActive ? "#166534" : "#64748b",
        border: isActive
          ? "1px solid #bbf7d0"
          : "1px solid #cbd5e1",
        fontSize: "11px",
        fontWeight: 900,
      }}
    >
      {status}
    </span>
  );
}

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
  gap: "18px",
  marginBottom: "18px",
};

const ownerCardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "22px",
  padding: "24px",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
};

const ownerHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "18px",
  flexWrap: "wrap" as const,
};

const ownerTitleStyle = {
  color: "#0f172a",
  textDecoration: "none",
  fontWeight: 850,
};

const metricsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(140px, 1fr))",
  gap: "16px",
  marginTop: "22px",
  paddingTop: "20px",
  borderTop: "1px solid #e2e8f0",
};

const propertiesSectionStyle = {
  marginTop: "22px",
  paddingTop: "20px",
  borderTop: "1px solid #e2e8f0",
};

const sectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "center",
  marginBottom: "14px",
};

const propertyRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "18px",
  padding: "14px 16px",
  borderRadius: "14px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  textDecoration: "none",
};

const propertyMetricsStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(70px, 1fr))",
  gap: "20px",
  minWidth: "280px",
};

const primaryButtonStyle = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: "12px",
  background: "#0f172a",
  color: "#ffffff",
  border: "1px solid #0f172a",
  textDecoration: "none",
  fontWeight: 800,
};

const metricLabelStyle = {
  marginBottom: "5px",
  color: "#64748b",
  fontSize: "13px",
};

const emptyStateStyle = {
  padding: "24px",
  borderRadius: "20px",
  background: "#ffffff",
  border: "1px dashed #cbd5e1",
};

const inlineEmptyStateStyle = {
  padding: "16px",
  borderRadius: "14px",
  background: "#f8fafc",
  border: "1px dashed #cbd5e1",
  color: "#64748b",
};