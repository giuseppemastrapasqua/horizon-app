import type {
  DocumentOcrInput,
  DocumentOcrProvider,
  DocumentOcrResult,
} from "./document-ocr-provider";

export class MockDocumentOcrProvider
  implements DocumentOcrProvider
{
  async extractText(
    input: DocumentOcrInput,
  ): Promise<DocumentOcrResult> {
    await new Promise((resolve) =>
      setTimeout(resolve, 500),
    );

    return {
      extractedText: [
        "=== MOCK OCR ===",
        `Documento: ${input.documentId}`,
        `File: ${input.filename ?? "Sconosciuto"}`,
        `URL: ${input.fileUrl}`,
        "",
        "Questo è un testo simulato prodotto dal provider OCR.",
      ].join("\n"),
      provider: "mock",
      providerVersion: "1.0",
      reviewRequired: false,
    };
  }
}

export const mockDocumentOcrProvider =
  new MockDocumentOcrProvider();