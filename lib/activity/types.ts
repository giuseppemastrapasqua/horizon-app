export type ActivityType =
  | "BOOKING_CREATED"
  | "BOOKING_UPDATED"
  | "BOOKING_STATUS_CHANGED"
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "TASK_COMPLETED"
  | "DOCUMENT_CREATED"
  | "DOCUMENT_UPDATED"
  | "DOCUMENT_ISSUED"
  | "GUEST_CREATED"
  | "PROPERTY_UPDATED"
  | "SYSTEM";

export type ActivitySource =
  | "BOOKING"
  | "GUEST"
  | "PROPERTY"
  | "OWNER"
  | "TASK"
  | "DOCUMENT"
  | "SYSTEM";

export type ActivityTone =
  | "success"
  | "warning"
  | "danger"
  | "info";

export type ActivityItem = {
  id: string;
  type: ActivityType;
  source: ActivitySource;
  title: string;
  description?: string | null;
  occurredAt: Date;
  tone: ActivityTone;
  href?: string | null;
  actorName?: string | null;
};