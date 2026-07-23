import Link from "next/link";
import { Panel } from "./Panel";
import { SectionTitle } from "./SectionTitle";
import { StatusBadge } from "./StatusBadge";
import { EmptyState } from "./EmptyState";
import { uiTokens, type UiTone } from "./tokens";
import { formatDateTime } from "@/lib/format/date";

export type WorkspaceTimelineItem = {
  id: string;
  title: string;
  description: string;
  occurredAt: Date;
  category: string;
  href?: string;
  status?: "SUCCESS" | "WARNING" | "DANGER" | "INFO";
};

type WorkspaceTimelineProps = {
  title?: string;
  subtitle?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  items: WorkspaceTimelineItem[];
};

export function WorkspaceTimeline({
  title = "Attività recenti",
  subtitle = "Cronologia degli ultimi eventi.",
  emptyTitle = "Nessuna attività recente",
  emptyDescription = "Gli eventi compariranno qui.",
  items,
}: WorkspaceTimelineProps) {
  return (
    <Panel>
      <SectionTitle
        title={title}
        subtitle={subtitle}
        action={
          <StatusBadge
            label={`${items.length} eventi`}
            tone="default"
            compact
          />
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
        />
      ) : (
        <div style={timelineStyle}>
          {items.map((item, index) => (
            <div key={item.id} style={timelineItemStyle}>
              <div style={timelineRailStyle}>
                <div
                  style={{
                    ...timelineDotStyle,
                    ...getStatusStyle(item.status ?? "INFO"),
                  }}
                />

                {index < items.length - 1 ? (
                  <div style={timelineLineStyle} />
                ) : null}
              </div>

              <div style={contentStyle}>
                <div style={contentHeaderStyle}>
                  <div>
                    {item.href ? (
                      <Link
                        href={item.href}
                        style={eventTitleLinkStyle}
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <strong style={eventTitleStyle}>
                        {item.title}
                      </strong>
                    )}

                    <p style={descriptionStyle}>
                      {item.description}
                    </p>
                  </div>

                  <StatusBadge
                    label={item.category}
                    tone={getCategoryTone(item.category)}
                    compact
                  />
                </div>

                <div style={dateStyle}>
                  {formatDateTime(item.occurredAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function getCategoryTone(category: string): UiTone {
  if (category === "BOOKING") return "blue";
  if (category === "TASK") return "yellow";
  if (category === "DOCUMENT") return "violet";
  if (category === "PROPERTY") return "green";

  return "default";
}

function getStatusStyle(
  status: NonNullable<WorkspaceTimelineItem["status"]>
) {
  if (status === "SUCCESS") {
    return {
      background: "#22c55e",
      border: "3px solid #dcfce7",
    };
  }

  if (status === "WARNING") {
    return {
      background: "#f59e0b",
      border: "3px solid #fef3c7",
    };
  }

  if (status === "DANGER") {
    return {
      background: "#f43f5e",
      border: "3px solid #ffe4e6",
    };
  }

  return {
    background: "#3b82f6",
    border: "3px solid #dbeafe",
  };
}

const timelineStyle = {
  display: "grid",
};

const timelineItemStyle = {
  display: "grid",
  gridTemplateColumns: "22px minmax(0, 1fr)",
  gap: uiTokens.spacing.md,
};

const timelineRailStyle = {
  display: "grid",
  gridTemplateRows: "18px 1fr",
  justifyItems: "center",
};

const timelineDotStyle = {
  width: "14px",
  height: "14px",
  borderRadius: uiTokens.radius.pill,
  boxSizing: "border-box" as const,
};

const timelineLineStyle = {
  width: "2px",
  minHeight: "58px",
  background: uiTokens.colors.border,
};

const contentStyle = {
  minWidth: 0,
  paddingBottom: uiTokens.spacing.lg,
};

const contentHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: uiTokens.spacing.md,
  flexWrap: "wrap" as const,
};

const eventTitleStyle = {
  color: uiTokens.colors.textPrimary,
  fontSize: uiTokens.fontSize.md,
  fontWeight: uiTokens.fontWeight.bold,
};

const eventTitleLinkStyle = {
  ...eventTitleStyle,
  textDecoration: "none",
};

const descriptionStyle = {
  margin: `${uiTokens.spacing.xs} 0 0`,
  color: uiTokens.colors.textMuted,
  fontSize: uiTokens.fontSize.sm,
  lineHeight: 1.45,
};

const dateStyle = {
  marginTop: uiTokens.spacing.sm,
  color: uiTokens.colors.textSubtle,
  fontSize: uiTokens.fontSize.xs,
};