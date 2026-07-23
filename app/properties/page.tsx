import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Navigation } from "@/components/Navigation";
import { AppShell } from "@/components/AppShell";

export default async function PropertiesPage() {
  const properties = await prisma.property.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: true,
      bookings: true,
      tasks: true,
    },
  });

  return (
    <>
      <Navigation />

      <AppShell
        title="Immobili Horizon"
        subtitle="Portafoglio appartamenti, score e performance iniziale."
      >
        <div style={{ marginBottom: "24px" }}>
          <Link href="/properties/new" style={primaryButtonStyle}>
            + Nuovo immobile
          </Link>
        </div>

        <div style={{ display: "grid", gap: "20px" }}>
          {properties.map((property) => {
            const totalRevenue = property.bookings.reduce(
              (sum, booking) => sum + Number(booking.grossAmount),
              0
            );

            const openTasks = property.tasks.filter(
              (task) => task.status !== "DONE"
            );

            return (
              <section
                key={property.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "22px",
                  padding: "26px",
                  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "24px",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        fontSize: "24px",
                        margin: "0 0 8px 0",
                        color: "#0f172a",
                      }}
                    >
                      {property.name}
                    </h2>

                    <p style={{ margin: "0 0 4px 0", color: "#64748b" }}>
                      {property.address} — {property.zone ?? property.city}
                    </p>

                    <p style={{ margin: 0, color: "#64748b" }}>
                      Owner: <strong>{property.owner.fullName}</strong>
                    </p>

                    <Link
                      href={`/properties/${property.id}`}
                      style={{
                        display: "inline-block",
                        marginTop: "14px",
                        color: "#0f172a",
                        fontWeight: 800,
                        textDecoration: "none",
                      }}
                    >
                      Apri centro immobile →
                    </Link>
                  </div>

                  <div
                    style={{
                      textAlign: "right",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "18px",
                      padding: "16px 20px",
                      minWidth: "130px",
                    }}
                  >
                    <div style={{ fontSize: "13px", color: "#64748b" }}>
                      Horizon Score
                    </div>
                    <div
                      style={{
                        fontSize: "38px",
                        fontWeight: 900,
                        color: "#0f172a",
                      }}
                    >
                      {property.currentScore}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, minmax(140px, 1fr))",
                    gap: "16px",
                    marginTop: "28px",
                  }}
                >
                  <MiniMetric title="Stato" value={property.status} />
                  <MiniMetric
                    title="Classe commerciale"
                    value={property.commercialClass}
                  />
                  <MiniMetric
                    title="Camere"
                    value={property.bedrooms ?? "-"}
                  />
                  <MiniMetric
                    title="Bagni"
                    value={property.bathrooms ?? "-"}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, minmax(140px, 1fr))",
                    gap: "16px",
                    marginTop: "20px",
                    paddingTop: "20px",
                    borderTop: "1px solid #e2e8f0",
                  }}
                >
                  <MiniMetric
                    title="Prenotazioni"
                    value={property.bookings.length}
                  />
                  <MiniMetric
                    title="Task aperti"
                    value={openTasks.length}
                  />
                  <MiniMetric
                    title="Ricavo demo"
                    value={`${totalRevenue.toFixed(2)} €`}
                  />
                  <MiniMetric
                    title="Capacità"
                    value={`${property.maxGuests} ospiti`}
                  />
                </div>
              </section>
            );
          })}
        </div>
      </AppShell>
    </>
  );
}

function MiniMetric({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div>
      <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "5px" }}>
        {title}
      </div>
      <strong style={{ color: "#0f172a" }}>{value}</strong>
    </div>
  );
}

const primaryButtonStyle = {
  display: "inline-block",
  padding: "11px 16px",
  borderRadius: "12px",
  background: "#0f172a",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 800,
};