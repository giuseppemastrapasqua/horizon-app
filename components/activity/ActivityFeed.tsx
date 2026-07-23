import type { CSSProperties } from "react";
import type { ActivityItem } from "@/lib/activity";

type ActivityFeedProps = {
  items: ActivityItem[];
};

export function ActivityFeed({
  items,
}: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <section style={emptyStyle}>
        Nessuna attività disponibile.
      </section>
    );
  }

  return (
    <section style={containerStyle}>
      {items.map((activity) => (
        <div
          key={activity.id}
          style={rowStyle}
        >
          <div
            style={{
              ...dotStyle,
              background: toneColor[activity.tone],
            }}
          />

          <div style={contentStyle}>
            <strong style={titleStyle}>
              {activity.title}
            </strong>

            {activity.description && (
              <div style={descriptionStyle}>
                {activity.description}
              </div>
            )}

            <div style={metaStyle}>
              {formatDate(activity.occurredAt)}

              {activity.actorName
                ? ` • ${activity.actorName}`
                : ""}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

const toneColor = {
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

const containerStyle: CSSProperties = {
  display: "grid",
  gap: 16,
};

const rowStyle: CSSProperties = {
  display: "flex",
  gap: 14,
  alignItems: "flex-start",
};

const dotStyle: CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: 999,
  marginTop: 6,
};

const contentStyle: CSSProperties = {
  display: "grid",
  gap: 4,
};

const titleStyle: CSSProperties = {
  fontSize: 15,
};

const descriptionStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 13,
};

const metaStyle: CSSProperties = {
  color: "#94a3b8",
  fontSize: 12,
};

const emptyStyle: CSSProperties = {
  padding: 24,
  border: "1px dashed #cbd5e1",
  borderRadius: 16,
  color: "#64748b",
  textAlign: "center",
};