import assert from "node:assert/strict";
import type { PrismaClient } from "@prisma/client";
import { prisma as domainPrisma } from "../../lib/prisma";
import { PrismaRoss1000TransmissionStore } from "../../lib/integrations/ross1000/prisma-transmission-store";
import { assertIsolatedDatabase, propertyA } from "./seed";

export async function verifyTransmissionConcurrency(prisma: PrismaClient) {
  assertIsolatedDatabase();
  const store = new PrismaRoss1000TransmissionStore();
  try {
    const date = new Date("2026-10-10T00:00:00Z");
    const transmissions = await Promise.all(
      ["payload-one", "payload-two"].map((payloadHash) =>
        prisma.ross1000Transmission.create({
          data: {
            propertyId: propertyA,
            movementDate: date,
            payloadHash,
            payloadXml: "<isolated-test/>",
          },
        }),
      ),
    );
    const results = await Promise.allSettled(
      transmissions.map((item) => store.beginSending(item.id)),
    );
    assert.equal(
      results.filter((result) => result.status === "fulfilled" && result.value)
        .length,
      1,
      "Exactly one payload can claim a property/report day concurrently.",
    );
    for (const result of results) {
      if (result.status === "rejected") {
        assert.equal(
          result.reason?.code,
          "P2034",
          "Only PostgreSQL serialization conflicts are expected.",
        );
      }
    }
    const sending = await prisma.ross1000Transmission.findMany({
      where: { propertyId: propertyA, movementDate: date, status: "SENDING" },
    });
    assert.equal(sending.length, 1);
    const winner = sending[0];
    const loser = transmissions.find((item) => item.id !== winner.id)!;
    await prisma.ross1000Transmission.update({
      where: { id: winner.id },
      data: { status: "OUTCOME_UNKNOWN" },
    });
    assert.equal(
      await store.beginSending(loser.id),
      false,
      "Unknown delivery blocks a second payload.",
    );
    await prisma.ross1000Transmission.update({
      where: { id: winner.id },
      data: { status: "CONFIRMED" },
    });
    assert.equal(
      await store.beginSending(loser.id),
      false,
      "Confirmed delivery blocks a second payload.",
    );
    assert.equal(
      await store.beginSending(winner.id),
      false,
      "Confirmed payload cannot be sent twice.",
    );
  } finally {
    await domainPrisma.$disconnect();
  }
}
