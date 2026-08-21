import { Resend } from "resend";

const apiKey =
  process.env.RESEND_API_KEY;

const fromAddress =
  process.env.HORIZON_EMAIL_FROM;

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY non configurata.",
    );
  }

  if (!fromAddress) {
    throw new Error(
      "HORIZON_EMAIL_FROM non configurata.",
    );
  }

  const resend =
    new Resend(apiKey);

  const {
    data,
    error,
  } =
    await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      html,
    });

  if (error) {
    throw new Error(
      `Invio email fallito: ${error.message}`,
    );
  }

  return data;
}
