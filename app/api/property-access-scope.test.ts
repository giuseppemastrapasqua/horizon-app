import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("property API access scope", () => {
  const files = [
    "properties/route.ts",
    "search/route.ts",
  ];

  for (const file of files) {
    it(`${file} usa getAccessiblePropertyIds`, () => {
      const source = fs.readFileSync(
        path.join(__dirname, file),
        "utf8",
      );

      expect(source).toContain(
        "getAccessiblePropertyIds",
      );

      expect(source).not.toContain(
        '"MANAGER"',
      );

      expect(source).not.toContain(
        '"FINANCE_ADMIN"',
      );
    });
  }
});