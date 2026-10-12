import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadMovements: vi.fn(),
  buildXml: vi.fn(),
  createFingerprint: vi.fn(),
  prepare: vi.fn(),
}));

vi.mock("./prisma-movement-loader", () => ({
  loadRoss1000MovementsFromPrisma:
    mocks.loadMovements,
}));

vi.mock("./xml-builder", () => ({
  buildRoss1000Xml: mocks.buildXml,
}));

vi.mock("./payload-fingerprint", () => ({
  createRoss1000PayloadFingerprint:
    mocks.createFingerprint,
}));

vi.mock("./prisma-transmission-store", () => ({
  prismaRoss1000TransmissionStore: {
    prepare: mocks.prepare,
  },
}));

import type {
  AlloggiatiReferenceResolver,
} from "../alloggiati-web/reference-resolver";
import {
  prepareRoss1000Transmission,
} from "./prepare-transmission";

const resolver =
  {} as AlloggiatiReferenceResolver;

describe("prepareRoss1000Transmission", () => {
  beforeEach(() => {
    mocks.loadMovements.mockReset();
    mocks.buildXml.mockReset();
    mocks.createFingerprint.mockReset();
    mocks.prepare.mockReset();
  });

  it("prepares the exact generated XML idempotently for the UTC day", async () => {
    const movements = {
      codice: "A00000",
      prodotto: "Horizon",
      movimenti: [
        {
          data: "20260929",
          struttura: {
            apertura: "SI",
            camereOccupate: 1,
            camereDisponibili: 2,
            lettiDisponibili: 4,
          },
        },
      ],
    };

    const xml = "<Movimenti>payload</Movimenti>";
    const payloadHash = "hash-1";
    const transmission = {
      id: "transmission-1",
      status: "PREPARED",
      payloadHash,
    };

    mocks.loadMovements.mockResolvedValue(movements);
    mocks.buildXml.mockReturnValue(xml);
    mocks.createFingerprint.mockReturnValue(payloadHash);
    mocks.prepare.mockResolvedValue(transmission);

    const result = await prepareRoss1000Transmission(
      "property-1",
      new Date("2026-09-29T18:45:00.000Z"),
      resolver,
    );

    const normalizedDate =
      new Date("2026-09-29T00:00:00.000Z");

    expect(mocks.loadMovements).toHaveBeenCalledWith(
      "property-1",
      normalizedDate,
      resolver,
    );

    expect(mocks.buildXml).toHaveBeenCalledWith(
      movements,
    );

    expect(
      mocks.createFingerprint,
    ).toHaveBeenCalledWith(xml);

    expect(mocks.prepare).toHaveBeenCalledWith({
      propertyId: "property-1",
      movementDate: normalizedDate,
      payloadHash,
      payloadXml: xml,
    });

    expect(result).toEqual({
      transmission,
      movements,
      xml,
      payloadHash,
    });
  });
});
