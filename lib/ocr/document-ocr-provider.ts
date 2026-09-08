type DocumentOcrSource =
  | {
      sourceType: "url";
      fileUrl: string;
    }
  | {
      sourceType: "data";
      dataUrl: string;
      contentType: string;
    };

export type DocumentOcrInput = {
  documentId: string;
  filename?: string;
} & DocumentOcrSource;

export type DocumentOcrResult = {
  extractedText: string;
  provider: string;
  providerVersion?: string;
  reviewRequired: boolean;
};

export interface DocumentOcrProvider {
  extractText(
    input: DocumentOcrInput,
  ): Promise<DocumentOcrResult>;
}
