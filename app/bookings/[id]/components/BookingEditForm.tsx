import { updateBookingDetails } from "@/app/bookings/actions";
import { uiTokens } from "@/components/ui/tokens";

type BookingEditFormProps = {
  booking: {
    id: string;
    guestName: string;
    guestEmail: string | null;
    guestPhone: string | null;
    guests: number;
    grossAmount: number;
    currency: string;
  };
};

export function BookingEditForm({
  booking,
}: BookingEditFormProps) {
  return (
    <details style={panelStyle}>
      <summary style={summaryStyle}>
        Modifica prenotazione
      </summary>

      <form
        action={updateBookingDetails}
        style={formStyle}
      >
        <input
          type="hidden"
          name="bookingId"
          value={booking.id}
        />

        <div style={gridStyle}>
          <Field label="Nome ospite">
            <input
              name="guestName"
              defaultValue={booking.guestName}
              required
              style={inputStyle}
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              name="guestEmail"
              defaultValue={booking.guestEmail ?? ""}
              style={inputStyle}
            />
          </Field>

          <Field label="Telefono">
            <input
              name="guestPhone"
              defaultValue={booking.guestPhone ?? ""}
              style={inputStyle}
            />
          </Field>

          <Field label="Ospiti">
            <input
              type="number"
              name="guests"
              min={1}
              step={1}
              defaultValue={booking.guests}
              required
              style={inputStyle}
            />
          </Field>

          <Field label="Importo prenotazione">
            <input
              type="number"
              name="grossAmount"
              min={0}
              step="0.01"
              defaultValue={booking.grossAmount}
              required
              style={inputStyle}
            />
          </Field>

          <Field label="Valuta">
            <input
              name="currency"
              defaultValue={booking.currency}
              maxLength={3}
              required
              style={inputStyle}
            />
          </Field>
        </div>

        <p style={noteStyle}>
          Date, canale e codice Booking restano gestiti
          dalla sincronizzazione.
        </p>

        <button
          type="submit"
          style={buttonStyle}
        >
          Salva modifiche
        </button>
      </form>
    </details>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

const panelStyle = {
  marginBottom: uiTokens.spacing.lg,
  padding: uiTokens.spacing.lg,
  border: `1px solid ${uiTokens.colors.border}`,
  borderRadius: uiTokens.radius.xl,
  background: uiTokens.colors.primary,
  boxShadow: uiTokens.shadow.panel,
};

const summaryStyle = {
  cursor: "pointer",
  color: uiTokens.colors.primaryText,
  fontWeight: uiTokens.fontWeight.strong,
};

const formStyle = {
  display: "grid",
  gap: uiTokens.spacing.md,
  marginTop: uiTokens.spacing.lg,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(190px, 1fr))",
  gap: uiTokens.spacing.md,
};

const fieldStyle = {
  display: "grid",
  gap: uiTokens.spacing.xs,
};

const labelStyle = {
  color: "#94a3b8",
  fontSize: uiTokens.fontSize.xs,
  fontWeight: uiTokens.fontWeight.strong,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "10px 12px",
  border: `1px solid ${uiTokens.colors.border}`,
  borderRadius: uiTokens.radius.md,
  background: "#ffffff",
  color: uiTokens.colors.primaryText,
  font: "inherit",
};

const noteStyle = {
  margin: 0,
  color: "#94a3b8",
  fontSize: uiTokens.fontSize.xs,
};

const buttonStyle = {
  justifySelf: "start",
  padding: "10px 16px",
  border: 0,
  borderRadius: uiTokens.radius.md,
  background: uiTokens.colors.primary,
  color: uiTokens.colors.primaryText,
  fontWeight: uiTokens.fontWeight.strong,
  cursor: "pointer",
};