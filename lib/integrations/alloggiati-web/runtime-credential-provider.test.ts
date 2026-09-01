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
  "./prisma-credential-store",
  () => ({
    prismaAlloggiatiWebCredentialStore:
      mocks.store,
  }),
);

import {
  createRuntimeAlloggiatiWebCredentialProvider,
} from "./runtime-credential-provider";

describe(
  "createRuntimeAlloggiatiWebCredentialProvider",
  () => {
    it(
      "crea il provider con una chiave configurata",
      () => {
        const provider =
          createRuntimeAlloggiatiWebCredentialProvider(
            "test-key",
          );

        expect(provider).toBeDefined();
      },
    );

    it(
      "fallisce se la chiave non e configurata",
      () => {
        expect(() =>
          createRuntimeAlloggiatiWebCredentialProvider(
            "",
          ),
        ).toThrow(
          "HORIZON_CREDENTIAL_ENCRYPTION_KEY non configurata.",
        );
      },
    );
  },
);
