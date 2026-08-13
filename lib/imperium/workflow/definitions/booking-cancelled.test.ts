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

import { bookingCancelledWorkflow } from "./booking-cancelled";

describe("bookingCancelledWorkflow", () => {
  beforeEach(() => {
    executeActionMock.mockReset();

    executeActionMock.mockResolvedValue({
      actionId:
        "booking.cancel-open-tasks",
      actionName:
        "Cancel open booking tasks",
      success: true,
      data: {
        cancelledTasks: 4,
      },
    });
  });

  it("è registrato per BOOKING_CANCELLED", () => {
    expect(
      bookingCancelledWorkflow,
    ).toMatchObject({
      id: "booking-cancelled",
      name: "Booking Cancelled",
      trigger: "BOOKING_CANCELLED",
      priority: 100,
    });

    expect(
      bookingCancelledWorkflow.actions,
    ).toHaveLength(1);
  });

  it("esegue booking.cancel-open-tasks", async () => {
    const context = createContext();

    await bookingCancelledWorkflow.actions[0](
      context,
    );

    expect(
      executeActionMock,
    ).toHaveBeenCalledOnce();

    expect(
      executeActionMock,
    ).toHaveBeenCalledWith(
      "booking.cancel-open-tasks",
      context,
    );
  });

  it("completa il workflow quando l'action ha successo", async () => {
    const context = createContext();

    await expect(
      bookingCancelledWorkflow.actions[0](
        context,
      ),
    ).resolves.toBeUndefined();

    expect(
      executeActionMock,
    ).toHaveBeenCalledWith(
      "booking.cancel-open-tasks",
      context,
    );
  });

  it("propaga come errore il fallimento dell'action", async () => {
    executeActionMock.mockResolvedValueOnce({
      actionId:
        "booking.cancel-open-tasks",
      actionName:
        "Cancel open booking tasks",
      success: false,
      error:
        "Impossibile cancellare i task.",
    });

    const context = createContext();

    await expect(
      bookingCancelledWorkflow.actions[0](
        context,
      ),
    ).rejects.toThrow(
      "Impossibile cancellare i task.",
    );
  });

  it("usa il messaggio di fallback quando l'action fallisce senza error", async () => {
    executeActionMock.mockResolvedValueOnce({
      actionId:
        "booking.cancel-open-tasks",
      actionName:
        "Cancel open booking tasks",
      success: false,
    });

    const context = createContext();

    await expect(
      bookingCancelledWorkflow.actions[0](
        context,
      ),
    ).rejects.toThrow(
      "Errore durante l'annullamento dei task aperti della prenotazione.",
    );
  });
});

function createContext() {
  const event: SystemEvent = {
    id: "event-1",
    eventType: "BOOKING_CANCELLED",
    aggregateType: "BOOKING",
    aggregateId: "booking-1",

    source: "HORIZON",
    status: "PENDING",

    payload: {
      bookingId: "booking-1",
      propertyId: "property-1",
      ownerId: "owner-1",
    },

    idempotencyKey:
      "BOOKING_CANCELLED:booking-1",

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