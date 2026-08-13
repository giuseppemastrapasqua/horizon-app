import {
  TaskStatus,
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

const taskUpdateManyMock = vi.hoisted(() =>
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
    updateMany: taskUpdateManyMock,
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

import { cancelOpenBookingTasksAction } from "./cancel-open-tasks";

describe("cancelOpenBookingTasksAction", () => {
  beforeEach(() => {
    taskFindManyMock.mockReset();
    taskUpdateManyMock.mockReset();
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

    taskUpdateManyMock.mockResolvedValue({
      count: 0,
    });

    auditLogMock.mockResolvedValue(undefined);
  });

  it("annulla i task TODO e IN_PROGRESS della booking", async () => {
    taskFindManyMock.mockResolvedValueOnce([
      {
        id: "task-1",
        propertyId: "property-1",
        title: "Documenti",
        status: TaskStatus.TODO,
      },
      {
        id: "task-2",
        propertyId: "property-1",
        title: "Pulizia",
        status: TaskStatus.IN_PROGRESS,
      },
    ]);

    taskUpdateManyMock.mockResolvedValueOnce({
      count: 2,
    });

    const result =
      await cancelOpenBookingTasksAction.execute(
        createContext(),
      );

    expect(result).toEqual({
      actionId:
        "booking.cancel-open-tasks",
      actionName:
        "Cancel open booking tasks",
      success: true,
      skipped: false,
      data: {
        cancelledTasks: 2,
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
      },
      select: {
        id: true,
        propertyId: true,
        title: true,
        status: true,
      },
    });

    expect(
      taskUpdateManyMock,
    ).toHaveBeenCalledWith({
      where: {
        id: {
          in: [
            "task-1",
            "task-2",
          ],
        },
      },
      data: {
        status:
          TaskStatus.CANCELLED,
      },
    });

    expect(auditLogMock).toHaveBeenCalledTimes(
      2,
    );

    expect(
      auditLogMock,
    ).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        action: "STATUS_CHANGE",
        propertyId: "property-1",
        entityType: "TASK",
        entityId: "task-1",
        metadata: expect.objectContaining({
          bookingId: "booking-1",
          previousStatus:
            TaskStatus.TODO,
          newStatus:
            TaskStatus.CANCELLED,
          workflowActionId:
            "booking.cancel-open-tasks",
          workflowEventId:
            "event-1",
        }),
      }),
      transactionClient,
    );

    expect(
      auditLogMock,
    ).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        action: "STATUS_CHANGE",
        propertyId: "property-1",
        entityType: "TASK",
        entityId: "task-2",
        metadata: expect.objectContaining({
          bookingId: "booking-1",
          previousStatus:
            TaskStatus.IN_PROGRESS,
          newStatus:
            TaskStatus.CANCELLED,
          workflowActionId:
            "booking.cancel-open-tasks",
          workflowEventId:
            "event-1",
        }),
      }),
      transactionClient,
    );
  });

  it("salta quando non ci sono task aperti", async () => {
    taskFindManyMock.mockResolvedValueOnce(
      [],
    );

    const result =
      await cancelOpenBookingTasksAction.execute(
        createContext(),
      );

    expect(result).toEqual({
      actionId:
        "booking.cancel-open-tasks",
      actionName:
        "Cancel open booking tasks",
      success: true,
      skipped: true,
      data: {
        cancelledTasks: 0,
      },
    });

    expect(
      taskUpdateManyMock,
    ).not.toHaveBeenCalled();

    expect(
      auditLogMock,
    ).not.toHaveBeenCalled();
  });

  it("restituisce errore quando manca bookingId", async () => {
    const context = createContext({
      payload: {
        propertyId: "property-1",
      },
    });

    const result =
      await cancelOpenBookingTasksAction.execute(
        context,
      );

    expect(result).toEqual({
      actionId:
        "booking.cancel-open-tasks",
      actionName:
        "Cancel open booking tasks",
      success: false,
      error:
        "BOOKING_CANCELLED senza bookingId nel payload.",
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
    id: "event-1",
    eventType: "BOOKING_CANCELLED",
    aggregateType: "BOOKING",
    aggregateId: "booking-1",
    source: "HORIZON",
    status: "PENDING",
    payload: {
      bookingId: "booking-1",
      propertyId: "property-1",
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
