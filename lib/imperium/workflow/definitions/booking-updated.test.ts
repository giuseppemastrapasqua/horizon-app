import type { SystemEvent } from "@prisma/client";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const executeActionMock = vi.hoisted(() =>
  vi.fn(),
);

vi.mock("../../actions", () => ({
  executeAction: executeActionMock,
}));

import { bookingUpdatedWorkflow } from "./booking-updated";

describe("bookingUpdatedWorkflow", () => {
  beforeEach(() => {
    executeActionMock.mockReset();

    executeActionMock.mockResolvedValue({
      actionId:
        "booking.update-open-tasks",
      actionName:
        "Update open booking tasks",
      success: true,
      data: {
        updatedTasks: 4,
      },
    });
  });

  it("è registrato per BOOKING_UPDATED", () => {
    expect(
      bookingUpdatedWorkflow,
    ).toMatchObject({
      id: "booking-updated",
      name: "Booking Updated",
      trigger: "BOOKING_UPDATED",
      priority: 100,
    });

    expect(
      bookingUpdatedWorkflow.actions,
    ).toHaveLength(1);
  });

  it("esegue booking.update-open-tasks", async () => {
    const context = createContext();

    await bookingUpdatedWorkflow.actions[0](
      context,
    );

    expect(
      executeActionMock,
    ).toHaveBeenCalledOnce();

    expect(
      executeActionMock,
    ).toHaveBeenCalledWith(
      "booking.update-open-tasks",
      context,
    );
  });

  it("completa il workflow quando l'action ha successo", async () => {
    const context = createContext();

    await expect(
      bookingUpdatedWorkflow.actions[0](
        context,
      ),
    ).resolves.toBeUndefined();
  });

  it("propaga l'errore dell'action", async () => {
    executeActionMock.mockResolvedValueOnce({
      actionId:
        "booking.update-open-tasks",
      actionName:
        "Update open booking tasks",
      success: false,
      error:
        "Aggiornamento task fallito.",
    });

    const context = createContext();

    await expect(
      bookingUpdatedWorkflow.actions[0](
        context,
      ),
    ).rejects.toThrow(
      "Aggiornamento task fallito.",
    );
  });

  it("usa il messaggio di fallback quando l'action fallisce senza error", async () => {
    executeActionMock.mockResolvedValueOnce({
      actionId:
        "booking.update-open-tasks",
      actionName:
        "Update open booking tasks",
      success: false,
    });

    const context = createContext();

    await expect(
      bookingUpdatedWorkflow.actions[0](
        context,
      ),
    ).rejects.toThrow(
      "Errore durante l'aggiornamento dei task della prenotazione.",
    );
  });
});

function createContext() {
  const event: SystemEvent = {
    id: "event-updated-1",
    eventType: "BOOKING_UPDATED",
    aggregateType: "BOOKING",
    aggregateId: "booking-1",

    source: "HORIZON",
    status: "PENDING",

    payload: {
      bookingId: "booking-1",
      propertyId: "property-1",
      ownerId: "owner-1",
      guestName: "Mario Rossi",
      checkIn:
        "2026-09-12T14:00:00.000Z",
      checkOut:
        "2026-09-15T10:00:00.000Z",
    },

    idempotencyKey:
      "BOOKING_UPDATED:booking-1:test",

    externalEventId: null,
    correlationId: null,
    causationId: null,

    attempts: 0,
    lastError: null,

    availableAt: new Date(
      "2026-08-10T12:00:00.000Z",
    ),
    processingAt: null,
    processedAt: null,

    createdAt: new Date(
      "2026-08-10T12:00:00.000Z",
    ),
    updatedAt: new Date(
      "2026-08-10T12:00:00.000Z",
    ),
  };

  return {
    event,
    correlationId:
      event.correlationId,
    causationId:
      event.causationId,
  };
}