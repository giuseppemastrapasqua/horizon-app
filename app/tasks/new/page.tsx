import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Navigation } from "@/components/Navigation";
import { AppShell } from "@/components/AppShell";
import { createTask } from "../actions-create";

type NewTaskPageProps = {
  searchParams?: Promise<{
    propertyId?: string;
    bookingId?: string;
  }>;
};

export default async function NewTaskPage({
  searchParams,
}: NewTaskPageProps) {
  const params = await searchParams;

  const selectedPropertyId = params?.propertyId ?? "";
  const selectedBookingId = params?.bookingId ?? "";

  const properties = await prisma.property.findMany({
    orderBy: {
      name: "asc",
    },
    include: {
      owner: true,
      bookings: {
        orderBy: {
          checkIn: "asc",
        },
      },
    },
  });

  const selectedProperty =
    properties.find((property) => property.id === selectedPropertyId) ?? null;

  const compatibleBookings = selectedProperty?.bookings ?? [];

  const selectedBooking =
    compatibleBookings.find((booking) => booking.id === selectedBookingId) ??
    null;

  const backHref = selectedBooking
    ? `/bookings/${selectedBooking.id}`
    : selectedProperty
      ? `/properties/${selectedProperty.id}`
      : "/tasks";

  const backLabel = selectedBooking
    ? "← Torna alla prenotazione"
    : selectedProperty
      ? "← Torna all’immobile"
      : "← Torna ai task";

  return (
    <>
      <Navigation />

      <AppShell
        title="Nuovo task"
        subtitle="Crea un’attività operativa collegata a un immobile o a una prenotazione."
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "16px",
            alignItems: "center",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          <Link href={backHref} style={ghostLinkStyle}>
            {backLabel}
          </Link>

          {selectedProperty && (
            <div style={contextBadgeStyle}>
              Contesto: <strong>{selectedProperty.name}</strong>
              {selectedBooking ? ` · ${selectedBooking.guestName}` : ""}
            </div>
          )}
        </div>

        <div style={formCardStyle}>
          <form action={createTask} style={{ display: "grid", gap: "18px" }}>
            <label style={labelStyle}>
              Immobile

              <select
                name="propertyId"
                defaultValue={selectedPropertyId}
                required
                style={inputStyle}
              >
                <option value="">Seleziona immobile</option>

                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </label>

            <input
              type="hidden"
              name="ownerId"
              value={selectedProperty?.ownerId ?? ""}
            />

            <label style={labelStyle}>
              Prenotazione collegata

              <select
                name="bookingId"
                defaultValue={selectedBookingId}
                style={inputStyle}
                disabled={!selectedProperty}
              >
                <option value="">
                  {selectedProperty
                    ? "Nessuna prenotazione collegata"
                    : "Seleziona prima un immobile"}
                </option>

                {compatibleBookings.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    {booking.guestName} ·{" "}
                    {new Date(booking.checkIn).toLocaleDateString("it-IT")} →{" "}
                    {new Date(booking.checkOut).toLocaleDateString("it-IT")}
                  </option>
                ))}
              </select>
            </label>

            {!selectedProperty && (
              <div style={helperBoxStyle}>
                Per vedere le prenotazioni compatibili, apri il form dal
                dettaglio di un immobile o di una prenotazione.
              </div>
            )}

            <label style={labelStyle}>
              Titolo task

              <input
                name="title"
                required
                placeholder="Es. Controllo documenti ospite"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Tipo task

              <select name="type" defaultValue="ADMIN" style={inputStyle}>
                <option value="CLEANING">Cleaning</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="GUEST_DOCUMENTS">Guest documents</option>
                <option value="CHECK_IN">Check-in</option>
                <option value="CHECK_OUT">Check-out</option>
                <option value="ADMIN">Admin</option>
                <option value="ISSUE">Issue</option>
              </select>
            </label>

            <label style={labelStyle}>
              Scadenza

              <input
                name="dueDate"
                type="datetime-local"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Descrizione

              <textarea
                name="description"
                rows={5}
                placeholder="Dettagli operativi, istruzioni e note utili."
                style={{
                  ...inputStyle,
                  fontFamily: "Arial, sans-serif",
                  resize: "vertical",
                }}
              />
            </label>

            <button type="submit" style={primaryButtonStyle}>
              Crea task
            </button>
          </form>
        </div>
      </AppShell>
    </>
  );
}

const formCardStyle = {
  maxWidth: "760px",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "24px",
  padding: "28px",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
};

const labelStyle = {
  display: "grid",
  gap: "8px",
  color: "#0f172a",
  fontWeight: 700,
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "14px",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  fontSize: "15px",
};

const primaryButtonStyle = {
  padding: "12px 16px",
  borderRadius: "12px",
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: "15px",
};

const ghostLinkStyle = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: "12px",
  background: "#ffffff",
  color: "#334155",
  border: "1px solid #e2e8f0",
  textDecoration: "none",
  fontWeight: 700,
};

const contextBadgeStyle = {
  padding: "10px 13px",
  borderRadius: "12px",
  background: "#f8fafc",
  color: "#475569",
  border: "1px solid #e2e8f0",
  fontSize: "13px",
};

const helperBoxStyle = {
  padding: "14px 16px",
  borderRadius: "14px",
  background: "#fffbeb",
  color: "#854d0e",
  border: "1px solid #fde68a",
  fontSize: "14px",
};