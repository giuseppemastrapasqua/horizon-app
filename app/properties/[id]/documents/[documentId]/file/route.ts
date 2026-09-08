import { requirePropertyRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { decryptDocument } from "@/lib/security/document-crypto";
import { defaultPrivateStorageProvider } from "@/lib/storage/default-private-storage-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DOCUMENT_ENCRYPTION_KEY_ENV =
  "HORIZON_DOCUMENT_ENCRYPTION_KEY";

type RouteContext = {
  params: Promise<{
    id: string;
    documentId: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  const { id, documentId } = await context.params;
  const propertyId = id.trim();
  const normalizedDocumentId = documentId.trim();

  if (!propertyId || !normalizedDocumentId) {
    return new Response("Identificativo documento non valido.", {
      status: 400,
    });
  }

  await requirePropertyRole(propertyId, [
    "OWNER",
    "MANAGER",
  ]);

  const document =
    await prisma.propertyDocument.findFirst({
      where: {
        id: normalizedDocumentId,
        propertyId,
      },
      select: {
        storageKey: true,
        filename: true,
        contentType: true,
        encryptionVersion: true,
      },
    });

  if (!document) {
    return new Response("Documento non trovato.", {
      status: 404,
    });
  }

  if (!document.storageKey) {
    return new Response(
      "Il documento non dispone di un allegato protetto.",
      { status: 404 },
    );
  }

  if (
    document.encryptionVersion &&
    document.encryptionVersion !== "v1"
  ) {
    return new Response(
      "Versione di cifratura documento non supportata.",
      { status: 422 },
    );
  }

  const encryptionKey =
    process.env[DOCUMENT_ENCRYPTION_KEY_ENV];

  if (!encryptionKey?.trim()) {
    console.error(
      `${DOCUMENT_ENCRYPTION_KEY_ENV} non configurata.`,
    );
    return new Response(
      "Impossibile aprire il documento.",
      { status: 500 },
    );
  }

  try {
    const encrypted =
      await defaultPrivateStorageProvider.read(
        document.storageKey,
      );

    const plaintext = decryptDocument(
      encrypted,
      encryptionKey,
    );

    const filename =
      document.filename?.trim() || "documento";
    const encodedFilename = encodeURIComponent(filename)
      .replace(/['()]/g, escape)
      .replace(/\*/g, "%2A");

    return new Response(Buffer.from(plaintext), {
      status: 200,
      headers: {
        "Content-Type":
          document.contentType ||
          "application/octet-stream",
        "Content-Disposition":
          `inline; filename*=UTF-8''${encodedFilename}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error(
      "Impossibile leggere il documento protetto.",
      error,
    );

    return new Response(
      "Impossibile aprire il documento.",
      { status: 500 },
    );
  }
}
