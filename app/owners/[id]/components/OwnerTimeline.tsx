import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { uiTokens } from "@/components/ui/tokens";

export type OwnerTimelineItem = {
  id: string;
  title: string;
  description: string;
  occurredAt: Date;
  category: "BOOKING" | "TASK" | "DOCUMENT" | "PROPERTY" | "SYSTEM";
  href?: string;
  status?: "SUCCESS" | "WARNING" | "DANGER" | "INFO";
};

type OwnerTimelineProps = {
  items: OwnerTimelineItem[];
};

export function OwnerTimeline({
  items,
}: OwnerTimelineProps) {
  return (
    <Panel>
      <SectionTitle
        title="Attività recenti"
        subtitle="Ultimi aggiornamenti relativi al proprietario e al portfolio."
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
          title="Nessuna attività recente"
          description="Gli eventi di booking, task e documenti compariranno qui."
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
                  {item.occurredAt.toLocaleString("it-IT")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function getCategoryTone(
  category: OwnerTimelineItem["category"]
) {
  if (category === "BOOKING") return "blue";
  if (category === "TASK") return "yellow";
  if (category === "DOCUMENT") return "violet";
  if (category === "PROPERTY") return "green";
  return "default";
}

function getStatusStyle(
  status: NonNullable<OwnerTimelineItem["status"]>
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
  gridTemplateColumns: "22px 1fr",
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
  paddingBottom: uiTokens.spacing.lg,
};

const contentHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: uiTokens.spacing.md,
};

const eventTitleStyle = {
  color: uiTokens.colors.textPrimary,
  fontSize: uiTokens.fontSize.md,
  fontWeight: uiTokens.fontWeight.bold,
};

const eventTitleLinkStyle = {
  color: uiTokens.colors.textPrimary,
  fontSize: uiTokens.fontSize.md,
  fontWeight: uiTokens.fontWeight.bold,
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