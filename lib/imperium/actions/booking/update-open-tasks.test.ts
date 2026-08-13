import {
  TaskStatus,
  TaskType,
  type Prisma,
  type SystemEvent,
} from "@prisma/client";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const taskFindManyMock = vi.hoisted(() =>
  vi.fn(),
);

const taskUpdateMock = vi.hoisted(() =>
  vi.fn(),
);

const auditLogMock = vi.hoisted(() =>
  vi.fn(),
);

const prismaTransactionMock = vi.hoisted(() =>
  vi.fn(),
);

const transactionClient = vi.hoisted(() => ({
  task: {
    findMany: taskFindManyMock,
    update: taskUpdateMock,
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: prismaTransactionMock,
  },
}));

vi.mock(
  "@/services/audit/AuditService",
  () => ({
    AuditService: {
      log: auditLogMock,
    },
  }),
);

import { updateOpenBookingTasksAction } from "./update-open-tasks";

describe("updateOpenBookingTasksAction", () => {
  beforeEach(() => {
    taskFindManyMock.mockReset();
    taskUpdateMock.mockReset();
    auditLogMock.mockReset();
    prismaTransactionMock.mockReset();

    prismaTransactionMock.mockImplementation(
      async (
        callback: (
          transaction: Prisma.TransactionClient,
        ) => Promise<unknown>,
      ) =>
        callback(
          transactionClient as unknown as Prisma.TransactionClient,
        ),
    );

    taskUpdateMock.mockResolvedValue({});
    auditLogMock.mockResolvedValue(undefined);
  });

  it("aggiorna le scadenze dei task aperti in base alle nuove date della booking", async () => {
    taskFindManyMock.mockResolvedValueOnce([
      {
        id: "task-documents",
        propertyId: "property-1",
        type: TaskType.GUEST_DOCUMENTS,
        title:
          "Controllo documenti · Vecchio ospite",
        dueDate: new Date(
          "2026-09-08T18:00:00.000Z",
        ),
      },
      {
        id: "task-cleaning",
        propertyId: "property-1",
        type: TaskType.CLEANING,
        title:
          "Pulizia pre check-in · Vecchio ospite",
        dueDate: new Date(
          "2026-09-09T12:00:00.000Z",
        ),
      },
      {
        id: "task-checkout",
        propertyId: "property-1",
        type: TaskType.CHECK_OUT,
        title:
          "Controllo check-out · Vecchio ospite",
        dueDate: new Date(
          "2026-09-13T10:00:00.000Z",
        ),
      },
      {
        id: "task-admin",
        propertyId: "property-1",
        type: TaskType.ADMIN,
        title:
          "IMPERIUM · Verifica prenotazione Vecchio ospite",
        dueDate: new Date(
          "2026-09-10T14:00:00.000Z",
        ),
      },
    ]);

    const result =
      await updateOpenBookingTasksAction.execute(
        createContext(),
      );

    expect(result).toEqual({
      actionId:
        "booking.update-open-tasks",
      actionName:
        "Update open booking tasks",
      success: true,
      skipped: false,
      data: {
        updatedTasks: 4,
      },
    });

    expect(
      taskFindManyMock,
    ).toHaveBeenCalledWith({
      where: {
        bookingId: "booking-1",
        status: {
          in: [
            TaskStatus.TODO,
            TaskStatus.IN_PROGRESS,
          ],
        },
        OR: [
          {
            type:
              TaskType.GUEST_DOCUMENTS,
            title: {
              startsWith:
                "Controllo documenti · ",
            },
          },
          {
            type:
              TaskType.CLEANING,
            title: {
              startsWith:
                "Pulizia pre check-in · ",
            },
          },
          {
            type:
              TaskType.CHECK_OUT,
            title: {
              startsWith:
                "Controllo check-out · ",
            },
          },
          {
            type:
              TaskType.ADMIN,
            title: {
              startsWith:
                "IMPERIUM · Verifica prenotazione ",
            },
          },
        ],
      },
      select: {
        id: true,
        propertyId: true,
        type: true,
        title: true,
        dueDate: true,
      },
    });

    expect(taskUpdateMock).toHaveBeenCalledTimes(
      4,
    );

    expect(
      taskUpdateMock,
    ).toHaveBeenCalledWith({
      where: {
        id: "task-documents",
      },
      data: {
        title:
          "Controllo documenti · Mario Rossi",
        dueDate: new Date(
          "2026-09-10T18:00:00.000Z",
        ),
      },
    });

    expect(
      taskUpdateMock,
    ).toHaveBeenCalledWith({
      where: {
        id: "task-cleaning",
      },
      data: {
        title:
          "Pulizia pre check-in · Mario Rossi",
        dueDate: new Date(
          "2026-09-11T12:00:00.000Z",
        ),
      },
    });

    expect(
      taskUpdateMock,
    ).toHaveBeenCalledWith({
      where: {
        id: "task-checkout",
      },
      data: {
        title:
          "Controllo check-out · Mario Rossi",
        dueDate: new Date(
          "2026-09-15T10:00:00.000Z",
        ),
      },
    });

    expect(
      taskUpdateMock,
    ).toHaveBeenCalledWith({
      where: {
        id: "task-admin",
      },
      data: {
        title:
          "IMPERIUM · Verifica prenotazione Mario Rossi",
        dueDate: new Date(
          "2026-09-12T14:00:00.000Z",
        ),
      },
    });

    expect(auditLogMock).toHaveBeenCalledTimes(
      4,
    );
  });

  it("salta quando i task sono già allineati", async () => {
    taskFindManyMock.mockResolvedValueOnce([
      {
        id: "task-cleaning",
        propertyId: "property-1",
        type: TaskType.CLEANING,
        title:
          "Pulizia pre check-in · Mario Rossi",
        dueDate: new Date(
          "2026-09-11T12:00:00.000Z",
        ),
      },
    ]);

    const result =
      await updateOpenBookingTasksAction.execute(
        createContext(),
      );

    expect(result).toEqual({
      actionId:
        "booking.update-open-tasks",
      actionName:
        "Update open booking tasks",
      success: true,
      skipped: true,
      data: {
        updatedTasks: 0,
      },
    });

    expect(
      taskUpdateMock,
    ).not.toHaveBeenCalled();

    expect(
      auditLogMock,
    ).not.toHaveBeenCalled();
  });

  it("fallisce quando manca bookingId", async () => {
    const result =
      await updateOpenBookingTasksAction.execute(
        createContext({
          payload: {
            propertyId: "property-1",
            guestName: "Mario Rossi",
            checkIn:
              "2026-09-12T14:00:00.000Z",
            checkOut:
              "2026-09-15T10:00:00.000Z",
          },
        }),
      );

    expect(result).toEqual({
      actionId:
        "booking.update-open-tasks",
      actionName:
        "Update open booking tasks",
      success: false,
      error:
        "BOOKING_UPDATED senza bookingId nel payload.",
    });

    expect(
      prismaTransactionMock,
    ).not.toHaveBeenCalled();
  });

  it("fallisce quando checkIn non è valido", async () => {
    const result =
      await updateOpenBookingTasksAction.execute(
        createContext({
          payload: {
            bookingId: "booking-1",
            propertyId: "property-1",
            guestName: "Mario Rossi",
            checkIn: "data-non-valida",
            checkOut:
              "2026-09-15T10:00:00.000Z",
          },
        }),
      );

    expect(result).toEqual({
      actionId:
        "booking.update-open-tasks",
      actionName:
        "Update open booking tasks",
      success: false,
      error:
        "BOOKING_UPDATED contiene un checkIn non valido.",
    });

    expect(
      prismaTransactionMock,
    ).not.toHaveBeenCalled();
  });

  it("fallisce quando checkOut non è valido", async () => {
    const result =
      await updateOpenBookingTasksAction.execute(
        createContext({
          payload: {
            bookingId: "booking-1",
            propertyId: "property-1",
            guestName: "Mario Rossi",
            checkIn:
              "2026-09-12T14:00:00.000Z",
            checkOut: "data-non-valida",
          },
        }),
      );

    expect(result).toEqual({
      actionId:
        "booking.update-open-tasks",
      actionName:
        "Update open booking tasks",
      success: false,
      error:
        "BOOKING_UPDATED contiene un checkOut non valido.",
    });

    expect(
      prismaTransactionMock,
    ).not.toHaveBeenCalled();
  });
});

function createContext(
  overrides?: Partial<SystemEvent>,
) {
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

    ...overrides,
  };

  return {
    event,
    correlationId:
      event.correlationId,
    causationId:
      event.causationId,
  };
}