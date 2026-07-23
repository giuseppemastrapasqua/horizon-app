import type { SystemEvent } from "@prisma/client";

export type WorkflowTrigger =
  | "BOOKING_CREATED"
  | "BOOKING_UPDATED"
  | "BOOKING_CANCELLED"
  | "TASK_CREATED"
  | "TASK_COMPLETED"
  | "DOCUMENT_CREATED"
  | "DOCUMENT_FINALIZED"
  | "PROPERTY_CREATED"
  | "OWNER_CREATED";

export type WorkflowContext = {
  event: SystemEvent;
  correlationId?: string | null;
  causationId?: string | null;
};

export type WorkflowCondition = (
  context: WorkflowContext
) => boolean | Promise<boolean>;

export type WorkflowAction = (
  context: WorkflowContext
) => Promise<void>;

export type ImperiumWorkflow = {
  id: string;
  name: string;
  description?: string;
  trigger: WorkflowTrigger;
  priority?: number;
  enabled?: boolean;
  conditions?: WorkflowCondition[];
  actions: WorkflowAction[];
};