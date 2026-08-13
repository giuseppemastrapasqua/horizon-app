export type StorageUploadInput = {
  key: string;
  data: Uint8Array;
  contentType: string;
};

export type StorageUploadResult = {
  key: string;
  url: string;
  size: number;
  contentType: string;
};

export interface StorageProvider {
  upload(input: StorageUploadInput): Promise<StorageUploadResult>;
  delete(key: string): Promise<void>;
}