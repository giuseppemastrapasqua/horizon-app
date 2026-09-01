import {
  describe,
  expect,
  it,
} from "vitest";

import {
  AlloggiatiWebAdapter,
} from "./adapter";
import {
  MockAlloggiatiWebTransport,
} from "./mock-transport";
import {
  preflightAlloggiatiSubmission,
} from "./preflight-submission";

const credentials = {
  username: "test-user",
  password: "test-password",
  wsKey: "test-wskey",
};

const submission = {
  records: ["R".repeat(168)],
  apartmentId: "APT-123",
};

describe(
  "preflightAlloggiatiSubmission",
  () => {
    it(
      "autentica e valida senza inviare",
      async () => {
        const transport =
          new MockAlloggiatiWebTransport();

        const adapter =
          new AlloggiatiWebAdapter(
            transport,
            credentials,
          );

        const result =
          await preflightAlloggiatiSubmission(
            submission,
            adapter,
          );

        expect(result.success).toBe(true);

        expect(
          transport.authenticatedWith,
        ).toEqual([credentials]);

        expect(
          transport.validatedSubmissions,
        ).toEqual([submission]);

        expect(
          transport.submitted,
        ).toEqual([]);
      },
    );

    it(
      "blocca un preflight negativo senza inviare",
      async () => {
        const transport =
          new MockAlloggiatiWebTransport();

        transport.validationResult = {
          success: false,
          message: "Record non valido.",
        };

        const adapter =
          new AlloggiatiWebAdapter(
            transport,
            credentials,
          );

        await expect(
          preflightAlloggiatiSubmission(
            submission,
            adapter,
          ),
        ).rejects.toThrow(
          "Record non valido.",
        );

        expect(
          transport.validatedSubmissions,
        ).toEqual([submission]);

        expect(
          transport.submitted,
        ).toEqual([]);
      },
    );

    it(
      "usa un errore fail-safe senza messaggio",
      async () => {
        const transport =
          new MockAlloggiatiWebTransport();

        transport.validationResult = {
          success: false,
        };

        const adapter =
          new AlloggiatiWebAdapter(
            transport,
            credentials,
          );

        await expect(
          preflightAlloggiatiSubmission(
            submission,
            adapter,
          ),
        ).rejects.toThrow(
          "Preflight Alloggiati Web non superato.",
        );

        expect(
          transport.submitted,
        ).toEqual([]);
      },
    );
  },
);
