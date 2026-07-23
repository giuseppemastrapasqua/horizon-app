import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Navigation } from "@/components/Navigation";
import { AppShell } from "@/components/AppShell";
import { createBooking } from "../actions";

type NewBookingPageProps = {
  searchParams?: Promise<{
    propertyId?: string;
  }>;
};

export default async function NewBookingPage({
  searchParams,
}: NewBookingPageProps) {
  const params = await searchParams;
  const selectedPropertyId = params?.propertyId;

  const properties = await prisma.property.findMany({
    orderBy: { name: "asc" },
    include: {
      owner: true,
    },
  });

  return (
    <>
      <Navigation />

      <AppShell
        title="Nuova prenotazione"
        subtitle="Registra una nuova prenotazione collegata a un immobile Horizon."
      >
        <div style={{ marginBottom: "24px" }}>
          <Link href="/bookings" style={ghostLinkStyle}>
            ← Torna alle prenotazioni
          </Link>
        </div>

        <div
          style={{
            maxWidth: "760px",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "24px",
            padding: "28px",
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
          }}
        >
          <form action={createBooking} style={{ display: "grid", gap: "18px" }}>
            <label style={labelStyle}>
              Immobile
              <select
                name="propertyId"
                defaultValue={selectedPropertyId ?? ""}
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

            <label style={labelStyle}>
              Canale
              <select name="channel" defaultValue="DIRECT" style={inputStyle}>
                <option value="DIRECT">Direct</option>
                <option value="AIRBNB">Airbnb</option>
                <option value="BOOKING">Booking</option>
              </select>
            </label>

            <label style={labelStyle}>
              Nome ospite
              <input
                name="guestName"
                required
                placeholder="Es. Laura Bianchi"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Email ospite
              <input
                name="guestEmail"
                type="email"
                placeholder="ospite@email.com"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Telefono ospite
              <input
                name="guestPhone"
                placeholder="+39 333 1234567"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Check-in
              <input name="checkIn" type="date" required style={inputStyle} />
            </label>

            <label style={labelStyle}>
              Check-out
              <input name="checkOut" type="date" required style={inputStyle} />
            </label>

            <label style={labelStyle}>
              Numero ospiti
              <input
                name="guests"
                type="number"
                min={1}
                defaultValue={2}
                required
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Importo lordo
              <input
                name="grossAmount"
                type="number"
                min={0}
                step="0.01"
                placeholder="1200"
                required
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Note interne
              <textarea
                name="internalNotes"
                rows={5}
                placeholder="Info utili, note operative, documenti mancanti..."
                style={{
                  ...inputStyle,
                  fontFamily: "Arial, sans-serif",
                  resize: "vertical",
                }}
              />
            </label>

            <button type="submit" style={primaryButtonStyle}>
              Crea prenotazione
            </button>
          </form>
        </div>
      </AppShell>
    </>
  );
}

const labelStyle = {
  display: "grid",
  gap: "8px",
  fontWeight: 700,
  color: "#0f172a",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "14px",
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#0f172a",
  fontSize: "15px",
};

const primaryButtonStyle = {
  padding: "12px 16px",
  borderRadius: "12px",
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: "15px",
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