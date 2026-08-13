import { ActionButton } from "@/components/ui/ActionButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/format/date";

export type PriorityTaskItem = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  dueDate: Date | null;
  property: {
    id: string;
    name: string;
  };
  booking: {
    id: string;
    guestName: string;
  } | null;
  isOverdue: boolean;
};

type PriorityTasksPanelProps = {
  tasks: PriorityTaskItem[];
};

export function PriorityTasksPanel({
  tasks,
}: PriorityTasksPanelProps) {
  return (
    <Panel>
      <SectionTitle
        title="Task prioritari"
        subtitle="Attività ordinate per urgenza e scadenza."
        action={
          <ActionButton
            label="Tutti i task"
            href="/tasks"
            variant="secondary"
            compact
          />
        }
      />

      {tasks.length === 0 ? (
        <EmptyState
          title="Nessun task prioritario"
          description="Non risultano attività operative aperte."
        />
      ) : (
        <div className="grid gap-3">
          {tasks.map((task) => (
            <article
              key={task.id}
              className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="min-w-0">
                <strong className="block text-base font-semibold text-slate-950">
                  {task.title}
                </strong>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {task.property.name}
                  {task.booking ? ` · ${task.booking.guestName}` : ""}
                </p>

                <span className="mt-2 inline-block text-xs text-slate-400">
                  {task.dueDate
                    ? formatDateTime(task.dueDate)
                    : "Scadenza non definita"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  label={task.type}
                  tone="blue"
                  compact
                />

                <StatusBadge
                  label={task.isOverdue ? "SCADUTO" : task.status}
                  tone={task.isOverdue ? "red" : "yellow"}
                  compact
                />

                <ActionButton
                  label="Apri"
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