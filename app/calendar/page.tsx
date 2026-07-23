import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Navigation } from "@/components/Navigation";
import { AppShell } from "@/components/AppShell";

type CalendarItem = {
  id: string;
  date: Date;
  type: "CHECK_IN" | "CHECK_OUT" | "TASK";
  title: string;
  subtitle: string;
  href: string;
  propertyId: string;
};

type CalendarPageProps = {
  searchParams?: Promise<{
    range?: string;
    type?: string;
    propertyId?: string;
  }>;
};

export default async function CalendarPage({
  searchParams,
}: CalendarPageProps) {
  const params = await searchParams;

  const rangeFilter = params?.range ?? "all";
  const typeFilter = params?.type ?? "all";
  const propertyFilter = params?.propertyId ?? "all";

  const [properties, bookings, tasks] = await Promise.all([
    prisma.property.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.booking.findMany({
      include: {
        property: true,
      },
      orderBy: {
        checkIn: "asc",
      },
    }),
    prisma.task.findMany({
      where: {
        dueDate: {
          not: null,
        },
      },
      include: {
        property: true,
      },
      orderBy: {
        dueDate: "asc",
      },
    }),
  ]);

  const allItems: CalendarItem[] = [
    ...bookings.map((booking) => ({
      id: `check-in-${booking.id}`,
      date: booking.checkIn,
      type: "CHECK_IN" as const,
      title: `Check-in · ${booking.guestName}`,
      subtitle: `${booking.property.name} · ${booking.channel}`,
      href: `/bookings/${booking.id}`,
      propertyId: booking.propertyId,
    })),
    ...bookings.map((booking) => ({
      id: `check-out-${booking.id}`,
      date: booking.checkOut,
      type: "CHECK_OUT" as const,
      title: `Check-out · ${booking.guestName}`,
      subtitle: `${booking.property.name} · ${booking.channel}`,
      href: `/bookings/${booking.id}`,
      propertyId: booking.propertyId,
    })),
    ...tasks
      .filter((task) => task.dueDate)
      .map((task) => ({
        id: `task-${task.id}`,
        date: task.dueDate as Date,
        type: "TASK" as const,
        title: task.title,
        subtitle: `${task.property.name} · ${task.status}`,
        href: `/tasks/${task.id}`,
        propertyId: task.propertyId,
      })),
  ];

  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const endOfNextSevenDays = new Date(startOfToday);
  endOfNextSevenDays.setDate(endOfNextSevenDays.getDate() + 7);

  const items = allItems
    .filter((item) => {
      const matchesType = typeFilter === "all" || item.type === typeFilter;

      const matchesRange =
        rangeFilter === "today"
          ? item.date >= startOfToday && item.date < startOfTomorrow
          : rangeFilter === "7days"
            ? item.date >= startOfToday && item.date < endOfNextSevenDays
            : true;

      const matchesProperty =
        propertyFilter === "all" || item.propertyId === propertyFilter;

      return matchesType && matchesRange && matchesProperty;
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const groupedItems = items.reduce<Record<string, CalendarItem[]>>(
    (groups, item) => {
      const key = item.date.toISOString().slice(0, 10);

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(item);

      return groups;
    },
    {}
  );

  return (
    <>
      <Navigation />

      <AppShell
        title="Calendario operativo"
        subtitle="Check-in, check-out e task organizzati per data."
      >
        <div
  style={{
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "20px",
  }}
>
  <Link href="/calendar/month" style={secondaryButtonStyle}>
    Vista mensile
  </Link>
</div>
        <section style={filtersCardStyle}>
          <div>
            <div style={filterLabelStyle}>Periodo</div>

            <div style={filterRowStyle}>
              <FilterLink
                href={buildCalendarUrl("all", typeFilter, propertyFilter)}
                label="Tutti"
                active={rangeFilter === "all"}
              />
              <FilterLink
                href={buildCalendarUrl("today", typeFilter, propertyFilter)}
                label="Solo oggi"
                active={rangeFilter === "today"}
              />
              <FilterLink
                href={buildCalendarUrl("7days", typeFilter, propertyFilter)}
                label="Prossimi 7 giorni"
                active={rangeFilter === "7days"}
              />
            </div>
          </div>

          <div>
            <div style={filterLabelStyle}>Tipo evento</div>

            <div style={filterRowStyle}>
              <FilterLink
                href={buildCalendarUrl(rangeFilter, "all", propertyFilter)}
                label="Tutti"
                active={typeFilter === "all"}
              />
              <FilterLink
                href={buildCalendarUrl(rangeFilter, "CHECK_IN", propertyFilter)}
                label="Check-in"
                active={typeFilter === "CHECK_IN"}
              />
              <FilterLink
                href={buildCalendarUrl(rangeFilter, "CHECK_OUT", propertyFilter)}
                label="Check-out"
                active={typeFilter === "CHECK_OUT"}
              />
              <FilterLink
                href={buildCalendarUrl(rangeFilter, "TASK", propertyFilter)}
                label="Task"
                active={typeFilter === "TASK"}
              />
            </div>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <div style={filterLabelStyle}>Immobile</div>

            <div style={filterRowStyle}>
              <FilterLink
                href={buildCalendarUrl(rangeFilter, typeFilter, "all")}
                label="Tutti gli immobili"
                active={propertyFilter === "all"}
              />

              {properties.map((property) => (
                <FilterLink
                  key={property.id}
                  href={buildCalendarUrl(
                    rangeFilter,
                    typeFilter,
                    property.id
                  )}
                  label={property.name}
                  active={propertyFilter === property.id}
                />
              ))}
            </div>
          </div>
        </section>

        <div style={{ display: "grid", gap: "22px" }}>
          {Object.keys(groupedItems).length === 0 ? (
            <section style={emptyCardStyle}>
              Nessuna attività trovata con i filtri selezionati.
            </section>
          ) : (
            Object.entries(groupedItems).map(([date, dayItems]) => (
              <section key={date} style={dayCardStyle}>
                <h2 style={dateTitleStyle}>
                  {new Date(`${date}T12:00:00`).toLocaleDateString("it-IT", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </h2>

                <div style={{ display: "grid", gap: "12px" }}>
                  {dayItems.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      style={{
                        ...eventCardStyle,
                        borderLeft:
                          item.type === "CHECK_IN"
                            ? "5px solid #22c55e"
                            : item.type === "CHECK_OUT"
                              ? "5px solid #f43f5e"
                              : "5px solid #0f172a",
                      }}
                    >
                      <div>
                        <strong style={{ color: "#0f172a" }}>
                          {item.title}
                        </strong>

                        <div
                          style={{
                            marginTop: "5px",
                            color: "#64748b",
                            fontSize: "14px",
                          }}
                        >
                          {item.subtitle}
                        </div>
                      </div>

                      <span style={timeStyle}>
                        {item.date.toLocaleTimeString("it-IT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </AppShell>
    </>
  );
}

function buildCalendarUrl(
  range: string,
  type: string,
  propertyId: string
) {
  const params = new URLSearchParams();

  if (range !== "all") {
    params.set("range", range);
  }

  if (type !== "all") {
    params.set("type", type);
  }

  if (propertyId !== "all") {
    params.set("propertyId", propertyId);
  }

  const query = params.toString();

  return query ? `/calendar?${query}` : "/calendar";
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
        border: active ? "1px solid #0f172a" : "1px solid #cbd5e1",
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

const filtersCardStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "24px",
  marginBottom: "24px",
  padding: "20px",
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

const dayCardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "22px",
  padding: "24px",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
};

const dateTitleStyle = {
  margin: "0 0 18px 0",
  color: "#0f172a",
  fontSize: "21px",
  textTransform: "capitalize" as const,
};

const eventCardStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "18px",
  alignItems: "center",
  padding: "15px 16px",
  borderRadius: "14px",
  background: "#f8fafc",
  borderTop: "1px solid #e2e8f0",
  borderRight: "1px solid #e2e8f0",
  borderBottom: "1px solid #e2e8f0",
  textDecoration: "none",
};

const timeStyle = {
  color: "#64748b",
  fontWeight: 800,
  whiteSpace: "nowrap" as const,
};

const emptyCardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "22px",
  padding: "24px",
  color: "#64748b",
};

const secondaryButtonStyle = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: "12px",
  background: "#ffffff",
  color: "#334155",
  border: "1px solid #cbd5e1",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 800,
};