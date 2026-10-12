import assert from "node:assert/strict";
import type { PrismaClient } from "@prisma/client";
import { TestClient, origin } from "./http-client";
import { assertIsolatedDatabase, propertyA, propertyB } from "./seed";

export async function verifyPersonalUse(
  prisma: PrismaClient,
  owner: TestClient,
  operator: TestClient,
) {
  assertIsolatedDatabase();
  const year = new Date().getUTCFullYear() + 1;
  const day = `${year}-07-10`;
  const calendar = `/calendar?propertyId=${propertyA}&month=${year}-07`;
  const html = await (await owner.request(calendar)).text();
  const form = [...html.matchAll(/<form\b[^>]*>([\s\S]*?)<\/form>/g)].find(
    (match) => match[1].includes('name="startDate"'),
  );
  assert.ok(form, "Owner reservation form must be available.");
  const action = /name="(\$ACTION_ID_[^"]+)"/.exec(form[1])?.[1];
  assert.ok(action, "Native server action identifier must be present.");
  const reserve = (
    client: TestClient,
    propertyId: string,
    start: string,
    end: string,
  ) => {
    const data = new FormData();
    data.set(action, "");
    data.set("propertyId", propertyId);
    data.set("startDate", start);
    data.set("endDate", end);
    return client.request(calendar, {
      method: "POST",
      headers: { origin },
      body: data,
    });
  };
  const statuses = await Promise.all(
    [
      reserve(owner, propertyA, day, day),
      reserve(owner, propertyA, day, day),
    ].map(async (request) => (await request).status),
  );
  assert.equal(
    statuses.filter((status) => status === 200).length,
    1,
    "Exactly one concurrent reservation succeeds.",
  );
  const blocks = await prisma.propertyAvailabilityBlock.findMany({
    where: { propertyId: propertyA, startDate: new Date(`${day}T00:00:00Z`) },
  });
  assert.equal(
    blocks.length,
    1,
    "Concurrent owner requests cannot create duplicate blocks.",
  );
  assert.ok((await reserve(owner, propertyB, day, day)).status >= 400);
  assert.equal(
    await prisma.propertyAvailabilityBlock.count({
      where: { propertyId: propertyB },
    }),
    0,
    "Foreign property cannot be blocked.",
  );
  assert.ok(
    (await reserve(operator, propertyA, `${year}-07-11`, `${year}-07-11`))
      .status >= 400,
  );
  await prisma.booking.create({
    data: {
      id: "v1-booking-future-collision",
      propertyId: propertyA,
      ownerId: "v1-user-ownerA",
      channel: "DIRECT",
      guestName: "PRIVATE_FUTURE_GUEST",
      checkIn: new Date(`${year}-07-20T00:00:00Z`),
      checkOut: new Date(`${year}-07-22T00:00:00Z`),
      nights: 2,
      guests: 2,
      grossAmount: 200,
    },
  });
  assert.ok(
    (await reserve(owner, propertyA, `${year}-07-21`, `${year}-07-21`))
      .status >= 400,
  );
  assert.ok(
    (await reserve(owner, propertyA, `${year}-08-01`, `${year}-08-30`))
      .status >= 400,
    "Existing one day plus thirty new days exceeds annual quota.",
  );
  assert.equal(
    await prisma.propertyAvailabilityBlock.count({
      where: { propertyId: propertyA },
    }),
    1,
    "Rejected requests leave availability unchanged.",
  );
  const updatedHtml = await (await owner.request(calendar)).text();
  const releaseForm = [
    ...updatedHtml.matchAll(/<form\b[^>]*>([\s\S]*?)<\/form>/g),
  ].find((match) => match[1].includes('name="blockId"'));
  assert.ok(releaseForm, "Own future block has a release form.");
  const releaseAction = /name="(\$ACTION_ID_[^"]+)"/.exec(releaseForm[1])?.[1];
  assert.ok(releaseAction);
  const release = new FormData();
  release.set(releaseAction, "");
  release.set("propertyId", propertyA);
  release.set("blockId", blocks[0].id);
  assert.equal(
    (
      await owner.request(calendar, {
        method: "POST",
        headers: { origin },
        body: release,
      })
    ).status,
    200,
  );
  assert.equal(
    await prisma.propertyAvailabilityBlock.count({
      where: { propertyId: propertyA },
    }),
    0,
  );
}
