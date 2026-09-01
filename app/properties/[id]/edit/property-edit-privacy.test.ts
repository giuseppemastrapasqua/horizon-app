import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("property edit privacy", () => {
  it("protegge directory utenti e responsabili operativi", () => {
    const source = fs.readFileSync(
      path.join(__dirname, "page.tsx"),
      "utf8",
    );

    expect(source).toContain(
      'hasPropertyRole(',
    );

    expect(source).toContain(
      '["OWNER", "MANAGER"]',
    );

    expect(source).toContain(
      "const [activeUsers, taskAssignments] = canManageProperty",
    );

    expect(source).toContain(
      "{canManageProperty && (",
    );

    expect(source).toContain(
      'id="responsabili-operativi"',
    );
  });
});