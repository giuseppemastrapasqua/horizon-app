import type { Prisma } from "@prisma/client";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const propertyImageFindFirstMock = vi.hoisted(() =>
  vi.fn(),
);

const prismaTransactionMock = vi.hoisted(() =>
  vi.fn(),
);

const auditLogMock = vi.hoisted(() =>
  vi.fn(),
);

const enqueueBackgroundJobMock = vi.hoisted(() =>
  vi.fn(),
);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    propertyImage: {
      findFirst: propertyImageFindFirstMock,
    },
    $transaction: prismaTransactionMock,
  },
}));

vi.mock("@/services/audit/AuditService", () => ({
  AuditService: {
    log: auditLogMock,
  },
}));

vi.mock("@/lib/job/enqueue-background-job", () => ({
  enqueueBackgroundJob:
    enqueueBackgroundJobMock,
}));

import { deletePropertyImage } from "./delete-property-image";

describe("deletePropertyImage", () => {
  beforeEach(() => {
    propertyImageFindFirstMock.mockReset();
    prismaTransactionMock.mockReset();
    auditLogMock.mockReset();
    enqueueBackgroundJobMock.mockReset();
  });

  it("rifiuta la cancellazione quando la foto non esiste", async () => {
    propertyImageFindFirstMock.mockResolvedValueOnce(
      null,
    );

    await expect(
      deletePropertyImage({
        propertyId: "property-1",
        imageId: "image-missing",
      }),
    ).rejects.toThrow("Foto non trovata.");

    expect(
      prismaTransactionMock,
    ).not.toHaveBeenCalled();

    expect(auditLogMock).not.toHaveBeenCalled();

    expect(
      enqueueBackgroundJobMock,
    ).not.toHaveBeenCalled();
  });

  it("elimina una foto non di copertina e accoda la cancellazione storage", async () => {
    const image = {
      id: "image-1",
      filename:
        "properties/property-1/image-1.webp",
      url: "/uploads/properties/property-1/image-1.webp",
      sortOrder: 2,
      isCover: false,
    };

    propertyImageFindFirstMock.mockResolvedValueOnce(
      image,
    );

    const transaction =
      createTransactionMock();

    prismaTransactionMock.mockImplementationOnce(
      async (
        callback: (
          transactionClient: Prisma.TransactionClient,
        ) => Promise<void>,
      ) => callback(transaction.client),
    );

    await deletePropertyImage({
      propertyId: "property-1",
      imageId: "image-1",
    });

    expect(
      transaction.propertyImage.delete,
    ).toHaveBeenCalledWith({
      where: {
        id: "image-1",
      },
    });

    expect(
      transaction.propertyImage.findFirst,
    ).not.toHaveBeenCalled();

    expect(
      transaction.propertyImage.update,
    ).not.toHaveBeenCalled();

    expect(auditLogMock).toHaveBeenCalledWith(
      {
        action: "DELETE",
        propertyId: "property-1",
        entityType: "PROPERTY_PHOTO",
        entityId: "image-1",
        description:
          "Foto dell’immobile eliminata.",
        metadata: {
          filename:
            "properties/property-1/image-1.webp",
          url: "/uploads/properties/property-1/image-1.webp",
          sortOrder: 2,
          wasCover: false,
          nextCoverImageId: null,
        },
      },
      transaction.client,
    );

    expect(
      enqueueBackgroundJobMock,
    ).toHaveBeenCalledWith(
      {
        type: "STORAGE_OBJECT_DELETE",
        payload: {
          key: "properties/property-1/image-1.webp",
        },
        deduplicationKey:
          "storage-object-delete:properties/property-1/image-1.webp",
        maxAttempts: 5,
      },
      transaction.client,
    );
  });

  it("assegna una nuova copertina quando viene eliminata quella corrente", async () => {
    const image = {
      id: "cover-image",
      filename:
        "properties/property-1/cover.webp",
      url: "/uploads/properties/property-1/cover.webp",
      sortOrder: 0,
      isCover: true,
    };

    propertyImageFindFirstMock.mockResolvedValueOnce(
      image,
    );

    const transaction =
      createTransactionMock();

    transaction.propertyImage.findFirst.mockResolvedValueOnce(
      {
        id: "next-image",
      },
    );

    prismaTransactionMock.mockImplementationOnce(
      async (
        callback: (
          transactionClient: Prisma.TransactionClient,
        ) => Promise<void>,
      ) => callback(transaction.client),
    );

    await deletePropertyImage({
      propertyId: "property-1",
      imageId: "cover-image",
    });

    expect(
      transaction.propertyImage.findFirst,
    ).toHaveBeenCalledWith({
      where: {
        propertyId: "property-1",
      },
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
      select: {
        id: true,
      },
    });

    expect(
      transaction.propertyImage.update,
    ).toHaveBeenCalledWith({
      where: {
        id: "next-image",
      },
      data: {
        isCover: true,
      },
    });

    expect(auditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          wasCover: true,
          nextCoverImageId: "next-image",
        }),
      }),
      transaction.client,
    );
  });

  it("non assegna una nuova copertina quando non restano altre foto", async () => {
    propertyImageFindFirstMock.mockResolvedValueOnce({
      id: "cover-image",
      filename:
        "properties/property-1/cover.webp",
      url: "/uploads/properties/property-1/cover.webp",
      sortOrder: 0,
      isCover: true,
    });

    const transaction =
      createTransactionMock();

    transaction.propertyImage.findFirst.mockResolvedValueOnce(
      null,
    );

    prismaTransactionMock.mockImplementationOnce(
      async (
        callback: (
          transactionClient: Prisma.TransactionClient,
        ) => Promise<void>,
      ) => callback(transaction.client),
    );

    await deletePropertyImage({
      propertyId: "property-1",
      imageId: "cover-image",
    });

    expect(
      transaction.propertyImage.update,
    ).not.toHaveBeenCalled();

    expect(auditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          wasCover: true,
          nextCoverImageId: null,
        }),
      }),
      transaction.client,
    );
  });

  it("propaga gli errori della transazione", async () => {
    propertyImageFindFirstMock.mockResolvedValueOnce({
      id: "image-1",
      filename:
        "properties/property-1/image-1.webp",
      url: "/uploads/properties/property-1/image-1.webp",
      sortOrder: 0,
      isCover: false,
    });

    const transactionError = new Error(
      "Transazione fallita.",
    );

    prismaTransactionMock.mockRejectedValueOnce(
      transactionError,
    );

    await expect(
      deletePropertyImage({
        propertyId: "property-1",
        imageId: "image-1",
      }),
    ).rejects.toBe(transactionError);

    expect(auditLogMock).not.toHaveBeenCalled();

    expect(
      enqueueBackgroundJobMock,
    ).not.toHaveBeenCalled();
  });
});

function createTransactionMock() {
  const propertyImage = {
    delete: vi.fn().mockResolvedValue(undefined),
    findFirst: vi.fn(),
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
