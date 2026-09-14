import { randomUUID } from "node:crypto";

import { encryptDocument } from "@/lib/security/document-crypto";
import type { PrivateStorageProvider } from "@/lib/storage/private-storage-provider";

export type StoredAlloggiatiWebReceipt = {
  id: string;
  accountId: string;
  receiptDate: Date;
  storageKey: string;
  filename: string;
  contentType: string;
  fileSize: number;
  encryptionVersion: string;
  downloadedAt: Date;
};

export type AcquireAlloggiatiWebReceiptResult =
  | { status: "CREATED"; receipt: StoredAlloggiatiWebReceipt }
  | { status: "EXISTING"; receipt: StoredAlloggiatiWebReceipt };

type ReceiptStore = {
  findExisting(input: {
    accountId: string;
    receiptDate: Date;
  }): Promise<StoredAlloggiatiWebReceipt | null>;
  create(input: {
    accountId: string;
    receiptDate: Date;
    storageKey: string;
    filename: string;
    contentType: string;
    fileSize: number;
    encryptionVersion: string;
  }): Promise<StoredAlloggiatiWebReceipt>;
};

type AcquireReceiptDependencies = {
  resolveAccountId(propertyId: string): Promise<string | null>;
  getReceipt(input: {
    propertyId: string;
    date: string;
  }): Promise<{ date: string; pdfBase64: string }>;
  receiptStore: ReceiptStore;
  storage: PrivateStorageProvider;
  encryptionKey: string;
};

const PDF_CONTENT_TYPE = "application/pdf";
const ENCRYPTION_VERSION = "v1";

export async function acquireAlloggiatiWebReceipt(
  input: {
    propertyId: string;
    date: string;
  },
  dependencies: AcquireReceiptDependencies,
): Promise<AcquireAlloggiatiWebReceiptResult> {
  const propertyId = input.propertyId.trim();
  const date = normalizeReceiptDate(input.date);

  if (!propertyId) {
    throw new Error("Struttura non specificata.");
  }

  if (!dependencies.encryptionKey.trim()) {
    throw new Error(
      "HORIZON_DOCUMENT_ENCRYPTION_KEY non configurata.",
    );
  }

  const accountId =
    await dependencies.resolveAccountId(propertyId);

  if (!accountId) {
    throw new Error(
      "Account Alloggiati Web non collegato alla struttura.",
    );
  }

  const receiptDate = toReceiptDate(date);
  const existing =
    await dependencies.receiptStore.findExisting({
      accountId,
      receiptDate,
    });

  if (existing) {
    return {
      status: "EXISTING",
      receipt: existing,
    };
  }

  const officialReceipt =
    await dependencies.getReceipt({
      propertyId,
      date,
    });

  if (normalizeReceiptDate(officialReceipt.date) !== date) {
    throw new Error(
      "La data della ricevuta Alloggiati Web non corrisponde alla richiesta.",
    );
  }

  const pdfBytes =
    decodeAndValidatePdf(officialReceipt.pdfBase64);

  const encrypted = encryptDocument(
    pdfBytes,
    dependencies.encryptionKey,
  );

  const filename =
    `ricevuta-alloggiati-${date}.pdf`;

  const storageKey =
    `alloggiati-web/accounts/${accountId}/receipts/` +
    `${date}-${randomUUID()}.hzdoc`;

  const upload = await dependencies.storage.upload({
    key: storageKey,
    data: encrypted,
    contentType: "application/octet-stream",
  });

  try {
    const receipt =
      await dependencies.receiptStore.create({
        accountId,
        receiptDate,
        storageKey: upload.key,
        filename,
        contentType: PDF_CONTENT_TYPE,
        fileSize: pdfBytes.byteLength,
        encryptionVersion: ENCRYPTION_VERSION,
      });

    return {
      status: "CREATED",
      receipt,
    };
  } catch (error) {
    try {
      await dependencies.storage.delete(upload.key);
    } catch {
      // cleanup intentionally ignored
    }

    const winner =
      await dependencies.receiptStore.findExisting({
        accountId,
        receiptDate,
      });

    if (winner) {
      return {
        status: "EXISTING",
        receipt: winner,
      };
    }

    throw error;
  }
}

export async function acquireRuntimeAlloggiatiWebReceipt(
  input: {
    propertyId: string;
    date: string;
  },
): Promise<AcquireAlloggiatiWebReceiptResult> {
  const [
    { prisma },
    { createRuntimeAlloggiatiWebCredentialProvider },
    { AlloggiatiWebAdapter },
    { SoapPreflightAlloggiatiWebTransport },
    { defaultPrivateStorageProvider },
  ] = await Promise.all([
    import("@/lib/prisma"),
    import("./runtime-credential-provider"),
    import("./adapter"),
    import("./soap-preflight-transport"),
    import("@/lib/storage/default-private-storage-provider"),
  ]);

  const credentialProvider =
    createRuntimeAlloggiatiWebCredentialProvider();

  return acquireAlloggiatiWebReceipt(input, {
    encryptionKey:
      process.env.HORIZON_DOCUMENT_ENCRYPTION_KEY ?? "",
    storage: defaultPrivateStorageProvider,

    resolveAccountId: async (propertyId) => {
      const connection =
        await prisma.alloggiatiWebProperty.findUnique({
          where: { propertyId },
          select: { accountId: true },
        });

      return connection?.accountId ?? null;
    },

    getReceipt: async ({ propertyId, date }) => {
      const credentials =
        await credentialProvider.getCredentials({
          propertyId,
        });

      const adapter = new AlloggiatiWebAdapter(
        new SoapPreflightAlloggiatiWebTransport(),
        credentials,
      );

      return adapter.getReceipt(date);
    },

    receiptStore: {
      findExisting: ({ accountId, receiptDate }) =>
        prisma.alloggiatiWebReceipt.findUnique({
          where: {
            accountId_receiptDate: {
              accountId,
              receiptDate,
            },
          },
        }),

      create: (data) =>
        prisma.alloggiatiWebReceipt.create({
          data,
        }),
    },
  });
}

function normalizeReceiptDate(value: string): string {
  const normalized = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error(
      "Data ricevuta Alloggiati Web non valida.",
    );
  }

  const parsed =
    new Date(`${normalized}T00:00:00.000Z`);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== normalized
  ) {
    throw new Error(
      "Data ricevuta Alloggiati Web non valida.",
    );
  }

  return normalized;
}

function toReceiptDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

function decodeAndValidatePdf(
  pdfBase64: string,
): Uint8Array {
  const normalized =
    pdfBase64.replace(/\s/g, "");

  if (
    !normalized ||
    normalized.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)
  ) {
    throw new Error(
      "Ricevuta Alloggiati Web Base64 non valida.",
    );
  }

  const bytes =
    Buffer.from(normalized, "base64");

  if (
    bytes.byteLength < 5 ||
    bytes.subarray(0, 5).toString("ascii") !== "%PDF-"
  ) {
    throw new Error(
      "La ricevuta Alloggiati Web ricevuta non è un PDF valido.",
    );
  }

  return bytes;
}
