import { sendEmail } from "./send-email";

export type OwnerInviteEmailStatus = "sent" | "not_configured" | "failed";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]!);
}

export async function sendOwnerInviteEmail(input: {
  email: string;
  fullName: string;
  invitePath: string;
}): Promise<OwnerInviteEmailStatus> {
  if (!process.env.RESEND_API_KEY || !process.env.HORIZON_EMAIL_FROM ||
      !process.env.NEXT_PUBLIC_APP_URL) return "not_configured";

  try {
    const base = new URL(process.env.NEXT_PUBLIC_APP_URL);
    if (base.protocol !== "https:" || base.username || base.password ||
        !/^\/invite\/owner\/[A-Za-z0-9_-]+$/.test(input.invitePath)) {
      return "not_configured";
    }
    const link = escapeHtml(new URL(input.invitePath, base.origin).href);
    await sendEmail({
      to: input.email,
      subject: "Horizon — attiva il tuo accesso proprietario",
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <h1>Il tuo accesso a Horizon</h1>
        <p>Ciao ${escapeHtml(input.fullName)},</p>
        <p>sei stato invitato al portale proprietari. Apri il collegamento e scegli la tua password.</p>
        <p><a href="${link}">Attiva il tuo accesso</a></p>
        <p>Il link è valido per 48 ore ed è utilizzabile una sola volta.</p>
      </div>`,
    });
    return "sent";
  } catch {
    // The invite remains usable; never expose provider errors or its token.
    return "failed";
  }
}
