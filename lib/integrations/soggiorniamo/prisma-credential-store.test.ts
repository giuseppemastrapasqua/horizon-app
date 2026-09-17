import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const findUniqueMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: {
    soggiorniamoProperty: {
      findUnique: findUniqueMock,
    },
  },
}));

import {
  PrismaSoggiorniamoCredentialStore,
} from "./prisma-credential-store";

describe("PrismaSoggiorniamoCredentialStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("recupera solo ciphertext e keyVersion", async () => {
    findUniqueMock.mockResolvedValue({
      account: {
        authCodeEncrypted: "encrypted-value",
        keyVersion: 1,
      },
    });

    const store =
      new PrismaSoggiorniamoCredentialStore();

    await expect(
      store.findByPropertyId("property-1"),
    ).resolves.toEqual({
      authCodeEncrypted: "encrypted-value",
      keyVersion: 1,
    });

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: {
        propertyId: "property-1",
      },
      select: {
        account: {
          select: {
            authCodeEncrypted: true,
            keyVersion: true,
          },
        },
      },
    });
  });

  it("restituisce null se non configurato", async () => {
    findUniqueMock.mockResolvedValue(null);

    const store =
      new PrismaSoggiorniamoCredentialStore();

    await expect(
      store.findByPropertyId("property-1"),
    ).resolves.toBeNull();
  });
});
