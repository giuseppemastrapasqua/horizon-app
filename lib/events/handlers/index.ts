import type { SystemEvent } from "@prisma/client";
import type { HorizonEventType } from "../types";

export type HorizonEventHandler = (
  event: SystemEvent
) => Promise<void>;

const handlers = new Map<
  HorizonEventType,
  HorizonEventHandler[]
>();

export function registerEventHandler(
  eventType: HorizonEventType,
  handler: HorizonEventHandler
) {
  const registeredHandlers =
    handlers.get(eventType) ?? [];

  registeredHandlers.push(handler);
  handlers.set(eventType, registeredHandlers);
}

export function getEventHandlers(
  eventType: HorizonEventType
): HorizonEventHandler[] {
  return handlers.get(eventType) ?? [];
}