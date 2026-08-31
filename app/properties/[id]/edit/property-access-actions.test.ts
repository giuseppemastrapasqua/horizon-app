import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const requireRolesMock = vi.hoisted(() =>
  vi.fn(),
);

const propertyFindUniqueMock = vi.hoisted(() =>
  vi.fn(),
);

const userFindFirstMock = vi.hoisted(() =>
  vi.fn(),
);

const accessUpsertMock = vi.hoisted(() =>
  vi.fn(),
);

const accessUpdateManyMock = vi.hoisted(() =>
  vi.fn(),
);

vi.mock("@/lib/auth/guards", () => ({
  requireRoles: requireRolesMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: {
      findUnique: propertyFindUniqueMock,
    },
    user: {
      findFirst: userFindFirstMock,
    },
    propertyAccess: {
      upsert: accessUpsertMock,
      updateMany: accessUpdateManyMock,
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { updatePropertyAccessAction } from "./property-access-actions";

describe("updatePropertyAccessAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    propertyFindUniqueMock.mockResolvedValue({
      id: "property-1",
    });

    userFindFirstMock.mockResolvedValue({
      id: "user-1",
      role: "MANAGER",
    });

    accessUpsertMock.mockResolvedValue({});
    accessUpdateManyMock.mockResolvedValue({
      count: 1,
    });
  });

  it("richiede il ruolo SUPER_ADMIN", async () => {
    const formData = new FormData();

    formData.set("propertyId", "property-1");
    formData.set("userId", "user-1");
    formData.set("enabled", "true");
    formData.set("role", "MANAGER");

    await updatePropertyAccessAction(formData);

    expect(requireRolesMock).toHaveBeenCalledWith([
      "SUPER_ADMIN",
    ]);
  });

  it("crea o riattiva un PropertyAccess", async () => {
    const formData = new FormData();

    formData.set("propertyId", "property-1");
    formData.set("userId", "user-1");
    formData.set("enabled", "true");
    formData.set("role", "MANAGER");

    await updatePropertyAccessAction(formData);

    expect(accessUpsertMock).toHaveBeenCalledWith({
      where: {
        propertyId_userId: {
          propertyId: "property-1",
          userId: "user-1",
        },
      },
      update: {
        role: "MANAGER",
        active: true,
      },
      create: {
        propertyId: "property-1",
        userId: "user-1",
        role: "MANAGER",
        active: true,
      },
    });
  });

  it("revoca l'accesso senza cancellarlo", async () => {
    const formData = new FormData();

    formData.set("propertyId", "property-1");
    formData.set("userId", "user-1");
    formData.set("enabled", "false");

    await updatePropertyAccessAction(formData);

    expect(accessUpdateManyMock).toHaveBeenCalledWith({
      where: {
        propertyId: "property-1",
        userId: "user-1",
        active: true,
      },
      data: {
        active: false,
      },
    });

    expect(accessUpsertMock).not.toHaveBeenCalled();
  });

  it("non permette di assegnare il SUPER_ADMIN", async () => {
    userFindFirstMock.mockResolvedValue({
      id: "admin-1",
      role: "SUPER_ADMIN",
    });

    const formData = new FormData();

    formData.set("propertyId", "property-1");
    formData.set("userId", "admin-1");
    formData.set("enabled", "true");
    formData.set("role", "OWNER");

    await expect(
      updatePropertyAccessAction(formData),
    ).rejects.toThrow(
      "Il Super Admin dispone già di accesso globale.",
    );

    expect(accessUpsertMock).not.toHaveBeenCalled();
  });

  it("rifiuta utenti non attivi o inesistenti", async () => {
    userFindFirstMock.mockResolvedValue(null);

    const formData = new FormData();

    formData.set("propertyId", "property-1");
    formData.set("userId", "user-1");
    formData.set("enabled", "true");
    formData.set("role", "VIEWER");

    await expect(
      updatePropertyAccessAction(formData),
    ).rejects.toThrow(
      "Utente non valido o non attivo.",
    );
  });
});
