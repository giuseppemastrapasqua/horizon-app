import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  PublicAlloggiatiReferenceProvider,
  type AlloggiatiPublicFetch,
} from "./public-reference-provider";

const municipalities = [
  "Codice,Descrizione,Provincia,DataFineVal",
  "M001,Milano,MI,",
].join("\r\n");

const countries = [
  "Codice,Descrizione,Provincia,DataFineVal",
  "100000100,Italia,ES,",
  "S001,Francia,ES,",
].join("\r\n");

const documents = [
  "Codice,Descrizione",
  "IDENT,Carta di identita",
].join("\r\n");

function createFetch() {
  return vi.fn<AlloggiatiPublicFetch>(
    async (url) => {
      let body: string;

      if (url.includes("N=COMUNI")) {
        body = municipalities;
      } else if (url.includes("N=STATI")) {
        body = countries;
      } else if (
        url.includes("N=DOCUMENTI")
      ) {
        body = documents;
      } else {
        return {
          ok: false,
          status: 404,
          text: async () => "",
        };
      }

      return {
        ok: true,
        status: 200,
        text: async () => body,
      };
    },
  );
}

describe(
  "PublicAlloggiatiReferenceProvider",
  () => {
    it(
      "carica le tre tabelle e crea il resolver",
      async () => {
        const fetchFn = createFetch();

        const provider =
          new PublicAlloggiatiReferenceProvider({
            fetch: fetchFn,
          });

        const resolver =
          await provider.getResolver();

        expect(fetchFn).toHaveBeenCalledTimes(3);

        expect(
          await resolver.resolveMunicipalityCode(
            "Milano",
            "MI",
          ),
        ).toBe("M001");

        expect(
          await resolver.resolveCountryCode(
            "Italia",
          ),
        ).toBe("100000100");

        expect(
          await resolver.isItaly("Italia"),
        ).toBe(true);

        expect(
          await resolver.resolveDocumentTypeCode(
            "Carta di identita",
          ),
        ).toBe("IDENT");
      },
    );

    it(
      "riutilizza la cache entro il TTL",
      async () => {
        const fetchFn = createFetch();

        let now = 1_000;

        const provider =
          new PublicAlloggiatiReferenceProvider({
            fetch: fetchFn,
            ttlMs: 10_000,
            now: () => now,
          });

        const first =
          await provider.getResolver();

        now = 5_000;

        const second =
          await provider.getResolver();

        expect(second).toBe(first);
        expect(fetchFn).toHaveBeenCalledTimes(3);
      },
    );

    it(
      "ricarica le tabelle dopo il TTL",
      async () => {
        const fetchFn = createFetch();

        let now = 1_000;

        const provider =
          new PublicAlloggiatiReferenceProvider({
            fetch: fetchFn,
            ttlMs: 1_000,
            now: () => now,
          });

        await provider.getResolver();

        now = 2_001;

        await provider.getResolver();

        expect(fetchFn).toHaveBeenCalledTimes(6);
      },
    );

    it(
      "fallisce se una tabella non e disponibile",
      async () => {
        const fetchFn =
          vi.fn<AlloggiatiPublicFetch>(
            async (url) => ({
              ok:
                !url.includes("N=STATI"),
              status:
                url.includes("N=STATI")
                  ? 503
                  : 200,
              text: async () =>
                url.includes("N=COMUNI")
                  ? municipalities
                  : documents,
            }),
          );

        const provider =
          new PublicAlloggiatiReferenceProvider({
            fetch: fetchFn,
          });

        await expect(
          provider.getResolver(),
        ).rejects.toThrow(
          "Download tabella Alloggiati STATI fallito: HTTP 503.",
        );
      },
    );

    it(
      "non mette in cache un caricamento fallito",
      async () => {
        let fail = true;

        const fetchFn =
          vi.fn<AlloggiatiPublicFetch>(
            async (url) => {
              if (
                fail &&
                url.includes("N=STATI")
              ) {
                return {
                  ok: false,
                  status: 503,
                  text: async () => "",
                };
              }

              const body =
                url.includes("N=COMUNI")
                  ? municipalities
                  : url.includes("N=STATI")
                    ? countries
                    : documents;

              return {
                ok: true,
                status: 200,
                text: async () => body,
              };
            },
          );

        const provider =
          new PublicAlloggiatiReferenceProvider({
            fetch: fetchFn,
          });

        await expect(
          provider.getResolver(),
        ).rejects.toThrow();

        fail = false;

        const resolver =
          await provider.getResolver();

        expect(
          await resolver.isItaly("Italia"),
        ).toBe(true);

        expect(fetchFn).toHaveBeenCalledTimes(6);
      },
    );
  },
);
