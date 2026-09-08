import { describe, expect, it } from "vitest";

import { getPrivateStorageConfig } from "./private-storage-config";

describe("private storage config", () => {
  it("usa local come default", () => {
    expect(getPrivateStorageConfig({ NODE_ENV: "test" })).toEqual({
      provider: "local",
    });
  });

  it("usa PRIVATE_STORAGE_PROVIDER prima di STORAGE_PROVIDER", () => {
    expect(getPrivateStorageConfig({
      NODE_ENV: "test",
      PRIVATE_STORAGE_PROVIDER: "local",
      STORAGE_PROVIDER: "supabase",
      HORIZON_PRIVATE_STORAGE_DIR: "C:\\private-documents",
    })).toEqual({
      provider: "local",
      rootDirectory: "C:\\private-documents",
    });
  });

  it("richiede un bucket Supabase privato separato", () => {
    expect(() => getPrivateStorageConfig({
      NODE_ENV: "test",
      PRIVATE_STORAGE_PROVIDER: "supabase",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SECRET_KEY: "secret",
      SUPABASE_STORAGE_BUCKET: "public-files",
    })).toThrow("SUPABASE_PRIVATE_STORAGE_BUCKET");
  });

  it("legge la configurazione Supabase privata", () => {
    expect(getPrivateStorageConfig({
      NODE_ENV: "test",
      PRIVATE_STORAGE_PROVIDER: "supabase",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SECRET_KEY: "secret",
      SUPABASE_PRIVATE_STORAGE_BUCKET: "private-documents",
    })).toEqual({
      provider: "supabase",
      url: "https://example.supabase.co",
      secretKey: "secret",
      bucket: "private-documents",
    });
  });
});

