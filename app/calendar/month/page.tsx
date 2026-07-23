import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Navigation } from "@/components/Navigation";
import { AppShell } from "@/components/AppShell";

type CalendarEvent = {
  id: string;
  date: Date;
  type: "CHECK_IN" | "CHECK_OUT" | "TASK";
  title: string;
  href: string;
};

type MonthlyCalendarPageProps = {
  searchParams?: Promise<{
    month?: string;
  }>;
};

export default async function MonthlyCalendarPage({
  searchParams,
}: MonthlyCalendarPageProps) {
  const params = await searchParams;
  const selectedMonth = parseMonth(params?.month);

  const year = selectedMonth.getFullYear();
  const monthIndex = selectedMonth.getMonth();

  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 1);

  const [bookings, tasks] = await Promise.all([
    prisma.booking.findMany({
      where: {
        OR: [
          {
            checkIn: {
              gte: monthStart,
              lt: monthEnd,
            },
          },
          {
            checkOut: {
              gte: monthStart,
              lt: monthEnd,
            },
          },
        ],
      },
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
          gte: monthStart,
          lt: monthEnd,
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

  const events: CalendarEvent[] = [
    ...bookings
      .filter((booking) => isInSelectedMonth(booking.checkIn, year, monthIndex))
      .map((booking) => ({
        id: `check-in-${booking.id}`,
        date: booking.checkIn,
        type: "CHECK_IN" as const,
        title: `${booking.guestName} · ${booking.property.name}`,
        href: `/bookings/${booking.id}`,
      })),

    ...bookings
      .filter((booking) => isInSelectedMonth(booking.checkOut, year, monthIndex))
      .map((booking) => ({
        id: `check-out-${booking.id}`,
        date: booking.checkOut,
        type: "CHECK_OUT" as const,
        title: `${booking.guestName} · ${booking.property.name}`,
        href: `/bookings/${booking.id}`,
      })),

    ...tasks
      .filter((task) => task.dueDate)
      .map((task) => ({
        id: `task-${task.id}`,
        date: task.dueDate as Date,
        type: "TASK" as const,
        title: `${task.title} · ${task.property.name}`,
        href: `/tasks/${task.id}`,
      })),
  ];

  const eventsByDay = events.reduce<Record<number, CalendarEvent[]>>(
    (groups, event) => {
      const day = event.date.getDate();

      if (!groups[day]) {
        groups[day] = [];
      }

      groups[day].push(event);
      return groups;
    },
    {}
  );

  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  // Converte domenica=0 nel formato lunedì=0.
  const firstWeekday = (new Date(year, monthIndex, 1).getDay() + 6) % 7;

  const previousMonth = new Date(year, monthIndex - 1, 1);
  const nextMonth = new Date(year, monthIndex + 1, 1);

  const calendarCells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(null);
  }

  return (
    <>
      <Navigation />

      <AppShell
        title="Calendario mensile"
        subtitle="Vista mensile di check-in, check-out e task operativi."
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            marginBottom: "22px",
            flexWrap: "wrap",
          }}
        >
          <Link href="/calendar" style={secondaryButtonStyle}>
            ← Vista cronologica
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link
              href={`/calendar/month?month=${formatMonthParam(previousMonth)}`}
              style={secondaryButtonStyle}
            >
              ← Mese precedente
            </Link>

            <strong
              style={{
                minWidth: "180px",
                textAlign: "center",
                fontSize: "18px",
                color: "#0f172a",
                textTransform: "capitalize",
              }}
            >
              {monthStart.toLocaleDateString("it-IT", {
                month: "long",
                year: "numeric",
              })}
            </strong>

            <Link
              href={`/calendar/month?month=${formatMonthParam(nextMonth)}`}
              style={secondaryButtonStyle}
            >
              Mese successivo →
            </Link>
          </div>
        </div>

        <section
          style={{
            overflowX: "auto",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "22px",
            padding: "18px",
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
          }}
        >
          <div
            style={{
              minWidth: "980px",
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(140px, 1fr))",
              gap: "1px",
              background: "#e2e8f0",
              border: "1px solid #e2e8f0",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map(
              (weekday) => (
                <div
                  key={weekday}
                  style={{
                    padding: "12px",
                    background: "#f8fafc",
                    color: "#64748b",
                    fontSize: "13px",
                    fontWeight: 900,
                    textAlign: "center",
                  }}
                >
                  {weekday}
                </div>
              )
            )}

            {calendarCells.map((day, index) => (
              <div
                key={`${day ?? "empty"}-${index}`}
                style={{
                  minHeight: "150px",
                  padding: "10px",
                  background: day ? "#ffffff" : "#f8fafc",
                }}
              >
                {day ? (
                  <>
                    <div
                      style={{
                        marginBottom: "9px",
                        color: "#0f172a",
                        fontSize: "14px",
                        fontWeight: 900,
                      }}
                    >
                      {day}
                    </div>

                    <div style={{ display: "grid", gap: "6px" }}>
                      {(eventsByDay[day] ?? []).map((event) => (
                        <Link
                          key={event.id}
                          href={event.href}
                          title={event.title}
                          style={{
                            display: "block",
                            padding: "7px 8px",
                            borderRadius: "9px",
                            background:
                              event.type === "CHECK_IN"
                                ? "#ecfdf5"
                                : event.type === "CHECK_OUT"
                                  ? "#fff1f2"
                                  : "#f1f5f9",
                            border:
                              event.type === "CHECK_IN"
                                ? "1px solid #bbf7d0"
                                : event.type === "CHECK_OUT"
                                  ? "1px solid #fecdd3"
                                  : "1px solid #cbd5e1",
                            color:
                              event.type === "CHECK_IN"
                                ? "#166534"
                                : event.type === "CHECK_OUT"
                                  ? "#be123c"
                                  : "#334155",
                            fontSize: "11px",
                            fontWeight: 800,
                            lineHeight: 1.25,
                            textDecoration: "none",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {event.type === "CHECK_IN"
                            ? "IN"
                            : event.type === "CHECK_OUT"
                              ? "OUT"
                              : "TASK"}{" "}
                          · {event.title}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </AppShell>
    </>
  );
}

function parseMonth(value?: string) {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-").map(Number);

    if (month >= 1 && month <= 12) {
      return new Date(year, month - 1, 1);
    }
  }

  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
}

function formatMonthParam(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function isInSelectedMonth(date: Date, year: number, monthIndex: number) {
  return date.getFullYear() === year && date.getMonth() === monthIndex;
}

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