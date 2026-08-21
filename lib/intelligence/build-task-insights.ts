import type {
  IntelligenceInsight,
} from "./intelligence-types";

export type TaskIntelligenceInput = {
  id: string;

  title: string;

  type:
    | "CLEANING"
    | "MAINTENANCE"
    | "GUEST_DOCUMENTS"
    | "CHECK_IN"
    | "CHECK_OUT"
    | "ADMIN"
    | "ISSUE";

  status:
    | "TODO"
    | "IN_PROGRESS"
    | "DONE"
    | "CANCELLED";

  dueDate:
    Date | null;

  ownerId:
    string | null;

  propertyId:
    string;

  propertyName:
    string;
};

export function buildTaskInsights({
  tasks,
  now = new Date(),
}: {
  tasks: TaskIntelligenceInput[];
  now?: Date;
}): IntelligenceInsight[] {
  const insights:
    IntelligenceInsight[] = [];

  const startToday =
    startOfDay(now);

  const endToday =
    endOfDay(now);

  for (const task of tasks) {
    /*
     * Task completati o annullati
     * non devono produrre intelligence.
     */
    if (
      task.status === "DONE" ||
      task.status === "CANCELLED"
    ) {
      continue;
    }

    const overdue =
      task.dueDate !== null &&
      task.dueDate < startToday;

    const dueToday =
      task.dueDate !== null &&
      task.dueDate >= startToday &&
      task.dueDate <= endToday;

    const operational =
      task.type === "CHECK_IN" ||
      task.type === "CHECK_OUT";

    /*
     * 1. TASK SCADUTO
     */
    if (overdue) {
      insights.push({
        id:
          `task-overdue:${task.id}`,

        propertyId:
          task.propertyId,

        propertyName:
          task.propertyName,

        category:
          "OPERATIONS",

        severity:
          operational
            ? "CRITICAL"
            : "WARNING",

        title:
          operational
            ? `${taskLabel(task.type)} scaduto`
            : "Task scaduto",

        explanation:
          [
            `"${task.title}" non risulta completato.`,
            task.dueDate
              ? `Scadenza: ${formatDate(task.dueDate)}.`
              : null,
            operational
              ? "L'attività riguarda direttamente il soggiorno dell'ospite."
              : null,
          ]
            .filter(Boolean)
            .join(" "),

        date:
          task.dueDate
            ? dateKey(task.dueDate)
            : undefined,

        action: {
          type:
            "REVIEW_TASK",

          label:
            "Apri task",

          propertyId:
            task.propertyId,

          href:
            `/tasks/${task.id}`,

          requiresApproval:
            false,
        },

        metadata: {
          taskId:
            task.id,

          taskType:
            task.type,

          taskStatus:
            task.status,

          assigned:
            task.ownerId !== null,
        },
      });

      continue;
    }

    /*
     * 2. TASK DA ESEGUIRE OGGI
     */
    if (dueToday) {
      insights.push({
        id:
          `task-today:${task.id}`,

        propertyId:
          task.propertyId,

        propertyName:
          task.propertyName,

        category:
          "OPERATIONS",

        severity:
          operational
            ? "WARNING"
            : "INFO",

        title:
          operational
            ? `${taskLabel(task.type)} previsto oggi`
            : "Attività prevista oggi",

        explanation:
          [
            `"${task.title}" è previsto per oggi.`,
            task.ownerId === null
              ? "Il task non risulta assegnato."
              : null,
          ]
            .filter(Boolean)
            .join(" "),

        date:
          task.dueDate
            ? dateKey(task.dueDate)
            : undefined,

        action: {
          type:
            "REVIEW_TASK",

          label:
            "Controlla task",

          propertyId:
            task.propertyId,

          href:
            `/tasks/${task.id}`,

          requiresApproval:
            false,
        },

        metadata: {
          taskId:
            task.id,

          taskType:
            task.type,

          taskStatus:
            task.status,

          assigned:
            task.ownerId !== null,
        },
      });

      continue;
    }

    /*
     * 3. TASK NON ASSEGNATO
     *
     * Evitiamo di segnalare ogni task:
     * interessa soltanto se ha una
     * scadenza futura.
     */
    if (
      task.ownerId === null &&
      task.dueDate !== null
    ) {
      insights.push({
        id:
          `task-unassigned:${task.id}`,

        propertyId:
          task.propertyId,

        propertyName:
          task.propertyName,

        category:
          "OPERATIONS",

        severity:
          operational
            ? "WARNING"
            : "INFO",

        title:
          "Task senza assegnatario",

        explanation:
          `"${task.title}" ha una scadenza prevista ma non risulta ancora assegnato.`,

        date:
          dateKey(
            task.dueDate,
          ),

        action: {
          type:
            "REVIEW_TASK",

          label:
            "Assegna task",

          propertyId:
            task.propertyId,

          href:
            `/tasks/${task.id}`,

          requiresApproval:
            false,
        },

        metadata: {
          taskId:
            task.id,

          taskType:
            task.type,

          taskStatus:
            task.status,

          assigned:
            false,
        },
      });
    }
  }

  return insights
    .sort(
      (left, right) =>
        severityWeight(
          right.severity,
        ) -
        severityWeight(
          left.severity,
        ),
    )
    .slice(
      0,
      8,
    );
}

function taskLabel(
  type:
    TaskIntelligenceInput["type"],
) {
  switch (type) {
    case "CHECK_IN":
      return "Check-in";

    case "CHECK_OUT":
      return "Check-out";

    case "CLEANING":
      return "Pulizia";

    case "MAINTENANCE":
      return "Manutenzione";

    case "GUEST_DOCUMENTS":
      return "Documenti ospite";

    case "ISSUE":
      return "Segnalazione";

    case "ADMIN":
    default:
      return "Attività";
  }
}

function severityWeight(
  severity:
    IntelligenceInsight["severity"],
) {
  switch (severity) {
    case "CRITICAL":
      return 4;

    case "WARNING":
      return 3;

    case "OPPORTUNITY":
      return 2;

    case "INFO":
    default:
      return 1;
  }
}

function startOfDay(
  date: Date,
) {
  const result =
    new Date(date);

  result.setHours(
    0,
    0,
    0,
    0,
  );

  return result;
}

function endOfDay(
  date: Date,
) {
  const result =
    new Date(date);

  result.setHours(
    23,
    59,
    59,
    999,
  );

  return result;
}

function dateKey(
  date: Date,
) {
  return date
    .toISOString()
    .slice(0, 10);
}

function formatDate(
  date: Date,
) {
  return new Intl.DateTimeFormat(
    "it-IT",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}
