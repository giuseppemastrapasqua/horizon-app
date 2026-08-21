import type {
  SystemEvent,
} from "@prisma/client";

import {
  prisma,
} from "@/lib/prisma";

import {
  sendEmail,
} from "@/lib/notifications/email/send-email";

export async function handleTaskCreated(
  event: SystemEvent,
): Promise<void> {
  const payload =
    event.payload as {
      taskId?: string;
    };

  const taskId =
    payload.taskId ??
    event.aggregateId;

  if (!taskId) {
    throw new Error(
      "TASK_CREATED senza taskId.",
    );
  }

  const task =
    await prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        owner: true,
        property: true,
        booking: true,
      },
    });

  if (!task) {
    throw new Error(
      `Task ${taskId} non trovato.`,
    );
  }

  if (!task.owner) {
    throw new Error(
      `Task ${task.id} senza assegnatario.`,
    );
  }

  if (!task.owner.email) {
    throw new Error(
      `Assegnatario ${task.owner.id} senza email.`,
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  const taskUrl =
    `${baseUrl}/tasks/${task.id}`;

  const dueDate =
    task.dueDate
      ? new Intl.DateTimeFormat(
          "it-IT",
          {
            dateStyle: "long",
            timeStyle: "short",
          },
        ).format(task.dueDate)
      : "Nessuna scadenza";

  const bookingLabel =
    task.booking
      ? `${task.booking.guestName} · ${new Intl.DateTimeFormat(
          "it-IT",
          {
            dateStyle: "medium",
          },
        ).format(task.booking.checkIn)}`
      : "Nessuna prenotazione collegata";

  await sendEmail({
    to: task.owner.email,
    subject:
      `Horizon · Nuovo task · ${task.title}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#0f172a">
        <div style="padding:24px 0;border-bottom:1px solid #e2e8f0">
          <div style="font-size:22px;font-weight:800;color:#2563eb">
            Horizon
          </div>
          <div style="margin-top:4px;font-size:12px;color:#64748b">
            Nuovo task assegnato
          </div>
        </div>

        <div style="padding:28px 0">
          <p style="margin:0 0 8px;font-size:12px;color:#64748b">
            Ciao ${task.owner.fullName},
          </p>

          <h1 style="margin:0;font-size:24px;line-height:1.25">
            ${task.title}
          </h1>

          ${
            task.description
              ? `<p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#475569">${task.description}</p>`
              : ""
          }

          <div style="margin-top:24px;padding:18px;border:1px solid #e2e8f0;border-radius:14px;background:#f8fafc">
            <p style="margin:0 0 8px;font-size:13px">
              <strong>Struttura:</strong>
              ${task.property.name}
            </p>

            <p style="margin:0 0 8px;font-size:13px">
              <strong>Tipo:</strong>
              ${task.type}
            </p>

            <p style="margin:0 0 8px;font-size:13px">
              <strong>Scadenza:</strong>
              ${dueDate}
            </p>

            <p style="margin:0;font-size:13px">
              <strong>Prenotazione:</strong>
              ${bookingLabel}
            </p>
          </div>

          <a
            href="${taskUrl}"
            style="display:inline-block;margin-top:24px;padding:12px 18px;border-radius:10px;background:#2563eb;color:#fff;text-decoration:none;font-size:14px;font-weight:700"
          >
            Apri task
          </a>
        </div>

        <div style="padding:18px 0;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8">
          Horizon Property Management OS
        </div>
      </div>
    `,
  });
}
