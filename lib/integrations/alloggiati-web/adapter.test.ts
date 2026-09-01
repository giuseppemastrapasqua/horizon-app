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

const credentials = {
  username: "test-user",
  password: "test-password",
  wsKey: "test-wskey",
};

describe("AlloggiatiWebAdapter", () => {
  it("valida una trasmissione tramite il transport", async () => {
    const transport =
      new MockAlloggiatiWebTransport();

    const adapter =
      new AlloggiatiWebAdapter(
        transport,
        credentials,
      );

    const result =
      await adapter.validateSubmission({
        records: ["record-1"],
        apartmentId: "APT-1",
      });

    expect(result.success).toBe(true);

    expect(
      transport.validatedSubmissions,
    ).toEqual([
      {
        records: ["record-1"],
        apartmentId: "APT-1",
      },
    ]);
  });

  it("invia una trasmissione tramite il transport", async () => {
    const transport =
      new MockAlloggiatiWebTransport();

    const adapter =
      new AlloggiatiWebAdapter(
        transport,
        credentials,
      );

    const result = await adapter.submit({
      records: ["record-1"],
    });

    expect(result).toEqual({
      success: true,
      resultCode: "MOCK_OK",
    });

    expect(transport.submitted).toEqual([
      {
        records: ["record-1"],
      },
    ]);
  });

  it("recupera una ricevuta", async () => {
    const transport =
      new MockAlloggiatiWebTransport();

    const adapter =
      new AlloggiatiWebAdapter(
        transport,
        credentials,
      );

    const result =
      await adapter.getReceipt(
        "2026-09-01",
      );

    expect(result.date).toBe(
      "2026-09-01",
    );

    expect(result.pdfBase64).toBe(
      "bW9jay1wZGY=",
    );

    expect(transport.receiptDates).toEqual([
      "2026-09-01",
    ]);
  });

  it("blocca una trasmissione senza record", async () => {
    const transport =
      new MockAlloggiatiWebTransport();

    const adapter =
      new AlloggiatiWebAdapter(
        transport,
        credentials,
      );

    await expect(
      adapter.submit({
        records: [],
      }),
    ).rejects.toThrow(
      "La trasmissione Alloggiati Web non contiene record.",
    );

    expect(transport.submitted).toEqual(
      [],
    );
  });

  it("blocca credenziali incomplete", () => {
    const transport =
      new MockAlloggiatiWebTransport();

    expect(
      () =>
        new AlloggiatiWebAdapter(
          transport,
          {
            username: "",
            password: "password",
            wsKey: "wskey",
          },
        ),
    ).toThrow(
      "Username Alloggiati Web obbligatorio.",
    );
  });
});