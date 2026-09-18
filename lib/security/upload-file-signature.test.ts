import { describe, expect, it } from "vitest";

import { detectSupportedUploadType } from "./upload-file-signature";

describe("detectSupportedUploadType", () => {
  it("riconosce un PDF dalla firma", () => {
    const bytes = new Uint8Array([
      0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37,
    ]);

    expect(detectSupportedUploadType(bytes)).toBe(
      "application/pdf",
    );
  });

  it("riconosce un JPEG dalla firma", () => {
    const bytes = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0,
    ]);

    expect(detectSupportedUploadType(bytes)).toBe(
      "image/jpeg",
    );
  });

  it("riconosce un PNG dalla firma completa", () => {
    const bytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47,
      0x0d, 0x0a, 0x1a, 0x0a,
    ]);

    expect(detectSupportedUploadType(bytes)).toBe(
      "image/png",
    );
  });

  it("riconosce un WebP dal contenitore RIFF/WEBP", () => {
    const bytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46,
      0x00, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50,
    ]);

    expect(detectSupportedUploadType(bytes)).toBe(
      "image/webp",
    );
  });

  it("rifiuta byte non riconosciuti", () => {
    const bytes = new TextEncoder().encode(
      "<script>alert('x')</script>",
    );

    expect(detectSupportedUploadType(bytes)).toBeNull();
  });

  it("rifiuta firme incomplete", () => {
    expect(
      detectSupportedUploadType(
        new Uint8Array([0x89, 0x50, 0x4e]),
      ),
    ).toBeNull();
  });
});
