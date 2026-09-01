import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("finance formula access", () => {
  it("limita ALL_PROPERTIES a SUPER_ADMIN e FINANCE_ADMIN", () => {
    const collection = fs.readFileSync(
      path.join(__dirname, "formulas/route.ts"),
      "utf8",
    );

    const detail = fs.readFileSync(
      path.join(
        __dirname,
        "formulas/[formulaId]/route.ts",
      ),
      "utf8",
    );

    expect(collection).not.toContain(
      '"MANAGER"',
    );

    expect(detail).not.toContain(
      '"MANAGER"',
    );

    expect(collection).toContain(
      '"FINANCE_ADMIN"',
    );

    expect(detail).toContain(
      '"FINANCE_ADMIN"',
    );
  });

  it("filtra le formule globali nel GET collection", () => {
    const collection = fs.readFileSync(
      path.join(__dirname, "formulas/route.ts"),
      "utf8",
    );

    expect(collection).toContain(
      "const hasGlobalAccess =",
    );

    expect(collection).toContain(
      "ids === null",
    );

    expect(collection).toContain(
      "propertyId: null",
    );
  });
});