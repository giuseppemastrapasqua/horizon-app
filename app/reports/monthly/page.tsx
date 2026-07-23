import { notFound } from "next/navigation";
import { BookingOperationalStatus, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DocumentLayout } from "@/components/documents/DocumentLayout";
import { DocumentSection } from "@/components/documents/DocumentSection";
import { DocumentMetric } from "@/components/documents/DocumentMetric";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { EditableField } from "@/components/documents/EditableField";

type MonthlyReportPageProps = {
  searchParams?: Promise<{
    ownerId?: string;
    month?: string;
  }>;
};

export default async function MonthlyReportPage({
  searchParams,
}: MonthlyReportPageProps) {
  const params = await searchParams;

  const ownerId = params?.ownerId;
  const selectedMonth = parseMonth(params?.month);

  if (!ownerId) {
    notFound();
  }

  const year = selectedMonth.getFullYear();
  const monthIndex = selectedMonth.getMonth();

  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 1);

  const previousMonthStart = new Date(year, monthIndex - 1, 1);
  const previousMonthEnd = monthStart;

  const owner = await prisma.user.findUnique({
    where: {
      id: ownerId,
    },
    include: {
      properties: {
        orderBy: {
          name: "asc",
        },
        include: {
          bookings: {
            where: {
              checkIn: {
                gte: monthStart,
                lt: monthEnd,
              },
            },
            orderBy: {
              checkIn: "asc",
            },
          },
          tasks: {
            where: {
              createdAt: {
                gte: monthStart,
                lt: monthEnd,
              },
            },
          },
        },
      },
      bookings: {
        where: {
          checkIn: {
            gte: monthStart,
            lt: monthEnd,
          },
        },
        orderBy: {
          checkIn: "asc",
        },
        include: {
          property: true,
        },
      },
      tasks: {
        where: {
          createdAt: {
            gte: monthStart,
            lt: monthEnd,
          },
        },
        include: {
          property: true,
        },
      },
    },
  });

  if (!owner) {
    notFound();
  }

  const previousMonthBookings = await prisma.booking.findMany({
    where: {
      ownerId: owner.id,
      checkIn: {
        gte: previousMonthStart,
        lt: previousMonthEnd,
      },
    },
  });

  const totalRevenue = owner.bookings.reduce(
    (sum, booking) => sum + Number(booking.grossAmount),
    0
  );

  const previousMonthRevenue = previousMonthBookings.reduce(
    (sum, booking) => sum + Number(booking.grossAmount),
    0
  );

  const revenueVariation =
    previousMonthRevenue > 0
      ? ((totalRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
      : null;

  const totalNights = owner.bookings.reduce(
    (sum, booking) => sum + booking.nights,
    0
  );

  const totalGuests = owner.bookings.reduce(
    (sum, booking) => sum + booking.guests,
    0
  );

  const averageBookingValue =
    owner.bookings.length > 0
      ? totalRevenue / owner.bookings.length
      : 0;

  const openTasks = owner.tasks.filter(
    (task) =>
      task.status !== TaskStatus.DONE &&
      task.status !== TaskStatus.CANCELLED
  );

  const completedTasks = owner.tasks.filter(
    (task) => task.status === TaskStatus.DONE
  );

  const operationalAlerts = owner.bookings.filter(
    (booking) =>
      booking.operationalStatus !== BookingOperationalStatus.OK
  );

  const propertyRows = owner.properties.map((property) => {
    const revenue = property.bookings.reduce(
      (sum, booking) => sum + Number(booking.grossAmount),
      0
    );

    const nights = property.bookings.reduce(
      (sum, booking) => sum + booking.nights,
      0
    );

    const averageNightlyRate =
      nights > 0 ? revenue / nights : 0;

    return {
      property: property.name,
      bookings: property.bookings.length,
      nights,
      revenue: `${revenue.toFixed(2)} €`,
      averageNightlyRate: `${averageNightlyRate.toFixed(2)} €`,
      score: property.currentScore,
    };
  });

  const bookingRows = owner.bookings.map((booking) => ({
    guest: booking.guestName,
    property: booking.property.name,
    dates: `${booking.checkIn.toLocaleDateString(
      "it-IT"
    )} → ${booking.checkOut.toLocaleDateString("it-IT")}`,
    channel: booking.channel,
    nights: booking.nights,
    amount: `${Number(booking.grossAmount).toFixed(2)} €`,
    status: booking.operationalStatus,
  }));

  const taskRows = owner.tasks.map((task) => ({
    task: task.title,
    property: task.property.name,
    type: task.type,
    status: task.status,
    dueDate: task.dueDate
      ? task.dueDate.toLocaleString("it-IT")
      : "Non impostata",
  }));

  const monthLabel = monthStart.toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });

  return (
    <DocumentLayout
      title="Report mensile owner"
      subtitle={`${owner.fullName} · ${monthLabel}`}
      documentNumber={`RPT-${year}-${String(monthIndex + 1).padStart(
        2,
        "0"
      )}-${owner.id.slice(-6).toUpperCase()}`}
      status="BOZZA"
      backHref={`/owners/${owner.id}`}
      backLabel="← Torna alla dashboard owner"
    >
      <DocumentSection
        title="Dati del report"
        subtitle="Informazioni generali e periodo di riferimento."
      >
        <div style={twoColumnGridStyle}>
          <EditableField
            name="reportTitle"
            label="Titolo personalizzato"
            defaultValue={`Report mensile ${monthLabel}`}
          />

          <EditableField
            name="reference"
            label="Riferimento"
            defaultValue={owner.fullName}
          />
        </div>

        <div style={{ ...twoColumnGridStyle, marginTop: "16px" }}>
          <EditableField
            name="period"
            label="Periodo"
            defaultValue={monthLabel}
          />

          <EditableField
            name="preparedBy"
            label="Preparato da"
            placeholder="Nome del property manager"
          />
        </div>
      </DocumentSection>

      <DocumentSection
        title="Riepilogo del mese"
        subtitle="Principali indicatori economici e operativi."
      >
        <div style={metricsGridStyle}>
          <DocumentMetric
            label="Ricavi lordi"
            value={`${totalRevenue.toFixed(2)} €`}
          />

          <DocumentMetric
            label="Prenotazioni"
            value={owner.bookings.length}
          />

          <DocumentMetric
            label="Notti vendute"
            value={totalNights}
          />

          <DocumentMetric
            label="Ospiti"
            value={totalGuests}
          />

          <DocumentMetric
            label="Valore medio booking"
            value={`${averageBookingValue.toFixed(2)} €`}
          />

          <DocumentMetric
            label="Task completati"
            value={completedTasks.length}
            tone="green"
          />

          <DocumentMetric
            label="Task aperti"
            value={openTasks.length}
            tone={openTasks.length > 0 ? "red" : "default"}
          />

          <DocumentMetric
            label="Criticità operative"
            value={operationalAlerts.length}
            tone={operationalAlerts.length > 0 ? "red" : "green"}
          />
        </div>
      </DocumentSection>

      <DocumentSection
        title="Confronto con il mese precedente"
        subtitle="Variazione dei ricavi rispetto al periodo precedente."
      >
        <div style={metricsGridStyle}>
          <DocumentMetric
            label="Ricavi mese corrente"
            value={`${totalRevenue.toFixed(2)} €`}
          />

          <DocumentMetric
            label="Ricavi mese precedente"
            value={`${previousMonthRevenue.toFixed(2)} €`}
          />

          <DocumentMetric
            label="Variazione"
            value={
              revenueVariation === null
                ? "N/D"
                : `${revenueVariation.toFixed(1)}%`
            }
            tone={
              revenueVariation === null
                ? "default"
                : revenueVariation >= 0
                  ? "green"
                  : "red"
            }
          />
        </div>
      </DocumentSection>

      <DocumentSection
        title="Performance per immobile"
        subtitle="Ricavi, prenotazioni, notti, tariffa media e Horizon Score."
      >
        <DocumentTable
          columns={[
            { key: "property", title: "Immobile", width: "28%" },
            { key: "bookings", title: "Booking" },
            { key: "nights", title: "Notti" },
            { key: "revenue", title: "Ricavi" },
            {
              key: "averageNightlyRate",
              title: "Tariffa media",
            },
            { key: "score", title: "Score" },
          ]}
          rows={propertyRows}
        />
      </DocumentSection>

      <DocumentSection
        title="Dettaglio prenotazioni"
        subtitle="Soggiorni con check-in nel mese selezionato."
      >
        {bookingRows.length === 0 ? (
          <p style={emptyTextStyle}>
            Nessuna prenotazione nel periodo selezionato.
          </p>
        ) : (
          <DocumentTable
            columns={[
              { key: "guest", title: "Ospite", width: "18%" },
              { key: "property", title: "Immobile", width: "20%" },
              { key: "dates", title: "Date", width: "20%" },
              { key: "channel", title: "Canale" },
              { key: "nights", title: "Notti" },
              { key: "amount", title: "Importo" },
              { key: "status", title: "Stato operativo" },
            ]}
            rows={bookingRows}
          />
        )}
      </DocumentSection>

      <DocumentSection
        title="Attività operative"
        subtitle="Task creati nel mese e relativo stato."
      >
        {taskRows.length === 0 ? (
          <p style={emptyTextStyle}>
            Nessun task registrato nel periodo selezionato.
          </p>
        ) : (
          <DocumentTable
            columns={[
              { key: "task", title: "Task", width: "28%" },
              { key: "property", title: "Immobile", width: "22%" },
              { key: "type", title: "Tipo" },
              { key: "status", title: "Stato" },
              { key: "dueDate", title: "Scadenza", width: "20%" },
            ]}
            rows={taskRows}
          />
        )}
      </DocumentSection>

      <DocumentSection
        title="Osservazioni del property manager"
        subtitle="Questi campi sono modificabili prima della stampa."
      >
        <div style={{ display: "grid", gap: "16px" }}>
          <EditableField
            name="executiveSummary"
            label="Sintesi del mese"
            multiline
            rows={5}
            placeholder="Inserisci una sintesi delle performance del mese..."
          />

          <EditableField
            name="criticalIssues"
            label="Criticità e azioni correttive"
            multiline
            rows={5}
            placeholder="Descrivi eventuali problemi, interventi o azioni da intraprendere..."
          />

          <EditableField
            name="recommendations"
            label="Raccomandazioni per il mese successivo"
            multiline
            rows={5}
            placeholder="Inserisci suggerimenti commerciali, operativi o manutentivi..."
          />

          <EditableField
            name="ownerNotes"
            label="Note per il proprietario"
            multiline
            rows={5}
            placeholder="Inserisci eventuali comunicazioni aggiuntive..."
          />
        </div>
      </DocumentSection>

      <DocumentSection title="Firme e approvazione">
        <div style={twoColumnGridStyle}>
          <EditableField
            name="managerSignature"
            label="Property manager"
            placeholder="Nome e cognome"
          />

          <EditableField
            name="ownerSignature"
            label="Proprietario"
            placeholder="Nome e cognome"
          />
        </div>
      </DocumentSection>
    </DocumentLayout>
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

const metricsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(140px, 1fr))",
  gap: "12px",
};

const twoColumnGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(220px, 1fr))",
  gap: "16px",
};

const emptyTextStyle = {
  margin: 0,
  color: "#64748b",
  fontSize: "14px",
};