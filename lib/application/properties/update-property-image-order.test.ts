import type { Prisma } from "@prisma/client";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const prismaTransactionMock = vi.hoisted(() =>
  vi.fn(),
);

const auditLogMock = vi.hoisted(() =>
  vi.fn(),
);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: prismaTransactionMock,
  },
}));

vi.mock("@/services/audit/AuditService", () => ({
  AuditService: {
    log: auditLogMock,
  },
}));

import { updatePropertyImageOrder } from "./update-property-image-order";

describe("updatePropertyImageOrder", () => {
  beforeEach(() => {
    prismaTransactionMock.mockReset();
    auditLogMock.mockReset();
  });

  it("rifiuta l'operazione quando manca una o più immagini", async () => {
    const transaction = createTransactionMock();

    transaction.propertyImage.findMany.mockResolvedValueOnce([
      {
        id: "image-1",
        sortOrder: 0,
      },
    ]);

    configureTransaction(transaction.client);

    await expect(
      updatePropertyImageOrder({
        propertyId: "property-1",
        imageIds: ["image-1", "image-2"],
      }),
    ).rejects.toThrow(
      "Una o più immagini non sono state trovate.",
    );

    expect(
      transaction.propertyImage.update,
    ).not.toHaveBeenCalled();

    expect(auditLogMock).not.toHaveBeenCalled();
  });

  it("non aggiorna nulla quando l'ordine non cambia", async () => {
    const transaction = createTransactionMock();

    transaction.propertyImage.findMany.mockResolvedValueOnce([
      {
        id: "image-1",
        sortOrder: 0,
      },
      {
        id: "image-2",
        sortOrder: 1,
      },
      {
        id: "image-3",
        sortOrder: 2,
      },
    ]);

    configureTransaction(transaction.client);

    await updatePropertyImageOrder({
      propertyId: "property-1",
      imageIds: [
        "image-1",
        "image-2",
        "image-3",
      ],
    });

    expect(
      transaction.propertyImage.update,
    ).not.toHaveBeenCalled();

    expect(auditLogMock).not.toHaveBeenCalled();
  });

  it("aggiorna il sortOrder di tutte le immagini", async () => {
    const transaction = createTransactionMock();

    transaction.propertyImage.findMany.mockResolvedValueOnce([
      {
        id: "image-1",
        sortOrder: 0,
      },
      {
        id: "image-2",
        sortOrder: 1,
      },
      {
        id: "image-3",
        sortOrder: 2,
      },
    ]);

    configureTransaction(transaction.client);

    await updatePropertyImageOrder({
      propertyId: "property-1",
      imageIds: [
        "image-3",
        "image-1",
        "image-2",
      ],
    });

    expect(
      transaction.propertyImage.update,
    ).toHaveBeenCalledTimes(3);

    expect(
      transaction.propertyImage.update,
    ).toHaveBeenNthCalledWith(1, {
      where: {
        id: "image-3",
      },
      data: {
        sortOrder: 0,
      },
    });

    expect(
      transaction.propertyImage.update,
    ).toHaveBeenNthCalledWith(2, {
      where: {
        id: "image-1",
      },
      data: {
        sortOrder: 1,
      },
    });

    expect(
      transaction.propertyImage.update,
    ).toHaveBeenNthCalledWith(3, {
      where: {
        id: "image-2",
      },
      data: {
        sortOrder: 2,
      },
    });
  });

  it("registra l'audit nella stessa transazione", async () => {
    const transaction = createTransactionMock();

    transaction.propertyImage.findMany.mockResolvedValueOnce([
      {
        id: "image-1",
        sortOrder: 0,
      },
      {
        id: "image-2",
        sortOrder: 1,
      },
      {
        id: "image-3",
        sortOrder: 2,
      },
    ]);

    configureTransaction(transaction.client);

    await updatePropertyImageOrder({
      propertyId: "property-1",
      imageIds: [
        "image-2",
        "image-3",
        "image-1",
      ],
    });

    expect(auditLogMock).toHaveBeenCalledWith(
      {
        action: "UPDATE",
        propertyId: "property-1",
        entityType: "PROPERTY_PHOTO",
        entityId: "property-1",
        description:
          "Ordine delle foto dell’immobile aggiornato.",
        metadata: {
          previousOrder: [
            "image-1",
            "image-2",
            "image-3",
          ],
          newOrder: [
            "image-2",
            "image-3",
            "image-1",
          ],
          totalImages: 3,
        },
      },
      transaction.client,
    );
  });

  it("usa l'ordine restituito dal database come previousOrder", async () => {
    const transaction = createTransactionMock();

    transaction.propertyImage.findMany.mockResolvedValueOnce([
      {
        id: "image-2",
        sortOrder: 0,
      },
      {
        id: "image-1",
        sortOrder: 1,
      },
    ]);

    configureTransaction(transaction.client);

    await updatePropertyImageOrder({
      propertyId: "property-1",
      imageIds: [
        "image-1",
        "image-2",
      ],
    });

    expect(auditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {
          previousOrder: [
            "image-2",
            "image-1",
          ],
          newOrder: [
            "image-1",
            "image-2",
          ],
          totalImages: 2,
        },
      }),
      transaction.client,
    );
  });

  it("propaga gli errori della transazione", async () => {
    const transactionError = new Error(
      "Riordino immagini fallito.",
    );

    prismaTransactionMock.mockRejectedValueOnce(
      transactionError,
    );

    await expect(
      updatePropertyImageOrder({
        propertyId: "property-1",
        imageIds: [
          "image-1",
          "image-2",
        ],
      }),
    ).rejects.toBe(transactionError);

    expect(auditLogMock).not.toHaveBeenCalled();
  });
});

function configureTransaction(
  transaction: Prisma.TransactionClient,
): void {
  prismaTransactionMock.mockImplementationOnce(
    async (
      callback: (
        transactionClient: Prisma.TransactionClient,
      ) => Promise<void>,
    ) => callback(transaction),
  );
}

function createTransactionMock() {
  const propertyImage = {
    findMany: vi.fn(),
    update: vi.fn().mockResolvedValue(undefined),
  };

  const client = {
    propertyImage,
  } as unknown as Prisma.TransactionClient;

  return {
    client,
    propertyImage,
  };
}
