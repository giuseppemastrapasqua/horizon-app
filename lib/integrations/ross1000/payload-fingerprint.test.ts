import { describe, expect, it } from "vitest";

import {
  createRoss1000PayloadFingerprint,
} from "./payload-fingerprint";

describe("createRoss1000PayloadFingerprint", () => {
  it("returns a stable SHA-256 fingerprint", () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?><movimenti />';

    const first =
      createRoss1000PayloadFingerprint(xml);
    const second =
      createRoss1000PayloadFingerprint(xml);

    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });

  it("changes when the XML payload changes", () => {
    expect(
      createRoss1000PayloadFingerprint("<a>1</a>"),
    ).not.toBe(
      createRoss1000PayloadFingerprint("<a>2</a>"),
    );
  });

  it("rejects an empty XML payload", () => {
    expect(() =>
      createRoss1000PayloadFingerprint("   "),
    ).toThrow("ROSS1000: payload XML vuoto.");
  });
});
