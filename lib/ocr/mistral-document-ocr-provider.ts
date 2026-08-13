import type {
  DocumentOcrInput,
  DocumentOcrProvider,
  DocumentOcrResult,
} from "./document-ocr-provider";

const MISTRAL_OCR_ENDPOINT =
  "https://api.mistral.ai/v1/ocr";

const MISTRAL_OCR_MODEL =
  "mistral-ocr-latest";

type MistralOcrPage = {
  index: number;
  markdown: string;
};

type MistralOcrResponse = {
  model: string;
  pages: MistralOcrPage[];
};

function isMistralOcrResponse(
  value: unknown,
): value is MistralOcrResponse {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const response =
    value as Partial<MistralOcrResponse>;

  return (
    typeof response.model === "string" &&
    Array.isArray(response.pages) &&
    response.pages.every(
      (page) =>
        typeof page === "object" &&
        page !== null &&
        typeof page.index === "number" &&
        typeof page.markdown === "string",
    )
  );
}

function getMistralApiKey(): string {
  const apiKey =
    process.env.MISTRAL_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "La variabile d'ambiente MISTRAL_API_KEY non è configurata.",
    );
  }

  return apiKey;
}

function getResponseErrorMessage(
  status: number,
  responseBody: string,
): string {
  const normalizedBody =
    responseBody.trim();

  if (!normalizedBody) {
    return `Mistral OCR ha restituito HTTP ${status}.`;
  }

  return [
    `Mistral OCR ha restituito HTTP ${status}.`,
    normalizedBody.slice(0, 1_000),
  ].join(" ");
}

export class MistralDocumentOcrProvider
  implements DocumentOcrProvider
{
  async extractText(
    input: DocumentOcrInput,
  ): Promise<DocumentOcrResult> {
    const response = await fetch(
      MISTRAL_OCR_ENDPOINT,
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${getMistralApiKey()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MISTRAL_OCR_MODEL,
          document: {
            type: "document_url",
            document_url: input.fileUrl,
          },
        }),
      },
    );

    if (!response.ok) {
      const responseBody =
        await response.text();

      throw new Error(
        getResponseErrorMessage(
          response.status,
          responseBody,
        ),
      );
    }

    const responseBody: unknown =
      await response.json();

    if (!isMistralOcrResponse(responseBody)) {
      throw new Error(
        "Mistral OCR ha restituito una risposta non valida.",
      );
    }

    const extractedText = responseBody.pages
      .sort(
        (firstPage, secondPage) =>
          firstPage.index - secondPage.index,
      )
      .map((page) => page.markdown.trim())
      .filter((pageText) => pageText.length > 0)
      .join("\n\n");

    if (!extractedText) {
      throw new Error(
        `Mistral OCR non ha estratto testo dal documento "${input.documentId}".`,
      );
    }

    return {
      extractedText,
      provider: "mistral",
      providerVersion: responseBody.model,
      reviewRequired: false,
    };
  }
}

export const mistralDocumentOcrProvider =
  new MistralDocumentOcrProvider();