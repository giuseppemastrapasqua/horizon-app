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
  dark?: boolean;
  compact?: boolean;
};

export function WorkspaceTimeline({
  title = "Attività recenti",
  subtitle = "Cronologia degli ultimi eventi.",
  emptyTitle = "Nessuna attività recente",
  emptyDescription = "Gli eventi compariranno qui.",
  items,
  dark = false,
  compact = false,
}: WorkspaceTimelineProps) {
  return (
    <Panel dark={dark} padding={compact ? "sm" : "lg"}>
      <SectionTitle
        title={title}
        subtitle={subtitle}
        dark={dark}
        compact={compact}
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
            <div
              key={item.id}
              style={{
                ...timelineItemStyle,
                gap: compact
                  ? uiTokens.spacing.sm
                  : uiTokens.spacing.md,
              }}
            >
              <div style={timelineRailStyle}>
                <div
                  style={{
                    ...timelineDotStyle,
                    ...getStatusStyle(item.status ?? "INFO"),
                  }}
                />

                {index < items.length - 1 ? (
                  <div
                    style={{
                      ...timelineLineStyle,
                      minHeight: compact ? "32px" : "58px",
                    }}
                  />
                ) : null}
              </div>

              <div
                style={{
                  ...contentStyle,
                  paddingBottom: compact
                    ? uiTokens.spacing.sm
                    : uiTokens.spacing.lg,
                }}
              >
                <div
                  style={{
                    ...contentHeaderStyle,
                    gap: compact
                      ? uiTokens.spacing.sm
                      : uiTokens.spacing.md,
                  }}
                >
                  <div>
                    {item.href ? (
                      <Link
                        href={item.href}
                        style={{
                          ...eventTitleLinkStyle,
                          color: dark
                            ? "#ffffff"
                            : uiTokens.colors.textPrimary,
                        }}
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <strong
                        style={{
                          ...eventTitleStyle,
                          color: dark
                            ? "#ffffff"
                            : uiTokens.colors.textPrimary,
                        }}
                      >
                        {item.title}
                      </strong>
                    )}

                    <p
                      style={{
                        ...descriptionStyle,
                        margin: compact ? "2px 0 0" : descriptionStyle.margin,
                        color: dark
                          ? "#94a3b8"
                          : uiTokens.colors.textMuted,
                      }}
                    >
                      {item.description}
                    </p>
                  </div>

                  <StatusBadge
                    label={item.category}
                    tone={getCategoryTone(item.category)}
                    compact
                  />
                </div>

                <div
                  style={{
                    ...dateStyle,
                    marginTop: compact
                      ? "3px"
                      : uiTokens.spacing.sm,
                    color: dark
                      ? "#64748b"
                      : uiTokens.colors.textSubtle,
                  }}
                >
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
  status: NonNullable<WorkspaceTimelineItem["status"]>,
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
  background: uiTokens.colors.border,
};

const contentStyle = {
  minWidth: 0,
};

const contentHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
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
  color: uiTokens.colors.textSubtle,
  fontSize: uiTokens.fontSize.xs,
};