import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const findFirstMock = vi.hoisted(() =>
  vi.fn(),
);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    alloggiatiWebAccount: {
      findFirst: findFirstMock,
    },
  },
}));

import {
  PrismaAlloggiatiAccountStore,
} from "./prisma-account-store";

describe(
  "PrismaAlloggiatiAccountStore",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it(
      "carica account solo per id e owner",
      async () => {
        const record = {
          usernameEncrypted: "username",
          passwordEncrypted: "password",
          wsKeyEncrypted: "wskey",
          keyVersion: 1,
        };

        findFirstMock.mockResolvedValue(
          record,
        );

        const store =
          new PrismaAlloggiatiAccountStore();

        await expect(
          store.findByIdAndOwnerId(
            "account-1",
            "owner-1",
          ),
        ).resolves.toEqual(record);

        expect(
          findFirstMock,
        ).toHaveBeenCalledWith({
          where: {
            id: "account-1",
            ownerId: "owner-1",
          },
          select: {
            usernameEncrypted: true,
            passwordEncrypted: true,
            wsKeyEncrypted: true,
            keyVersion: true,
          },
        });
      },
    );
  },
);