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

import { setPropertyCoverImage } from "./set-property-cover-image";

describe("setPropertyCoverImage", () => {
  beforeEach(() => {
    prismaTransactionMock.mockReset();
    auditLogMock.mockReset();
  });

  it("rifiuta l'operazione quando la foto non esiste", async () => {
    const transaction = createTransactionMock();

    transaction.propertyImage.findFirst.mockResolvedValueOnce(
      null,
    );

    configureTransaction(transaction.client);

    await expect(
      setPropertyCoverImage({
        propertyId: "property-1",
        imageId: "image-missing",
      }),
    ).rejects.toThrow("Foto non trovata.");

    expect(
      transaction.propertyImage.updateMany,
    ).not.toHaveBeenCalled();

    expect(
      transaction.propertyImage.update,
    ).not.toHaveBeenCalled();

    expect(auditLogMock).not.toHaveBeenCalled();
  });

  it("non esegue modifiche quando la foto è già di copertina", async () => {
    const transaction = createTransactionMock();

    transaction.propertyImage.findFirst.mockResolvedValueOnce({
      id: "image-1",
      isCover: true,
      filename:
        "properties/property-1/image-1.webp",
      url: "/uploads/properties/property-1/image-1.webp",
    });

    configureTransaction(transaction.client);

    await setPropertyCoverImage({
      propertyId: "property-1",
      imageId: "image-1",
    });

    expect(
      transaction.propertyImage.findFirst,
    ).toHaveBeenCalledOnce();

    expect(
      transaction.propertyImage.updateMany,
    ).not.toHaveBeenCalled();

    expect(
      transaction.propertyImage.update,
    ).not.toHaveBeenCalled();

    expect(auditLogMock).not.toHaveBeenCalled();
  });

  it("rimuove la vecchia copertina e imposta quella nuova", async () => {
    const transaction = createTransactionMock();

    transaction.propertyImage.findFirst
      .mockResolvedValueOnce({
        id: "image-new",
        isCover: false,
        filename:
          "properties/property-1/image-new.webp",
        url: "/uploads/properties/property-1/image-new.webp",
      })
      .mockResolvedValueOnce({
        id: "image-old",
        filename:
          "properties/property-1/image-old.webp",
        url: "/uploads/properties/property-1/image-old.webp",
      });

    configureTransaction(transaction.client);

    await setPropertyCoverImage({
      propertyId: "property-1",
      imageId: "image-new",
    });

    expect(
      transaction.propertyImage.updateMany,
    ).toHaveBeenCalledWith({
      where: {
        propertyId: "property-1",
        isCover: true,
      },
      data: {
        isCover: false,
      },
    });

    expect(
      transaction.propertyImage.update,
    ).toHaveBeenCalledWith({
      where: {
        id: "image-new",
      },
      data: {
        isCover: true,
      },
    });
  });

  it("registra il cambio copertina nella stessa transazione", async () => {
    const transaction = createTransactionMock();

    transaction.propertyImage.findFirst
      .mockResolvedValueOnce({
        id: "image-new",
        isCover: false,
        filename:
          "properties/property-1/image-new.webp",
        url: "/uploads/properties/property-1/image-new.webp",
      })
      .mockResolvedValueOnce({
        id: "image-old",
        filename:
          "properties/property-1/image-old.webp",
        url: "/uploads/properties/property-1/image-old.webp",
      });

    configureTransaction(transaction.client);

    await setPropertyCoverImage({
      propertyId: "property-1",
      imageId: "image-new",
    });

    expect(auditLogMock).toHaveBeenCalledWith(
      {
        action: "UPDATE",
        propertyId: "property-1",
        entityType: "PROPERTY_PHOTO",
        entityId: "image-new",
        description:
          "Foto di copertina dell’immobile aggiornata.",
        metadata: {
          previousCover: {
            imageId: "image-old",
            filename:
              "properties/property-1/image-old.webp",
            url: "/uploads/properties/property-1/image-old.webp",
          },
          newCover: {
            imageId: "image-new",
            filename:
              "properties/property-1/image-new.webp",
            url: "/uploads/properties/property-1/image-new.webp",
          },
        },
      },
      transaction.client,
    );
  });

  it("gestisce correttamente l'assenza di una copertina precedente", async () => {
    const transaction = createTransactionMock();

    transaction.propertyImage.findFirst
      .mockResolvedValueOnce({
        id: "image-new",
        isCover: false,
        filename:
          "properties/property-1/image-new.webp",
        url: "/uploads/properties/property-1/image-new.webp",
      })
      .mockResolvedValueOnce(null);

    configureTransaction(transaction.client);

    await setPropertyCoverImage({
      propertyId: "property-1",
      imageId: "image-new",
    });

    expect(auditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {
          previousCover: null,
          newCover: {
            imageId: "image-new",
            filename:
              "properties/property-1/image-new.webp",
            url: "/uploads/properties/property-1/image-new.webp",
          },
        },
      }),
      transaction.client,
    );
  });

  it("propaga gli errori della transazione", async () => {
    const transactionError = new Error(
      "Aggiornamento copertina fallito.",
    );

    prismaTransactionMock.mockRejectedValueOnce(
      transactionError,
    );

    await expect(
      setPropertyCoverImage({
        propertyId: "property-1",
        imageId: "image-1",
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
    findFirst: vi.fn(),
    updateMany: vi.fn().mockResolvedValue({
      count: 1,
    }),
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
