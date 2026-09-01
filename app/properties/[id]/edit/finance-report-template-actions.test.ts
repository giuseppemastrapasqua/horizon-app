import { describe, expect, it } from "vitest";

import fs from "node:fs";
import path from "node:path";

describe("finance report template permissions", () => {
  it("richiede OWNER, MANAGER o FINANCE", () => {
    const source = fs.readFileSync(
      path.join(__dirname, "finance-report-template-actions.ts"),
      "utf8",
    );

    expect(source).toContain(
      'requirePropertyRole(propertyId, ["OWNER", "MANAGER", "FINANCE"])',
    );

    expect(source).not.toContain(
      "requirePropertyAccess",
    );
  });
});