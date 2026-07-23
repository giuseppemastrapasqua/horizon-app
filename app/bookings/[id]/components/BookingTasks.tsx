import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ActionButton } from "@/components/ui/ActionButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { uiTokens } from "@/components/ui/tokens";
import { formatDateTime } from "@/lib/format/date";

export type BookingTaskItem = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  dueDate: Date | null;
  updatedAt: Date;
};

type BookingTasksProps = {
  bookingId: string;
  propertyId: string;
  tasks: BookingTaskItem[];
};

export function BookingTasks({
  bookingId,
  propertyId,
  tasks,
}: BookingTasksProps) {
  return (
    <Panel>
      <SectionTitle
        title="Task prenotazione"
        subtitle="Attività operative generate e collegate al soggiorno."
        action={
          <ActionButton
            label="Nuovo task"
            href={`/tasks/new?propertyId=${propertyId}&bookingId=${bookingId}`}
            compact
          />
        }
      />

      {tasks.length === 0 ? (
        <EmptyState
          title="Nessun task collegato"
          description="Le attività operative create da IMPERIUM compariranno qui."
          actionLabel="Crea task"
          actionHref={`/tasks/new?propertyId=${propertyId}&bookingId=${bookingId}`}
        />
      ) : (
        <div style={listStyle}>
          {tasks.map((task) => (
            <article key={task.id} style={taskCardStyle}>
              <div style={headerStyle}>
                <div>
                  <strong style={titleStyle}>{task.title}</strong>

                  <p style={descriptionStyle}>
                    {task.description ?? "Nessuna descrizione"}
                  </p>
                </div>

                <div style={badgesStyle}>
                  <StatusBadge
                    label={task.type}
                    tone="blue"
                    compact
                  />

                  <StatusBadge
                    label={task.status}
                    compact
                  />
                </div>
              </div>

              <div style={footerStyle}>
                <div style={dateBlockStyle}>
                  <span style={dateLabelStyle}>SCADENZA</span>

                  <strong style={dateValueStyle}>
                    {task.dueDate
                      ? formatDateTime(task.dueDate)
                      : "Non definita"}
                  </strong>
                </div>

                <ActionButton
                  label="Apri task"
                  href={`/tasks/${task.id}`}
                  variant="secondary"
                  compact
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}

const listStyle = {
  display: "grid",
  gap: uiTokens.spacing.md,
};

const taskCardStyle = {
  padding: uiTokens.spacing.md,
  borderRadius: uiTokens.radius.lg,
  background: uiTokens.colors.surfaceSoft,
  border: `1px solid ${uiTokens.colors.border}`,
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: uiTokens.spacing.md,
  flexWrap: "wrap" as const,
};

const titleStyle = {
  color: uiTokens.colors.textPrimary,
  fontSize: "16px",
  fontWeight: uiTokens.fontWeight.strong,
};

const descriptionStyle = {
  margin: `${uiTokens.spacing.xs} 0 0`,
  color: uiTokens.colors.textMuted,
  fontSize: uiTokens.fontSize.sm,
  lineHeight: 1.45,
};

const badgesStyle = {
  display: "flex",
  gap: uiTokens.spacing.sm,
  flexWrap: "wrap" as const,
};

const footerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: uiTokens.spacing.md,
  marginTop: uiTokens.spacing.md,
  paddingTop: uiTokens.spacing.md,
  borderTop: `1px solid ${uiTokens.colors.border}`,
  flexWrap: "wrap" as const,
};

const dateBlockStyle = {
  display: "grid",
  gap: "4px",
};

const dateLabelStyle = {
  color: uiTokens.colors.textSubtle,
  fontSize: "9px",
  fontWeight: uiTokens.fontWeight.strong,
};

const dateValueStyle = {
  color: uiTokens.colors.textPrimary,
  fontSize: uiTokens.fontSize.sm,
};