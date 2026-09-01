import {
  describe,
  expect,
  it,
} from "vitest";

import fs from "node:fs";
import path from "node:path";

const files = [
  "actions.ts",
  "amenity-actions.ts",
  "check-in-actions.ts",
  "house-rule-actions.ts",
  "rate-plan-actions.ts",
  "integration-actions.ts",
  "photo-actions.ts",
  "property-document-actions.ts",
];

describe("property configuration permissions", () => {
  for (const file of files) {
    it(`${file} richiede OWNER o MANAGER`, () => {
      const source = fs.readFileSync(
        path.join(__dirname, file),
        "utf8",
      );

      expect(source).toContain(
        'requirePropertyRole(propertyId, ["OWNER", "MANAGER"])',
      );

      expect(source).not.toContain(
        "requirePropertyAccess",
      );
    });
  }
});