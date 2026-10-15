import { createHash } from "node:crypto";

export function createRoss1000PayloadFingerprint(
  xml: string,
): string {
  if (!xml.trim()) {
    throw new Error(
      "ROSS1000: payload XML vuoto.",
    );
  }

  return createHash("sha256")
    .update(xml, "utf8")
    .digest("hex");
}
