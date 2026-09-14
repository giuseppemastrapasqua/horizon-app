import { randomBytes } from "node:crypto";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  decryptDocument,
} from "@/lib/security/document-crypto";

import {
  acquireAlloggiatiWebReceipt,
  type StoredAlloggiatiWebReceipt,
} from "./acquire-receipt";

const PROPERTY_ID = "property-1";
const ACCOUNT_ID = "account-1";
const DATE = "2026-09-09";

function createKey(): string {
  return randomBytes(32).toString("base64");
}

function createPdf(): Buffer {
  return Buffer.from(
    "%PDF-1.7\nHorizon receipt\n",
    "utf8",
  );
}

function createReceipt(): StoredAlloggiatiWebReceipt {
  return {
    id: "receipt-1",
    accountId: ACCOUNT_ID,
    receiptDate:
      new Date(`${DATE}T00:00:00.000Z`),
    storageKey: "stored.hzdoc",
    filename:
      `ricevuta-alloggiati-${DATE}.pdf`,
    contentType: "application/pdf",
    fileSize: createPdf().byteLength,
    encryptionVersion: "v1",
    downloadedAt:
      new Date("2026-09-09T15:00:00.000Z"),
  };
}

function createDependencies() {
  const encryptionKey = createKey();

  const resolveAccountId =
    vi.fn(async (): Promise<string | null> => ACCOUNT_ID);

  const getReceipt =
    vi.fn(async () => ({
      date: DATE,
      pdfBase64:
        createPdf().toString("base64"),
    }));

  const findExisting =
    vi.fn(
      async (): Promise<
        StoredAlloggiatiWebReceipt | null
      > => null,
    );

  const create =
    vi.fn(async (_input: Parameters<Parameters<typeof acquireAlloggiatiWebReceipt>[1]["receiptStore"]["create"]>[0]) => createReceipt());

  const upload = vi.fn(
    async (input: {
      key: string;
      data: Uint8Array;
      contentType: string;
    }) => ({
      key: input.key,
      size: input.data.byteLength,
      contentType: input.contentType,
    }),
  );

  const remove =
    vi.fn(async (_key: string) => {});

  return {
    encryptionKey,
    resolveAccountId,
    getReceipt,
    findExisting,
    create,
    upload,
    remove,
    dependencies: {
      encryptionKey,
      resolveAccountId,
      getReceipt,
      receiptStore: {
        findExisting,
        create,
      },
      storage: {
        upload,
        read: vi.fn(),
        delete: remove,
      },
    },
  };
}

describe(
  "acquireAlloggiatiWebReceipt",
  () => {
    it(
      "scarica cifra e persiste una nuova ricevuta",
      async () => {
        const context =
          createDependencies();

        const result =
          await acquireAlloggiatiWebReceipt(
            {
              propertyId: PROPERTY_ID,
              date: DATE,
            },
            context.dependencies,
          );

        expect(result.status).toBe("CREATED");
        expect(
          context.getReceipt,
        ).toHaveBeenCalledTimes(1);
        expect(
          context.upload,
        ).toHaveBeenCalledTimes(1);
        expect(
          context.create,
        ).toHaveBeenCalledTimes(1);

        const uploadInput =
          context.upload.mock.calls[0][0];

        const decrypted =
          decryptDocument(
            uploadInput.data,
            context.encryptionKey,
          );

        expect(
          Buffer.from(decrypted).equals(
            createPdf(),
          ),
        ).toBe(true);

        expect(
          uploadInput.contentType,
        ).toBe("application/octet-stream");

        expect(uploadInput.key).toContain(
          `alloggiati-web/accounts/${ACCOUNT_ID}/receipts/${DATE}-`,
        );

        expect(
          context.create.mock.calls[0][0],
        ).toMatchObject({
          accountId: ACCOUNT_ID,
          receiptDate:
            new Date(
              `${DATE}T00:00:00.000Z`,
            ),
          contentType: "application/pdf",
          fileSize: createPdf().byteLength,
          encryptionVersion: "v1",
        });
      },
    );

    it(
      "non richiama Alloggiati Web se esiste gia",
      async () => {
        const context =
          createDependencies();

        context.findExisting
          .mockResolvedValueOnce(
            createReceipt(),
          );

        const result =
          await acquireAlloggiatiWebReceipt(
            {
              propertyId: PROPERTY_ID,
              date: DATE,
            },
            context.dependencies,
          );

        expect(result.status).toBe("EXISTING");
        expect(
          context.getReceipt,
        ).not.toHaveBeenCalled();
        expect(
          context.upload,
        ).not.toHaveBeenCalled();
        expect(
          context.create,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rifiuta una risposta non PDF",
      async () => {
        const context =
          createDependencies();

        context.getReceipt
          .mockResolvedValueOnce({
            date: DATE,
            pdfBase64:
              Buffer.from(
                "not-pdf",
              ).toString("base64"),
          });

        await expect(
          acquireAlloggiatiWebReceipt(
            {
              propertyId: PROPERTY_ID,
              date: DATE,
            },
            context.dependencies,
          ),
        ).rejects.toThrow(
          "non è un PDF valido",
        );

        expect(
          context.upload,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rifiuta una struttura senza account",
      async () => {
        const context =
          createDependencies();

        context.resolveAccountId
          .mockResolvedValueOnce(null);

        await expect(
          acquireAlloggiatiWebReceipt(
            {
              propertyId: PROPERTY_ID,
              date: DATE,
            },
            context.dependencies,
          ),
        ).rejects.toThrow(
          "non collegato",
        );

        expect(
          context.getReceipt,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "elimina il blob se il database fallisce",
      async () => {
        const context =
          createDependencies();

        context.create
          .mockRejectedValueOnce(
            new Error("database failure"),
          );

        await expect(
          acquireAlloggiatiWebReceipt(
            {
              propertyId: PROPERTY_ID,
              date: DATE,
            },
            context.dependencies,
          ),
        ).rejects.toThrow(
          "database failure",
        );

        expect(
          context.remove,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      "gestisce una race account-giorno",
      async () => {
        const context =
          createDependencies();

        context.create
          .mockRejectedValueOnce(
            new Error(
              "unique constraint",
            ),
          );

        context.findExisting
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(
            createReceipt(),
          );

        const result =
          await acquireAlloggiatiWebReceipt(
            {
              propertyId: PROPERTY_ID,
              date: DATE,
            },
            context.dependencies,
          );

        expect(result.status).toBe("EXISTING");
        expect(
          context.remove,
        ).toHaveBeenCalledTimes(1);
      },
    );
  },
);
