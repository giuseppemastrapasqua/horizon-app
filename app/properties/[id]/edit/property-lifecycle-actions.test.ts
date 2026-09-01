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

const requireRolesMock = vi.hoisted(() =>
  vi.fn(),
);

const propertyFindUniqueMock = vi.hoisted(() =>
  vi.fn(),
);

const propertyUpdateMock = vi.hoisted(() =>
  vi.fn(),
);

const propertyDeleteMock = vi.hoisted(() =>
  vi.fn(),
);

const auditLogMock = vi.hoisted(() =>
  vi.fn(),
);

const redirectMock = vi.hoisted(() =>
  vi.fn(),
);

vi.mock("@/lib/auth/guards", () => ({
  requirePropertyRole: requirePropertyRoleMock,
  requireRoles: requireRolesMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: {
      findUnique: propertyFindUniqueMock,
      delete: propertyDeleteMock,
    },
    $transaction: vi.fn(async (callback) =>
      callback({
        property: {
          update: propertyUpdateMock,
        },
      }),
    ),
  },
}));

vi.mock("@/services/audit/AuditService", () => ({
  AuditService: {
    log: auditLogMock,
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import {
  archivePropertyAction,
  checkPermanentPropertyDeletionAction,
  permanentlyDeletePropertyAction,
} from "./property-lifecycle-actions";

function emptyCounts() {
  return {
    bookings: 0,
    documents: 0,
    financeFormulas: 0,
    financeReports: 0,
    tasks: 0,
    revenueMarketSnapshots: 0,
    revenueDailySignals: 0,
    revenueRecommendations: 0,
  };
}

describe("property lifecycle actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    requirePropertyRoleMock.mockResolvedValue({
      id: "user-1",
      role: "MANAGER",
    });

    requireRolesMock.mockResolvedValue({
      id: "admin-1",
      role: "SUPER_ADMIN",
    });

    propertyUpdateMock.mockResolvedValue({});
    propertyDeleteMock.mockResolvedValue({});
    auditLogMock.mockResolvedValue({});
  });

  it("archivia la struttura senza eliminarla", async () => {
    propertyFindUniqueMock.mockResolvedValue({
      id: "property-1",
      status: "ACTIVE",
    });

    const formData = new FormData();
    formData.set("propertyId", "property-1");

    await archivePropertyAction(formData);

    expect(
      requirePropertyRoleMock,
    ).toHaveBeenCalledWith(
      "property-1",
      ["OWNER", "MANAGER"],
    );

    expect(propertyUpdateMock).toHaveBeenCalledWith({
      where: {
        id: "property-1",
      },
      data: {
        status: "ARCHIVED",
      },
    });

    expect(propertyDeleteMock).not.toHaveBeenCalled();
  });

  it("richiede SUPER_ADMIN per verificare l'eliminazione definitiva", async () => {
    propertyFindUniqueMock.mockResolvedValue({
      id: "property-1",
      name: "Casa Demo",
      status: "ARCHIVED",
      _count: emptyCounts(),
    });

    const formData = new FormData();
    formData.set("propertyId", "property-1");

    await checkPermanentPropertyDeletionAction(
      formData,
    );

    expect(requireRolesMock).toHaveBeenCalledWith([
      "SUPER_ADMIN",
    ]);
  });

  it("blocca l'eliminazione se la struttura non è archiviata", async () => {
    propertyFindUniqueMock.mockResolvedValue({
      id: "property-1",
      name: "Casa Demo",
      status: "ACTIVE",
      _count: emptyCounts(),
    });

    const formData = new FormData();
    formData.set("propertyId", "property-1");

    await expect(
      checkPermanentPropertyDeletionAction(
        formData,
      ),
    ).rejects.toThrow(
      "La struttura deve essere archiviata prima dell'eliminazione definitiva.",
    );
  });

  it("blocca l'eliminazione se esistono dati operativi", async () => {
    propertyFindUniqueMock.mockResolvedValue({
      id: "property-1",
      name: "Casa Demo",
      status: "ARCHIVED",
      _count: {
        ...emptyCounts(),
        bookings: 2,
      },
    });

    const formData = new FormData();
    formData.set("propertyId", "property-1");

    await expect(
      checkPermanentPropertyDeletionAction(
        formData,
      ),
    ).rejects.toThrow(
      "Eliminazione definitiva bloccata",
    );
  });

  it("consente la verifica se archiviata e senza storico critico", async () => {
    propertyFindUniqueMock.mockResolvedValue({
      id: "property-1",
      name: "Casa Demo",
      status: "ARCHIVED",
      _count: emptyCounts(),
    });

    const formData = new FormData();
    formData.set("propertyId", "property-1");

    await expect(
      checkPermanentPropertyDeletionAction(
        formData,
      ),
    ).resolves.toBeUndefined();
  });

  it("richiede SUPER_ADMIN anche per la cancellazione definitiva", async () => {
    propertyFindUniqueMock.mockResolvedValue({
      id: "property-1",
      name: "Casa Demo",
      status: "ARCHIVED",
      _count: emptyCounts(),
    });

    const formData = new FormData();
    formData.set("propertyId", "property-1");
    formData.set("confirmation", "Casa Demo");

    await permanentlyDeletePropertyAction(formData);

    expect(requireRolesMock).toHaveBeenCalledWith([
      "SUPER_ADMIN",
    ]);
  });

  it("blocca la cancellazione se la conferma non coincide con il nome", async () => {
    propertyFindUniqueMock.mockResolvedValue({
      id: "property-1",
      name: "Casa Demo",
      status: "ARCHIVED",
      _count: emptyCounts(),
    });

    const formData = new FormData();
    formData.set("propertyId", "property-1");
    formData.set("confirmation", "nome sbagliato");

    await expect(
      permanentlyDeletePropertyAction(formData),
    ).rejects.toThrow(
      "Conferma non valida",
    );

    expect(propertyDeleteMock).not.toHaveBeenCalled();
  });

  it("blocca la cancellazione definitiva se esiste storico critico", async () => {
    propertyFindUniqueMock.mockResolvedValue({
      id: "property-1",
      name: "Casa Demo",
      status: "ARCHIVED",
      _count: {
        ...emptyCounts(),
        financeReports: 1,
      },
    });

    const formData = new FormData();
    formData.set("propertyId", "property-1");
    formData.set("confirmation", "Casa Demo");

    await expect(
      permanentlyDeletePropertyAction(formData),
    ).rejects.toThrow(
      "Eliminazione definitiva bloccata",
    );

    expect(propertyDeleteMock).not.toHaveBeenCalled();
  });

  it("elimina una struttura archiviata, vuota e confermata", async () => {
    propertyFindUniqueMock.mockResolvedValue({
      id: "property-1",
      name: "Casa Demo",
      status: "ARCHIVED",
      _count: emptyCounts(),
    });

    const formData = new FormData();
    formData.set("propertyId", "property-1");
    formData.set("confirmation", "Casa Demo");

    await permanentlyDeletePropertyAction(formData);

    expect(propertyDeleteMock).toHaveBeenCalledWith({
      where: {
        id: "property-1",
      },
    });

    expect(redirectMock).toHaveBeenCalledWith(
      "/properties",
    );
  });
});
