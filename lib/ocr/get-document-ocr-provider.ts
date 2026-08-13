import type { DocumentOcrProvider } from "./document-ocr-provider";
import { mistralDocumentOcrProvider } from "./mistral-document-ocr-provider";
import { mockDocumentOcrProvider } from "./mock-document-ocr-provider";

type DocumentOcrProviderName =
  | "mock"
  | "mistral";

function getConfiguredProviderName(): DocumentOcrProviderName {
  const providerName =
    process.env.DOCUMENT_OCR_PROVIDER
      ?.trim()
      .toLowerCase();

  if (!providerName || providerName === "mock") {
    return "mock";
  }

  if (providerName === "mistral") {
    return "mistral";
  }

  throw new Error(
    `Provider OCR non supportato: "${providerName}".`,
  );
}

export function getDocumentOcrProvider(): DocumentOcrProvider {
  const providerName =
    getConfiguredProviderName();

  switch (providerName) {
    case "mock":
      return mockDocumentOcrProvider;

    case "mistral":
      return mistralDocumentOcrProvider;
  }
}