import Link from "next/link";

import { DashboardTaskBadge } from "@/components/dashboard/DashboardTaskBadge";

type DashboardTaskRowProps = {
  task: {
    id: string;
    title: string;
    status: string;
    dueDate: Date | null;
    property: {
      name: string;
    };
  };
};

export function DashboardTaskRow({
  task,
}: DashboardTaskRowProps) {
  return (
    <div style={taskRowStyle}>
      <div>
        <Link href={`/tasks/${task.id}`} style={taskTitleStyle}>
          {task.title}
        </Link>

        <div style={taskMetaStyle}>
          {task.property.name} ·{" "}
          {task.dueDate
            ? task.dueDate.toLocaleString("it-IT")
            : "Senza scadenza"}
        </div>
      </div>

      <DashboardTaskBadge status={task.status} />
    </div>
  );
}

const taskRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  padding: "14px",
  borderRadius: "16px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  color: "#334155",
};

const taskTitleStyle = {
  color: "#0f172a",
  fontWeight: 800,
  textDecoration: "none",
};

const taskMetaStyle = {
  marginTop: "4px",
  color: "#64748b",
};