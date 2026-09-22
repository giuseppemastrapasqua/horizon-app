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

const checkInFindUniqueMock = vi.hoisted(() =>
  vi.fn(),
);

const checkInUpsertMock = vi.hoisted(() =>
  vi.fn(),
);

const auditLogMock = vi.hoisted(() =>
  vi.fn(),
);

const revalidatePathMock = vi.hoisted(() =>
  vi.fn(),
);

const transactionMock = vi.hoisted(() =>
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
    $transaction: transactionMock,
  },
}));

vi.mock("@/services/audit/AuditService", () => ({
  AuditService: {
    log: auditLogMock,
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

import { updatePropertyCheckInAction } from "./check-in-actions";

function createFormData(
  checkInTypes: string[] = [],
): FormData {
  const formData = new FormData();

  formData.set("propertyId", "property-1");

  for (const checkInType of checkInTypes) {
    formData.append("checkInTypes", checkInType);
  }

  return formData;
}

describe("property check-in actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    requirePropertyRoleMock.mockResolvedValue(undefined);

    propertyFindUniqueMock.mockResolvedValue({
      id: "property-1",
    });

    checkInFindUniqueMock.mockResolvedValue(null);
    checkInUpsertMock.mockResolvedValue({
      id: "check-in-1",
    });
    auditLogMock.mockResolvedValue(undefined);

    transactionMock.mockImplementation(
      async (callback) =>
        callback({
          propertyCheckInConfiguration: {
            findUnique: checkInFindUniqueMock,
            upsert: checkInUpsertMock,
          },
        }),
    );
  });

  it("salva più modalità di check-in", async () => {
    await updatePropertyCheckInAction(
      createFormData([
        "IN_PERSON",
        "SELF_CHECK_IN",
      ]),
    );

    expect(checkInUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          propertyId: "property-1",
          checkInTypes: [
            "IN_PERSON",
            "SELF_CHECK_IN",
          ],
        }),
        update: expect.objectContaining({
          checkInTypes: [
            "IN_PERSON",
            "SELF_CHECK_IN",
          ],
        }),
      }),
    );
  });

  it("elimina modalità duplicate", async () => {
    await updatePropertyCheckInAction(
      createFormData([
        "IN_PERSON",
        "SELF_CHECK_IN",
        "IN_PERSON",
      ]),
    );

    expect(checkInUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          checkInTypes: [
            "IN_PERSON",
            "SELF_CHECK_IN",
          ],
        }),
      }),
    );
  });

  it("rifiuta una modalità non valida", async () => {
    await expect(
      updatePropertyCheckInAction(
        createFormData([
          "IN_PERSON",
          "INVALID_TYPE",
        ]),
      ),
    ).rejects.toThrow(
      "Una delle modalità di check-in selezionate non è valida.",
    );

    expect(propertyFindUniqueMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("salva un array vuoto quando non è selezionata alcuna modalità", async () => {
    await updatePropertyCheckInAction(
      createFormData(),
    );

    expect(checkInUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          propertyId: "property-1",
          checkInTypes: [],
        }),
        update: expect.objectContaining({
          checkInTypes: [],
        }),
      }),
    );
  });
});
