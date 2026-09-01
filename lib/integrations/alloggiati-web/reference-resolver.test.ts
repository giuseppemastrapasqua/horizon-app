import { describe, expect, it } from "vitest";

import { MockAlloggiatiReferenceResolver } from "./mock-reference-resolver";
import { requireReferenceCode } from "./reference-resolver";

describe("AlloggiatiReferenceResolver", () => {
  const resolver = new MockAlloggiatiReferenceResolver(
    {
      ITALIA: "100000100",
    },
    {
      "Milano|MI": "015146",
    },
    {
      IDENTITY_CARD: "IDENT",
    },
  );

  it("risolve uno stato", async () => {
    expect(
      await resolver.resolveCountryCode("ITALIA"),
    ).toBe("100000100");
  });

  it("risolve un comune con provincia", async () => {
    expect(
      await resolver.resolveMunicipalityCode("Milano", "MI"),
    ).toBe("015146");
  });

  it("risolve un tipo documento", async () => {
    expect(
      await resolver.resolveDocumentTypeCode("IDENTITY_CARD"),
    ).toBe("IDENT");
  });

  it("restituisce null per riferimenti sconosciuti", async () => {
    expect(
      await resolver.resolveCountryCode("SCONOSCIUTO"),
    ).toBeNull();
  });

  it("blocca un riferimento obbligatorio non risolto", async () => {
    await expect(
      requireReferenceCode(
        resolver.resolveCountryCode("SCONOSCIUTO"),
        "stato di nascita",
      ),
    ).rejects.toThrow(
      "Riferimento Alloggiati non risolto: stato di nascita.",
    );
  });
});
