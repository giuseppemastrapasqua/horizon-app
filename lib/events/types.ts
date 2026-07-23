import {
  Prisma,
  SystemEventSource,
} from "@prisma/client";

export type HorizonEventType =
  | "BOOKING_CREATED"
  | "BOOKING_UPDATED"
  | "BOOKING_CANCELLED"
  | "TASK_CREATED"
  | "TASK_COMPLETED"
  | "DOCUMENT_CREATED"
  | "DOCUMENT_UPDATED"
  | "DOCUMENT_FINALIZED"
  | "PROPERTY_CREATED"
  | "PROPERTY_UPDATED"
  | "OWNER_CREATED"
  | "OWNER_UPDATED";

export type HorizonAggregateType =
  | "BOOKING"
  | "TASK"
  | "DOCUMENT"
  | "PROPERTY"
  | "OWNER";

export type EmitEventInput = {
  eventType: HorizonEventType;
  aggregateType: HorizonAggregateType;
  aggregateId?: string;
  source?: SystemEventSource;
  payload: Prisma.InputJsonValue;
  idempotencyKey: string;
  externalEventId?: string;
  correlationId?: string;
  causationId?: string;
  availableAt?: Date;
};

export type EmitEventResult = {
  id: string;
  created: boolean;
};