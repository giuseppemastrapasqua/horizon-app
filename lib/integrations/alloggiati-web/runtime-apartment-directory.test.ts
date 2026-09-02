import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  store: {},
}));

vi.mock(
  "./prisma-account-store",
  () => ({
    prismaAlloggiatiAccountStore:
      mocks.store,
  }),
);

import {
  createRuntimeAlloggiatiWebApartmentDirectory,
} from "./runtime-apartment-directory";

describe(
  "createRuntimeAlloggiatiWebApartmentDirectory",
  () => {
    it(
      "crea la directory con chiave configurata",
      () => {
        expect(
          createRuntimeAlloggiatiWebApartmentDirectory(
            "test-key",
          ),
        ).toBeDefined();
      },
    );

    it(
      "fallisce senza chiave",
      () => {
        expect(() =>
          createRuntimeAlloggiatiWebApartmentDirectory(
            "",
          ),
        ).toThrow(
          "HORIZON_CREDENTIAL_ENCRYPTION_KEY non configurata.",
        );
      },
    );
  },
);