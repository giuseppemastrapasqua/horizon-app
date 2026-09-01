import {
  describe,
  expect,
  it,
} from "vitest";

import {
  TableAlloggiatiReferenceResolver,
} from "./table-reference-resolver";

function createResolver() {
  return new TableAlloggiatiReferenceResolver({
    countries: [
      {
        code: "COUNTRY-IT",
        name: "Italia",
        isItaly: true,
      },
      {
        code: "COUNTRY-FR",
        name: "Francia",
      },
    ],
    municipalities: [
      {
        code: "CITY-MI",
        name: "Milano",
        province: "MI",
      },
      {
        code: "CITY-RM",
        name: "Roma",
        province: "RM",
      },
      {
        code: "CITY-XX-1",
        name: "Comune Doppio",
        province: "AA",
      },
      {
        code: "CITY-XX-2",
        name: "Comune Doppio",
        province: "BB",
      },
    ],
    documentTypes: [
      {
        code: "DOC-ID",
        name: "Carta Identita",
      },
      {
        code: "DOC-PASS",
        name: "Passaporto",
      },
    ],
  });
}

describe(
  "TableAlloggiatiReferenceResolver",
  () => {
    it(
      "risolve stati ignorando maiuscole e spazi",
      async () => {
        const resolver = createResolver();

        expect(
          await resolver.resolveCountryCode(
            "  italia  ",
          ),
        ).toBe("COUNTRY-IT");
      },
    );

    it(
      "identifica Italia dai reference data",
      async () => {
        const resolver = createResolver();

        expect(
          await resolver.isItaly("ITALIA"),
        ).toBe(true);

        expect(
          await resolver.isItaly("Francia"),
        ).toBe(false);
      },
    );

    it(
      "risolve un comune con provincia",
      async () => {
        const resolver = createResolver();

        expect(
          await resolver.resolveMunicipalityCode(
            "milano",
            "mi",
          ),
        ).toBe("CITY-MI");
      },
    );

    it(
      "non sceglie un comune ambiguo senza provincia",
      async () => {
        const resolver = createResolver();

        expect(
          await resolver.resolveMunicipalityCode(
            "Comune Doppio",
          ),
        ).toBeNull();
      },
    );

    it(
      "risolve un comune univoco senza provincia",
      async () => {
        const resolver = createResolver();

        expect(
          await resolver.resolveMunicipalityCode(
            "Roma",
          ),
        ).toBe("CITY-RM");
      },
    );

    it(
      "risolve un tipo documento",
      async () => {
        const resolver = createResolver();

        expect(
          await resolver.resolveDocumentTypeCode(
            "  passaporto ",
          ),
        ).toBe("DOC-PASS");
      },
    );

    it(
      "restituisce null per riferimenti sconosciuti",
      async () => {
        const resolver = createResolver();

        expect(
          await resolver.resolveCountryCode(
            "Sconosciuto",
          ),
        ).toBeNull();

        expect(
          await resolver.resolveDocumentTypeCode(
            "Sconosciuto",
          ),
        ).toBeNull();
      },
    );
  },
);
