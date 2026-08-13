import type { Prisma } from "@prisma/client";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const propertyFindUniqueMock = vi.hoisted(() =>
  vi.fn(),
);

const prismaTransactionMock = vi.hoisted(() =>
  vi.fn(),
);

const uploadPropertyImageMock = vi.hoisted(() =>
  vi.fn(),
);

const storageDeleteMock = vi.hoisted(() =>
  vi.fn(),
);

const auditLogMock = vi.hoisted(() =>
  vi.fn(),
);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: {
      findUnique: propertyFindUniqueMock,
    },
    $transaction: prismaTransactionMock,
  },
}));

vi.mock(
  "@/lib/properties/upload-property-image",
  () => ({
    uploadPropertyImage:
      uploadPropertyImageMock,
  }),
);

vi.mock(
  "@/lib/storage/default-storage-provider",
  () => ({
    defaultStorageProvider: {
      upload: vi.fn(),
      delete: storageDeleteMock,
    },
  }),
);

vi.mock("@/services/audit/AuditService", () => ({
  AuditService: {
    log: auditLogMock,
  },
}));

import { createPropertyImage } from "./create-property-image";

describe("createPropertyImage", () => {
  beforeEach(() => {
    propertyFindUniqueMock.mockReset();
    prismaTransactionMock.mockReset();
    uploadPropertyImageMock.mockReset();
    storageDeleteMock.mockReset();
    auditLogMock.mockReset();

    storageDeleteMock.mockResolvedValue(undefined);
  });

  it("rifiuta la creazione quando l'immobile non esiste", async () => {
    propertyFindUniqueMock.mockResolvedValueOnce(
      null,
    );

    const file = createImageFile();

    await expect(
      createPropertyImage({
        propertyId: "property-missing",
        file,
      }),
    ).rejects.toThrow("Immobile non trovato.");

    expect(
      uploadPropertyImageMock,
    ).not.toHaveBeenCalled();

    expect(
      prismaTransactionMock,
    ).not.toHaveBeenCalled();

    expect(auditLogMock).not.toHaveBeenCalled();

    expect(
      storageDeleteMock,
    ).not.toHaveBeenCalled();
  });

  it("crea la prima immagine come copertina", async () => {
    propertyFindUniqueMock.mockResolvedValueOnce({
      id: "property-1",
    });

    uploadPropertyImageMock.mockResolvedValueOnce({
      key: "properties/property-1/image-1.webp",
      url: "/uploads/properties/property-1/image-1.webp",
      size: 1024,
      contentType: "image/webp",
    });

    const transaction =
      createTransactionMock();

    transaction.propertyImage.count.mockResolvedValueOnce(
      0,
    );

    transaction.propertyImage.aggregate.mockResolvedValueOnce({
      _max: {
        sortOrder: null,
      },
    });

    transaction.propertyImage.create.mockResolvedValueOnce({
      id: "image-1",
      url: "/uploads/properties/property-1/image-1.webp",
      filename:
        "properties/property-1/image-1.webp",
      sortOrder: 0,
      isCover: true,
    });

    prismaTransactionMock.mockImplementationOnce(
      async (
        callback: (
          transactionClient: Prisma.TransactionClient,
        ) => Promise<unknown>,
      ) => callback(transaction.client),
    );

    const file = createImageFile();

    const result = await createPropertyImage({
      propertyId: "property-1",
      file,
    });

    expect(
      uploadPropertyImageMock,
    ).toHaveBeenCalledWith({
      propertyId: "property-1",
      file,
    });

    expect(
      transaction.propertyImage.create,
    ).toHaveBeenCalledWith({
      data: {
        propertyId: "property-1",
        url: "/uploads/properties/property-1/image-1.webp",
        filename:
          "properties/property-1/image-1.webp",
        sortOrder: 0,
        isCover: true,
      },
      select: {
        id: true,
        url: true,
        filename: true,
        sortOrder: true,
        isCover: true,
      },
    });

    expect(result).toEqual({
      imageId: "image-1",
      url: "/uploads/properties/property-1/image-1.webp",
      filename:
        "properties/property-1/image-1.webp",
      sortOrder: 0,
      isCover: true,
    });

    expect(
      storageDeleteMock,
    ).not.toHaveBeenCalled();
  });

  it("assegna l'ordine successivo alle immagini esistenti", async () => {
    propertyFindUniqueMock.mockResolvedValueOnce({
      id: "property-1",
    });

    uploadPropertyImageMock.mockResolvedValueOnce({
      key: "properties/property-1/image-3.webp",
      url: "/uploads/properties/property-1/image-3.webp",
      size: 2048,
      contentType: "image/webp",
    });

    const transaction =
      createTransactionMock();

    transaction.propertyImage.count.mockResolvedValueOnce(
      2,
    );

    transaction.propertyImage.aggregate.mockResolvedValueOnce({
      _max: {
        sortOrder: 4,
      },
    });

    transaction.propertyImage.create.mockResolvedValueOnce({
      id: "image-3",
      url: "/uploads/properties/property-1/image-3.webp",
      filename:
        "properties/property-1/image-3.webp",
      sortOrder: 5,
      isCover: false,
    });

    prismaTransactionMock.mockImplementationOnce(
      async (
        callback: (
          transactionClient: Prisma.TransactionClient,
        ) => Promise<unknown>,
      ) => callback(transaction.client),
    );

    const file = createImageFile();

    const result = await createPropertyImage({
      propertyId: "property-1",
      file,
    });

    expect(
      transaction.propertyImage.create,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sortOrder: 5,
          isCover: false,
        }),
      }),
    );

    expect(result).toEqual(
      expect.objectContaining({
        sortOrder: 5,
        isCover: false,
      }),
    );
  });

  it("registra l'audit nella stessa transazione", async () => {
    propertyFindUniqueMock.mockResolvedValueOnce({
      id: "property-1",
    });

    uploadPropertyImageMock.mockResolvedValueOnce({
      key: "properties/property-1/image-1.webp",
      url: "/uploads/properties/property-1/image-1.webp",
      size: 1024,
      contentType: "image/webp",
    });

    const transaction =
      createTransactionMock();

    transaction.propertyImage.count.mockResolvedValueOnce(
      0,
    );

    transaction.propertyImage.aggregate.mockResolvedValueOnce({
      _max: {
        sortOrder: null,
      },
    });

    transaction.propertyImage.create.mockResolvedValueOnce({
      id: "image-1",
      url: "/uploads/properties/property-1/image-1.webp",
      filename:
        "properties/property-1/image-1.webp",
      sortOrder: 0,
      isCover: true,
    });

    prismaTransactionMock.mockImplementationOnce(
      async (
        callback: (
          transactionClient: Prisma.TransactionClient,
        ) => Promise<unknown>,
      ) => callback(transaction.client),
    );

    const file = createImageFile();

    await createPropertyImage({
      propertyId: "property-1",
      file,
    });

    expect(auditLogMock).toHaveBeenCalledWith(
      {
        action: "CREATE",
        propertyId: "property-1",
        entityType: "PROPERTY_PHOTO",
        entityId: "image-1",
        description:
          "Nuova foto dell’immobile caricata.",
        metadata: {
          filename:
            "properties/property-1/image-1.webp",
          url: "/uploads/properties/property-1/image-1.webp",
          sortOrder: 0,
          isCover: true,
          originalFilename: "photo.webp",
          mimeType: "image/webp",
          size: file.size,
        },
      },
      transaction.client,
    );
  });

  it("elimina il file caricato quando la transazione fallisce", async () => {
    propertyFindUniqueMock.mockResolvedValueOnce({
      id: "property-1",
    });

    uploadPropertyImageMock.mockResolvedValueOnce({
      key: "properties/property-1/image-1.webp",
      url: "/uploads/properties/property-1/image-1.webp",
      size: 1024,
      contentType: "image/webp",
    });

    const transactionError = new Error(
      "Creazione database fallita.",
    );

    prismaTransactionMock.mockRejectedValueOnce(
      transactionError,
    );

    const file = createImageFile();

    await expect(
      createPropertyImage({
        propertyId: "property-1",
        file,
      }),
    ).rejects.toBe(transactionError);

    expect(
      storageDeleteMock,
    ).toHaveBeenCalledOnce();

    expect(
      storageDeleteMock,
    ).toHaveBeenCalledWith(
      "properties/property-1/image-1.webp",
    );
  });

  it("mantiene l'errore originale se anche il rollback storage fallisce", async () => {
    propertyFindUniqueMock.mockResolvedValueOnce({
      id: "property-1",
    });

    uploadPropertyImageMock.mockResolvedValueOnce({
      key: "properties/property-1/image-1.webp",
      url: "/uploads/properties/property-1/image-1.webp",
      size: 1024,
      contentType: "image/webp",
    });

    const transactionError = new Error(
      "Creazione database fallita.",
    );

    prismaTransactionMock.mockRejectedValueOnce(
      transactionError,
    );

    storageDeleteMock.mockRejectedValueOnce(
      new Error("Rollback storage fallito."),
    );

    await expect(
      createPropertyImage({
        propertyId: "property-1",
        file: createImageFile(),
      }),
    ).rejects.toBe(transactionError);

    expect(
      storageDeleteMock,
    ).toHaveBeenCalledOnce();
  });
});

function createImageFile(): File {
  return new File(
    [new Uint8Array([1, 2, 3])],
    "photo.webp",
    {
      type: "image/webp",
    },
  );
}

function createTransactionMock() {
  const propertyImage = {
    count: vi.fn(),
    aggregate: vi.fn(),
    create: vi.fn(),
  };

  const client = {
    propertyImage,
  } as unknown as Prisma.TransactionClient;

  return {
    client,
    propertyImage,
  };
}
