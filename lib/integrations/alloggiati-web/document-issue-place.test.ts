import { describe, expect, it } from "vitest";

import { resolveDocumentIssuePlaceCode } from "./document-issue-place";
import { MockAlloggiatiReferenceResolver } from "./mock-reference-resolver";

describe("resolveDocumentIssuePlaceCode", () => {
  const resolver = new MockAlloggiatiReferenceResolver(
    {
      ITALIA: "IT-CODE",
      FRANCIA: "FR-CODE",
    },
    {
      Milano: "MI-CODE",
    },
  );

  it("usa il comune per un documento italiano", async () => {
    expect(
      await resolveDocumentIssuePlaceCode(
        {
          country: "ITALIA",
          city: "Milano",
        },
        resolver,
      ),
    ).toBe("MI-CODE");
  });

  it("usa lo stato per un documento estero", async () => {
    expect(
      await resolveDocumentIssuePlaceCode(
        {
          country: "FRANCIA",
        },
        resolver,
      ),
    ).toBe("FR-CODE");
  });

  it("richiede il comune per un documento italiano", async () => {
    await expect(
      resolveDocumentIssuePlaceCode(
        {
          country: "ITALIA",
        },
        resolver,
      ),
    ).rejects.toThrow(
      "Comune di rilascio documento obbligatorio per l'Italia.",
    );
  });

  it("blocca uno stato estero non risolto", async () => {
    await expect(
      resolveDocumentIssuePlaceCode(
        {
          country: "SCONOSCIUTO",
        },
        resolver,
      ),
    ).rejects.toThrow(
      "Riferimento Alloggiati non risolto: stato di rilascio documento.",
    );
  });
});
