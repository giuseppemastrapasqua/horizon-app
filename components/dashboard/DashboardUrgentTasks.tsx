import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { DashboardTaskRow } from "@/components/dashboard/DashboardTaskRow";
import type { DashboardUrgentTask } from "@/lib/dashboard/types";

type DashboardUrgentTasksProps = {
  urgentTasks: DashboardUrgentTask[];
};

export function DashboardUrgentTasks({
  urgentTasks,
}: DashboardUrgentTasksProps) {
  return (
    <section style={sectionStyle}>
      <DashboardPanel title="Task urgenti">
        {urgentTasks.length === 0 ? (
          <DashboardEmptyState text="Nessun task urgente aperto." />
        ) : (
          urgentTasks.map((task) => (
            <DashboardTaskRow key={task.id} task={task} />
          ))
        )}
      </DashboardPanel>
    </section>
  );
}

const sectionStyle = {
  marginBottom: "32px",
};