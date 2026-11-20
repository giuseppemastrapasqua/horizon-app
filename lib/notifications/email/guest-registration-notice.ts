import { sendEmail } from "./send-email";

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export async function notifyGuestRegistration(input: {
  bookingId: string;
  propertyName: string;
  address: string;
  checkIn: Date;
  checkOut: Date;
  guestCount: number;
}) {
  const to = process.env.HORIZON_GUEST_REGISTRATION_INTERNAL_EMAIL?.trim();
  if (!to) return;
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (!base) throw new Error("Missing Horizon base URL");
  const url = new URL("/bookings/" + encodeURIComponent(input.bookingId), base);
  if (url.protocol !== "https:") throw new Error("Horizon email links require HTTPS");
  const format = new Intl.DateTimeFormat("it-IT", {
    day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC",
  });
  await sendEmail({
    to,
    subject: "Schedine ospiti ricevute – " + input.propertyName.replace(/[\r\n]/g, " "),
    html: `<h2>Schedine ospiti ricevute</h2>
      <p><strong>Alloggio:</strong> ${escapeHtml(input.propertyName)}<br>
      <strong>Indirizzo:</strong> ${escapeHtml(input.address)}<br>
      <strong>Check-in:</strong> ${format.format(input.checkIn)}<br>
      <strong>Check-out:</strong> ${format.format(input.checkOut)}<br>
      <strong>Ospiti:</strong> ${input.guestCount}</p>
      <p><a href="${escapeHtml(url.href)}">Apri le schedine in Horizon</a> per riportare i dati su Alloggiati Web.</p>`,
  });
}
