export type PrivateStorageUploadInput = {
  key: string;
  data: Uint8Array;
  contentType: string;
};

export type PrivateStorageUploadResult = {
  key: string;
  size: number;
  contentType: string;
};

export interface PrivateStorageProvider {
  upload(
    input: PrivateStorageUploadInput,
  ): Promise<PrivateStorageUploadResult>;

  read(key: string): Promise<Uint8Array>;

  delete(key: string): Promise<void>;
}
