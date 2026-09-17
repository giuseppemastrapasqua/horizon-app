import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  encryptCredential,
} from "@/lib/security/credential-crypto";

import {
  PrismaSoggiorniamoCredentialProvider,
} from "./prisma-credential-provider";

const TEST_KEY = Buffer.alloc(
  32,
  7,
).toString("base64");

describe("PrismaSoggiorniamoCredentialProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("decifra il Codice Auth memorizzato", async () => {
    const store = {
      findByPropertyId: vi.fn().mockResolvedValue({
        authCodeEncrypted: encryptCredential(
          "AUTH-TEST-NON-REALE",
          TEST_KEY,
        ),
        keyVersion: 1,
      }),
    };

    const provider =
      new PrismaSoggiorniamoCredentialProvider(
        store,
        TEST_KEY,
      );

    await expect(
      provider.getCredentials({
        propertyId: "property-1",
      }),
    ).resolves.toEqual({
      authCode: "AUTH-TEST-NON-REALE",
    });

    expect(
      store.findByPropertyId,
    ).toHaveBeenCalledWith("property-1");
  });

  it("rifiuta una struttura non configurata", async () => {
    const store = {
      findByPropertyId: vi.fn().mockResolvedValue(null),
    };

    const provider =
      new PrismaSoggiorniamoCredentialProvider(
        store,
        TEST_KEY,
      );

    await expect(
      provider.getCredentials({
        propertyId: "property-1",
      }),
    ).rejects.toThrow(
      "Soggiorniamo non configurato per la struttura.",
    );
  });

  it("rifiuta una keyVersion non supportata", async () => {
    const store = {
      findByPropertyId: vi.fn().mockResolvedValue({
        authCodeEncrypted: encryptCredential(
          "AUTH-TEST-NON-REALE",
          TEST_KEY,
        ),
        keyVersion: 2,
      }),
    };

    const provider =
      new PrismaSoggiorniamoCredentialProvider(
        store,
        TEST_KEY,
      );

    await expect(
      provider.getCredentials({
        propertyId: "property-1",
      }),
    ).rejects.toThrow(
      "Versione chiave Soggiorniamo non supportata: 2.",
    );
  });
});
