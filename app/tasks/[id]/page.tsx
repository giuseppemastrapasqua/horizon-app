import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navigation } from "@/components/Navigation";
import { AppShell } from "@/components/AppShell";
import { markTaskDone, reopenTask } from "../actions";

type TaskDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params;

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      property: true,
      booking: true,
      owner: true,
    },
  });

  if (!task) {
    notFound();
  }

  return (
    <>
      <Navigation />

      <AppShell
        title={task.title}
        subtitle={`${task.property.name} · ${task.type}`}
      >
        <div style={{ marginBottom: "24px" }}>
          <Link href="/tasks" style={ghostLinkStyle}>
            ← Torna ai task
          </Link>
        </div>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(160px, 1fr))",
            gap: "18px",
            marginBottom: "28px",
          }}
        >
          <Metric title="Stato" value={task.status} />
          <Metric title="Tipo" value={task.type} />
          <Metric
            title="Scadenza"
            value={
              task.dueDate
                ? new Date(task.dueDate).toLocaleString("it-IT")
                : "Non impostata"
            }
          />
          <Metric title="Immobile" value={task.property.name} />
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Dettaglio operativo</h2>

          <p>
            Descrizione:{" "}
            <strong>{task.description ?? "Nessuna descrizione"}</strong>
          </p>

          <p>
            Owner: <strong>{task.owner?.fullName ?? "Non assegnato"}</strong>
          </p>

          {task.booking && (
            <p>
              Prenotazione collegata:{" "}
              <Link
                href={`/bookings/${task.booking.id}`}
                style={{
                  color: "#0f172a",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                {task.booking.guestName}
              </Link>
            </p>
          )}

          <p>
            Immobile collegato:{" "}
            <Link
              href={`/properties/${task.property.id}`}
              style={{
                color: "#0f172a",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              {task.property.name}
            </Link>
          </p>
        </section>

        <section style={{ ...cardStyle, marginTop: "24px" }}>
          <h2 style={{ marginTop: 0 }}>Azioni rapide</h2>

          {task.status !== "DONE" ? (
            <form action={markTaskDone.bind(null, task.id)}>
              <button type="submit" style={primaryButtonStyle}>
                Segna come completato
              </button>
            </form>
          ) : (
            <form action={reopenTask.bind(null, task.id)}>
              <button type="submit" style={secondaryButtonStyle}>
                Riapri task
              </button>
            </form>
          )}
        </section>
      </AppShell>
    </>
  );
}

function Metric({ title, value }: { title: string; value: string | number }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: "20px",
        padding: "22px",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
      }}
    >
      <div style={{ fontSize: "14px", color: "#64748b", fontWeight: 700 }}>
        {title}
      </div>
      <div style={{ marginTop: "10px", fontSize: "22px", fontWeight: 900 }}>
        {value}
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "22px",
  padding: "24px",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
};

const ghostLinkStyle = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: "12px",
  background: "#fff",
  color: "#334155",
  border: "1px solid #e2e8f0",
  textDecoration: "none",
  fontWeight: 700,
};

const primaryButtonStyle = {
  padding: "11px 15px",
  borderRadius: "12px",
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 800,
};

const secondaryButtonStyle = {
  padding: "11px 15px",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#0f172a",
  cursor: "pointer",
  fontWeight: 800,
};