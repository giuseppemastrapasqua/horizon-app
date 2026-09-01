import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const requirePropertyRoleMock = vi.hoisted(() =>
  vi.fn(),
);

const propertyFindUniqueMock = vi.hoisted(() =>
  vi.fn(),
);

const userFindManyMock = vi.hoisted(() =>
  vi.fn(),
);

const deleteManyMock = vi.hoisted(() =>
  vi.fn(),
);

const upsertMock = vi.hoisted(() =>
  vi.fn(),
);

vi.mock("@/lib/auth/guards", () => ({
  requirePropertyRole: requirePropertyRoleMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: {
      findUnique: propertyFindUniqueMock,
    },
    user: {
      findMany: userFindManyMock,
    },
    $transaction: vi.fn(async (callback) =>
      callback({
        propertyTaskAssignment: {
          deleteMany: deleteManyMock,
          upsert: upsertMock,
        },
      }),
    ),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import {
  updatePropertyTaskAssignmentsAction,
} from "./task-assignment-actions";

describe("updatePropertyTaskAssignmentsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    requirePropertyRoleMock.mockResolvedValue({
      id: "manager-1",
    });

    propertyFindUniqueMock.mockResolvedValue({
      id: "property-1",
    });

    userFindManyMock.mockResolvedValue([
      {
        id: "operator-1",
      },
    ]);

    deleteManyMock.mockResolvedValue({
      count: 0,
    });

    upsertMock.mockResolvedValue({});
  });

  it("richiede OWNER o MANAGER per modificare le assegnazioni", async () => {
    const formData = new FormData();

    formData.set(
      "propertyId",
      "property-1",
    );

    formData.set(
      "cleaningUserId",
      "operator-1",
    );

    await updatePropertyTaskAssignmentsAction(
      formData,
    );

    expect(
      requirePropertyRoleMock,
    ).toHaveBeenCalledWith(
      "property-1",
      ["OWNER", "MANAGER"],
    );
  });

  it("rifiuta una struttura non specificata", async () => {
    await expect(
      updatePropertyTaskAssignmentsAction(
        new FormData(),
      ),
    ).rejects.toThrow(
      "Immobile non specificato.",
    );

    expect(
      requirePropertyRoleMock,
    ).not.toHaveBeenCalled();
  });
});