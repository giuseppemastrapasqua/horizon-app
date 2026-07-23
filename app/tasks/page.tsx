import Link from "next/link";
import {
  Prisma,
  TaskStatus,
  TaskType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Navigation } from "@/components/Navigation";
import { AppShell } from "@/components/AppShell";
import { markTaskDone, reopenTask } from "./actions";

type TasksPageProps = {
  searchParams?: Promise<{
    status?: string;
    due?: string;
    type?: string;
    propertyId?: string;
    linked?: string;
  }>;
};

export default async function TasksPage({
  searchParams,
}: TasksPageProps) {
  const params = await searchParams;

  const statusFilter = params?.status ?? "all";
  const dueFilter = params?.due ?? "all";
  const typeFilter = params?.type ?? "all";
  const propertyFilter = params?.propertyId ?? "all";
  const linkedFilter = params?.linked ?? "all";

  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const endOfNextThreeDays = new Date(startOfToday);
  endOfNextThreeDays.setDate(endOfNextThreeDays.getDate() + 3);

  const where: Prisma.TaskWhereInput = {};

  if (statusFilter === "open") {
    where.status = {
      in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
    };
  }

  if (statusFilter === "done") {
    where.status = TaskStatus.DONE;
  }

  if (typeFilter !== "all" && isTaskType(typeFilter)) {
    where.type = typeFilter;
  }

  if (propertyFilter !== "all") {
    where.propertyId = propertyFilter;
  }

  if (linkedFilter === "booking") {
    where.bookingId = {
      not: null,
    };
  }

  if (linkedFilter === "manual") {
    where.bookingId = null;
  }

  if (dueFilter === "overdue") {
    where.dueDate = {
      lt: startOfToday,
    };

    where.status = {
      in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
    };
  }

  if (dueFilter === "today") {
    where.dueDate = {
      gte: startOfToday,
      lt: startOfTomorrow,
    };
  }

  if (dueFilter === "3days") {
    where.dueDate = {
      gte: startOfToday,
      lt: endOfNextThreeDays,
    };
  }

  if (dueFilter === "future") {
    where.dueDate = {
      gte: startOfTomorrow,
    };
  }

  const [tasks, properties] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: [
        {
          dueDate: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
      include: {
        property: true,
        booking: true,
        owner: true,
      },
    }),

    prisma.property.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  const openTaskCount = tasks.filter(
    (task) => task.status !== TaskStatus.DONE
  ).length;

  const overdueTaskCount = tasks.filter(
    (task) =>
      task.status !== TaskStatus.DONE &&
      task.dueDate &&
      task.dueDate < startOfToday
  ).length;

  return (
    <>
      <Navigation />

      <AppShell
        title="Task operativi"
        subtitle="Pulizie, documenti, manutenzioni e attività operative collegate agli immobili."
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "16px",
            alignItems: "center",
            marginBottom: "22px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <SummaryBadge
              label="Risultati"
              value={tasks.length}
              tone="default"
            />

            <SummaryBadge
              label="Aperti"
              value={openTaskCount}
              tone="yellow"
            />

            <SummaryBadge
              label="Scaduti"
              value={overdueTaskCount}
              tone="red"
            />
          </div>

          <Link href="/tasks/new" style={newTaskButtonStyle}>
            + Nuovo task
          </Link>
        </div>

        <section style={filtersCardStyle}>
          <div>
            <div style={filterLabelStyle}>Stato</div>

            <div style={filterRowStyle}>
              <FilterLink
                href={buildTaskUrl(params, { status: "all" })}
                label="Tutti"
                active={statusFilter === "all"}
              />

              <FilterLink
                href={buildTaskUrl(params, { status: "open" })}
                label="Aperti"
                active={statusFilter === "open"}
              />

              <FilterLink
                href={buildTaskUrl(params, { status: "done" })}
                label="Completati"
                active={statusFilter === "done"}
              />
            </div>
          </div>

          <div>
            <div style={filterLabelStyle}>Scadenza</div>

            <div style={filterRowStyle}>
              <FilterLink
                href={buildTaskUrl(params, { due: "all" })}
                label="Tutte"
                active={dueFilter === "all"}
              />

              <FilterLink
                href={buildTaskUrl(params, { due: "overdue" })}
                label="Scaduti"
                active={dueFilter === "overdue"}
              />

              <FilterLink
                href={buildTaskUrl(params, { due: "today" })}
                label="Oggi"
                active={dueFilter === "today"}
              />

              <FilterLink
                href={buildTaskUrl(params, { due: "3days" })}
                label="Prossimi 3 giorni"
                active={dueFilter === "3days"}
              />

              <FilterLink
                href={buildTaskUrl(params, { due: "future" })}
                label="Futuri"
                active={dueFilter === "future"}
              />
            </div>
          </div>

          <div>
            <div style={filterLabelStyle}>Collegamento</div>

            <div style={filterRowStyle}>
              <FilterLink
                href={buildTaskUrl(params, { linked: "all" })}
                label="Tutti"
                active={linkedFilter === "all"}
              />

              <FilterLink
                href={buildTaskUrl(params, { linked: "booking" })}
                label="Con prenotazione"
                active={linkedFilter === "booking"}
              />

              <FilterLink
                href={buildTaskUrl(params, { linked: "manual" })}
                label="Solo immobile"
                active={linkedFilter === "manual"}
              />
            </div>
          </div>

          <form method="GET" style={selectFiltersStyle}>
            {statusFilter !== "all" && (
              <input
                type="hidden"
                name="status"
                value={statusFilter}
              />
            )}

            {dueFilter !== "all" && (
              <input
                type="hidden"
                name="due"
                value={dueFilter}
              />
            )}

            {linkedFilter !== "all" && (
              <input
                type="hidden"
                name="linked"
                value={linkedFilter}
              />
            )}

            <label style={selectLabelStyle}>
              Immobile

              <select
                name="propertyId"
                defaultValue={propertyFilter}
                style={selectStyle}
              >
                <option value="all">Tutti gli immobili</option>

                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={selectLabelStyle}>
              Tipo task

              <select
                name="type"
                defaultValue={typeFilter}
                style={selectStyle}
              >
                <option value="all">Tutti i tipi</option>
                <option value="CLEANING">Cleaning</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="GUEST_DOCUMENTS">
                  Guest documents
                </option>
                <option value="CHECK_IN">Check-in</option>
                <option value="CHECK_OUT">Check-out</option>
                <option value="ADMIN">Admin</option>
                <option value="ISSUE">Issue</option>
              </select>
            </label>

            <button type="submit" style={applyFiltersButtonStyle}>
              Applica filtri
            </button>

            <Link href="/tasks" style={resetFiltersStyle}>
              Azzera
            </Link>
          </form>
        </section>

        {tasks.length === 0 ? (
          <section style={emptyStateStyle}>
            <strong>Nessun task trovato</strong>

            <p style={{ margin: "7px 0 0 0", color: "#64748b" }}>
              Modifica i filtri oppure crea un nuovo task operativo.
            </p>
          </section>
        ) : (
          <div style={{ display: "grid", gap: "18px" }}>
            {tasks.map((task) => {
              const isOverdue =
                task.status !== TaskStatus.DONE &&
                task.dueDate &&
                task.dueDate < startOfToday;

              const isDueToday =
                task.dueDate &&
                task.dueDate >= startOfToday &&
                task.dueDate < startOfTomorrow;

              return (
                <section
                  key={task.id}
                  style={{
                    ...taskCardStyle,
                    borderLeft: isOverdue
                      ? "5px solid #f43f5e"
                      : isDueToday
                        ? "5px solid #f59e0b"
                        : "5px solid #cbd5e1",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "18px",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "9px",
                          flexWrap: "wrap",
                        }}
                      >
                        <h2
                          style={{
                            margin: 0,
                            fontSize: "21px",
                          }}
                        >
                          <Link
                            href={`/tasks/${task.id}`}
                            style={taskTitleStyle}
                          >
                            {task.title}
                          </Link>
                        </h2>

                        {isOverdue && (
                          <DueBadge label="SCADUTO" tone="red" />
                        )}

                        {isDueToday && (
                          <DueBadge label="OGGI" tone="yellow" />
                        )}
                      </div>

                      <p
                        style={{
                          margin: "9px 0 0 0",
                          color: "#64748b",
                        }}
                      >
                        {task.description ?? "Nessuna descrizione"}
                      </p>
                    </div>

                    <StatusBadge status={task.status} />
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(4, minmax(140px, 1fr))",
                      gap: "16px",
                      marginTop: "18px",
                      paddingTop: "18px",
                      borderTop: "1px solid #e2e8f0",
                    }}
                  >
                    <MiniMetric title="Tipo" value={task.type} />

                    <LinkedMetric
                      title="Immobile"
                      href={`/properties/${task.property.id}`}
                      value={task.property.name}
                    />

                    <MiniMetric
                      title="Owner"
                      value={
                        task.owner?.fullName ?? "Non assegnato"
                      }
                    />

                    <MiniMetric
                      title="Scadenza"
                      value={
                        task.dueDate
                          ? new Date(task.dueDate).toLocaleString(
                              "it-IT"
                            )
                          : "Non impostata"
                      }
                    />
                  </div>

                  {task.booking && (
                    <div style={bookingLinkBoxStyle}>
                      Prenotazione collegata:{" "}
                      <Link
                        href={`/bookings/${task.booking.id}`}
                        style={linkedTextStyle}
                      >
                        {task.booking.guestName}
                      </Link>

                      <span style={{ color: "#94a3b8" }}>
                        {" "}
                        ·{" "}
                        {new Date(
                          task.booking.checkIn
                        ).toLocaleDateString("it-IT")}
                      </span>
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginTop: "18px",
                      flexWrap: "wrap",
                    }}
                  >
                    <Link
                      href={`/tasks/${task.id}`}
                      style={detailButtonStyle}
                    >
                      Apri dettaglio
                    </Link>

                    {task.status !== TaskStatus.DONE ? (
                      <form
                        action={markTaskDone.bind(null, task.id)}
                      >
                        <button
                          type="submit"
                          style={primaryButtonStyle}
                        >
                          Segna come completato
                        </button>
                      </form>
                    ) : (
                      <form action={reopenTask.bind(null, task.id)}>
                        <button
                          type="submit"
                          style={secondaryButtonStyle}
                        >
                          Riapri task
                        </button>
                      </form>
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

function buildTaskUrl(
  current:
    | {
        status?: string;
        due?: string;
        type?: string;
        propertyId?: string;
        linked?: string;
      }
    | undefined,
  changes: {
    status?: string;
    due?: string;
    type?: string;
    propertyId?: string;
    linked?: string;
  }
) {
  const values = {
    status: current?.status ?? "all",
    due: current?.due ?? "all",
    type: current?.type ?? "all",
    propertyId: current?.propertyId ?? "all",
    linked: current?.linked ?? "all",
    ...changes,
  };

  const query = new URLSearchParams();

  if (values.status !== "all") {
    query.set("status", values.status);
  }

  if (values.due !== "all") {
    query.set("due", values.due);
  }

  if (values.type !== "all") {
    query.set("type", values.type);
  }

  if (values.propertyId !== "all") {
    query.set("propertyId", values.propertyId);
  }

  if (values.linked !== "all") {
    query.set("linked", values.linked);
  }

  const queryString = query.toString();

  return queryString ? `/tasks?${queryString}` : "/tasks";
}

function isTaskType(value: string): value is TaskType {
  return Object.values(TaskType).includes(value as TaskType);
}

function FilterLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-block",
        padding: "9px 13px",
        borderRadius: "999px",
        border: active
          ? "1px solid #0f172a"
          : "1px solid #cbd5e1",
        background: active ? "#0f172a" : "#ffffff",
        color: active ? "#ffffff" : "#334155",
        textDecoration: "none",
        fontSize: "13px",
        fontWeight: 800,
      }}
    >
      {label}
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style =
    status === TaskStatus.DONE
      ? {
          background: "#dcfce7",
          color: "#166534",
          border: "1px solid #bbf7d0",
        }
      : status === TaskStatus.IN_PROGRESS
        ? {
            background: "#fef9c3",
            color: "#854d0e",
            border: "1px solid #fde68a",
          }
        : {
            background: "#fee2e2",
            color: "#991b1b",
            border: "1px solid #fecaca",
          };

  return (
    <span
      style={{
        ...style,
        padding: "7px 11px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 900,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

function DueBadge({
  label,
  tone,
}: {
  label: string;
  tone: "red" | "yellow";
}) {
  const style =
    tone === "red"
      ? {
          background: "#fff1f2",
          color: "#be123c",
          border: "1px solid #fecdd3",
        }
      : {
          background: "#fffbeb",
          color: "#a16207",
          border: "1px solid #fde68a",
        };

  return (
    <span
      style={{
        ...style,
        padding: "5px 8px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 900,
      }}
    >
      {label}
    </span>
  );
}

function SummaryBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "default" | "yellow" | "red";
}) {
  const style =
    tone === "red"
      ? {
          background: "#fff1f2",
          color: "#be123c",
          border: "1px solid #fecdd3",
        }
      : tone === "yellow"
        ? {
            background: "#fffbeb",
            color: "#a16207",
            border: "1px solid #fde68a",
          }
        : {
            background: "#ffffff",
            color: "#0f172a",
            border: "1px solid #e2e8f0",
          };

  return (
    <div
      style={{
        ...style,
        padding: "9px 12px",
        borderRadius: "13px",
        fontSize: "13px",
        fontWeight: 800,
      }}
    >
      {label}: {value}
    </div>
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
      <div style={metricLabelStyle}>{title}</div>
      <strong style={{ color: "#0f172a" }}>{value}</strong>
    </div>
  );
}

function LinkedMetric({
  title,
  href,
  value,
}: {
  title: string;
  href: string;
  value: string;
}) {
  return (
    <div>
      <div style={metricLabelStyle}>{title}</div>

      <Link href={href} style={linkedTextStyle}>
        {value}
      </Link>
    </div>
  );
}

const filtersCardStyle = {
  display: "grid",
  gap: "22px",
  marginBottom: "24px",
  padding: "22px",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "20px",
  boxShadow: "0 8px 26px rgba(15, 23, 42, 0.05)",
};

const filterLabelStyle = {
  marginBottom: "10px",
  color: "#64748b",
  fontSize: "13px",
  fontWeight: 800,
};

const filterRowStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "8px",
};

const selectFiltersStyle = {
  display: "flex",
  gap: "12px",
  alignItems: "end",
  flexWrap: "wrap" as const,
  paddingTop: "18px",
  borderTop: "1px solid #e2e8f0",
};

const selectLabelStyle = {
  display: "grid",
  gap: "7px",
  minWidth: "220px",
  color: "#475569",
  fontSize: "13px",
  fontWeight: 800,
};

const selectStyle = {
  padding: "10px 12px",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
};

const applyFiltersButtonStyle = {
  padding: "11px 15px",
  borderRadius: "12px",
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 800,
};

const resetFiltersStyle = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#334155",
  textDecoration: "none",
  fontWeight: 800,
};

const taskCardStyle = {
  background: "#ffffff",
  borderTop: "1px solid #e2e8f0",
  borderRight: "1px solid #e2e8f0",
  borderBottom: "1px solid #e2e8f0",
  borderRadius: "20px",
  padding: "22px",
  boxShadow: "0 8px 26px rgba(15, 23, 42, 0.05)",
};

const taskTitleStyle = {
  color: "#0f172a",
  fontWeight: 850,
  textDecoration: "none",
};

const bookingLinkBoxStyle = {
  marginTop: "16px",
  padding: "13px 15px",
  borderRadius: "14px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  color: "#475569",
};

const linkedTextStyle = {
  color: "#0f172a",
  fontWeight: 800,
  textDecoration: "none",
};

const metricLabelStyle = {
  marginBottom: "5px",
  color: "#64748b",
  fontSize: "13px",
};

const newTaskButtonStyle = {
  display: "inline-block",
  padding: "11px 16px",
  borderRadius: "12px",
  background: "#0f172a",
  color: "#ffffff",
  border: "1px solid #0f172a",
  textDecoration: "none",
  fontWeight: 800,
};

const detailButtonStyle = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#334155",
  textDecoration: "none",
  fontWeight: 800,
};

const primaryButtonStyle = {
  padding: "11px 15px",
  borderRadius: "12px",
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 800,
};

const secondaryButtonStyle = {
  padding: "11px 15px",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  cursor: "pointer",
  fontWeight: 800,
};

const emptyStateStyle = {
  padding: "24px",
  borderRadius: "20px",
  background: "#ffffff",
  border: "1px dashed #cbd5e1",
};