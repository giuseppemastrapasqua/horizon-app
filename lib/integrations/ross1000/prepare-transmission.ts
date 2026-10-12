import type {
  AlloggiatiReferenceResolver,
} from "../alloggiati-web/reference-resolver";
import {
  loadRoss1000MovementsFromPrisma,
} from "./prisma-movement-loader";
import {
  buildRoss1000Xml,
} from "./xml-builder";
import {
  createRoss1000PayloadFingerprint,
} from "./payload-fingerprint";
import {
  prismaRoss1000TransmissionStore,
} from "./prisma-transmission-store";

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    ),
  );
}

export async function prepareRoss1000Transmission(
  propertyId: string,
  movementDate: Date,
  resolver: AlloggiatiReferenceResolver,
) {
  const normalizedMovementDate =
    startOfUtcDay(movementDate);

  const movements =
    await loadRoss1000MovementsFromPrisma(
      propertyId,
      normalizedMovementDate,
      resolver,
    );

  const xml = buildRoss1000Xml(movements);

  const payloadHash =
    createRoss1000PayloadFingerprint(xml);

  const transmission =
    await prismaRoss1000TransmissionStore.prepare({
      propertyId,
      movementDate: normalizedMovementDate,
      payloadHash,
      payloadXml: xml,
    });

  return {
    transmission,
    movements,
    xml,
    payloadHash,
  };
}
