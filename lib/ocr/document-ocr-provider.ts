export type DocumentOcrInput = {
  documentId: string;
  fileUrl: string;
  filename?: string;
};

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