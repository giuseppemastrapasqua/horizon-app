import {
  AvailabilityBlockSource,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type { IcalBookingClient } from "./ical-booking-client";
import type { IcalBookingEvent } from "./types";

const ICAL_AVAILABILITY_NOTE =
  "Disponibilità iCal.";

const MILLISECONDS_PER_DAY =
  24 * 60 * 60 * 1000;

export type SynchronizeIcalAvailabilityInput = {
  client: IcalBookingClient;
  integrationConnectionPropertyId: string;
  propertyId: string;
};

export type SynchronizeIcalAvailabilityResult = {
  fetchedEvents: number;
  insertedBlocks: number;
  updatedBlocks: number;
  deletedBlocks: number;
  skippedEvents: number;
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
};

type DesiredAvailabilityBlock = {
  externalEventId: string;
  externalSummary: string | null;
  startDate: Date;
  endDate: Date;
};

type NormalizedSnapshot = {
  desiredBlocks: Map<
    string,
    DesiredAvailabilityBlock
  >;

  seenEventIds: Set<string>;
  cancelledEventIds: Set<string>;

  skippedEvents: number;
};

export async function synchronizeIcalAvailability({
  client,
  integrationConnectionPropertyId,
  propertyId,
}: SynchronizeIcalAvailabilityInput): Promise<SynchronizeIcalAvailabilityResult> {
  const normalizedIntegrationConnectionPropertyId =
    integrationConnectionPropertyId.trim();

  const normalizedPropertyId =
    propertyId.trim();

  if (
    !normalizedIntegrationConnectionPropertyId
  ) {
    throw new Error(
      "integrationConnectionPropertyId non valido.",
    );
  }

  if (!normalizedPropertyId) {
    throw new Error(
      "propertyId non valido.",
    );
  }

  const startedAt =
    new Date();

  /*
   * Il feed iCal viene acquisito interamente
   * prima di iniziare qualsiasi scrittura.
   *
   * La riconciliazione delle sparizioni è
   * sicura soltanto su uno snapshot completo.
   */
  const events =
    await client.fetchEvents();

  const snapshot =
    normalizeSnapshot(
      events,
    );

  const counts =
    await prisma.$transaction(
      async (transaction) => {
        const existingBlocks =
          await transaction.propertyAvailabilityBlock.findMany({
            where: {
              integrationConnectionPropertyId:
                normalizedIntegrationConnectionPropertyId,

              source:
                AvailabilityBlockSource.INTEGRATION,
            },

            select: {
              id: true,
              propertyId: true,
              externalEventId: true,
              externalSummary: true,
              startDate: true,
              endDate: true,
              note: true,
            },
          });

        for (
          const existingBlock
          of existingBlocks
        ) {
          if (
            existingBlock.propertyId !==
            normalizedPropertyId
          ) {
            throw new Error(
              `Il blocco disponibilità "${existingBlock.id}" appartiene a una struttura diversa dal mapping iCal.`,
            );
          }

          if (
            !existingBlock.externalEventId
          ) {
            throw new Error(
              `Il blocco disponibilità iCal "${existingBlock.id}" non contiene externalEventId.`,
            );
          }
        }

        const existingByEventId =
          new Map(
            existingBlocks.map(
              (block) => [
                block.externalEventId as string,
                block,
              ],
            ),
          );

        let insertedBlocks =
          0;

        let updatedBlocks =
          0;

        let deletedBlocks =
          0;

        for (
          const desiredBlock
          of snapshot.desiredBlocks.values()
        ) {
          const existing =
            existingByEventId.get(
              desiredBlock.externalEventId,
            );

          const requiresUpdate =
            Boolean(
              existing &&
                (
                  existing.startDate.getTime() !==
                    desiredBlock.startDate.getTime() ||
                  existing.endDate.getTime() !==
                    desiredBlock.endDate.getTime() ||
                  existing.externalSummary !==
                    desiredBlock.externalSummary ||
                  existing.note !==
                    ICAL_AVAILABILITY_NOTE
                ),
            );

          if (
      existing &&
      !requiresUpdate
    ) {
      continue;
    }

    await transaction.propertyAvailabilityBlock.upsert({
            where: {
              integrationConnectionPropertyId_externalEventId: {
                integrationConnectionPropertyId:
                  normalizedIntegrationConnectionPropertyId,

                externalEventId:
                  desiredBlock.externalEventId,
              },
            },

            create: {
              propertyId:
                normalizedPropertyId,

              startDate:
                desiredBlock.startDate,

              endDate:
                desiredBlock.endDate,

              source:
                AvailabilityBlockSource.INTEGRATION,

              note:
                ICAL_AVAILABILITY_NOTE,

              integrationConnectionPropertyId:
                normalizedIntegrationConnectionPropertyId,

              externalEventId:
                desiredBlock.externalEventId,

              externalSummary:
                desiredBlock.externalSummary,
            },

            update: {
              propertyId:
                normalizedPropertyId,

              startDate:
                desiredBlock.startDate,

              endDate:
                desiredBlock.endDate,

              source:
                AvailabilityBlockSource.INTEGRATION,

              note:
                ICAL_AVAILABILITY_NOTE,

              externalSummary:
                desiredBlock.externalSummary,
            },
          });

          if (!existing) {
            insertedBlocks +=
              1;
          } else if (
            requiresUpdate
          ) {
            updatedBlocks +=
              1;
          }
        }

        const blockIdsToDelete =
          existingBlocks
            .filter(
              (block) => {
                const externalEventId =
                  block.externalEventId as string;

                if (
                  snapshot.cancelledEventIds.has(
                    externalEventId,
                  )
                ) {
                  return true;
                }

                /*
                 * Un UID presente ma non valido
                 * viene conservato.
                 *
                 * Questo evita di riaprire date
                 * accidentalmente se il provider
                 * restituisce temporaneamente un
                 * VEVENT malformato.
                 */
                return !snapshot.seenEventIds.has(
                  externalEventId,
                );
              },
            )
            .map(
              (block) =>
                block.id,
            );

        if (
          blockIdsToDelete.length >
          0
        ) {
          const deletion =
            await transaction.propertyAvailabilityBlock.deleteMany({
              where: {
                id: {
                  in:
                    blockIdsToDelete,
                },

                integrationConnectionPropertyId:
                  normalizedIntegrationConnectionPropertyId,

                source:
                  AvailabilityBlockSource.INTEGRATION,
              },
            });

          deletedBlocks =
            deletion.count;
        }

        return {
          insertedBlocks,
          updatedBlocks,
          deletedBlocks,
        };
      },
    );

  const completedAt =
    new Date();

  return {
    fetchedEvents:
      events.length,

    insertedBlocks:
      counts.insertedBlocks,

    updatedBlocks:
      counts.updatedBlocks,

    deletedBlocks:
      counts.deletedBlocks,

    skippedEvents:
      snapshot.skippedEvents,

    startedAt,
    completedAt,

    durationMs:
      completedAt.getTime() -
      startedAt.getTime(),
  };
}

function normalizeSnapshot(
  events: IcalBookingEvent[],
): NormalizedSnapshot {
  const desiredBlocks =
    new Map<
      string,
      DesiredAvailabilityBlock
    >();

  const seenEventIds =
    new Set<string>();

  const cancelledEventIds =
    new Set<string>();

  const eventStates =
    new Map<
      string,
      string
    >();

  let skippedEvents =
    0;

  for (
    const event
    of events
  ) {
    const externalEventId =
      event.uid.trim();

    if (!externalEventId) {
      skippedEvents +=
        1;

      continue;
    }

    const status =
      event.status
        ?.trim()
        .toUpperCase();

    const isCancelled =
      status ===
      "CANCELLED";

    const normalizedBlock =
      isCancelled
        ? null
        : normalizeActiveEvent(
            event,
            externalEventId,
          );

    const stateSignature =
      isCancelled
        ? "CANCELLED"
        : normalizedBlock
          ? [
              "ACTIVE",
              normalizedBlock.startDate.toISOString(),
              normalizedBlock.endDate.toISOString(),
            ].join("|")
          : "INVALID";

    const previousState =
      eventStates.get(
        externalEventId,
      );

    if (
      previousState !==
        undefined &&
      previousState !==
        stateSignature
    ) {
      throw new Error(
        `Il feed iCal contiene VEVENT conflittuali con UID "${externalEventId}".`,
      );
    }

    if (
      previousState ===
      stateSignature
    ) {
      skippedEvents +=
        1;

      continue;
    }

    eventStates.set(
      externalEventId,
      stateSignature,
    );

    seenEventIds.add(
      externalEventId,
    );

    if (isCancelled) {
      cancelledEventIds.add(
        externalEventId,
      );

      continue;
    }

    if (!normalizedBlock) {
      skippedEvents +=
        1;

      continue;
    }

    desiredBlocks.set(
      externalEventId,
      normalizedBlock,
    );
  }

  return {
    desiredBlocks,
    seenEventIds,
    cancelledEventIds,
    skippedEvents,
  };
}

function normalizeActiveEvent(
  event: IcalBookingEvent,
  externalEventId: string,
): DesiredAvailabilityBlock | null {
  if (!event.isAllDay) {
    return null;
  }

  if (
    !isValidDate(
      event.start,
    ) ||
    !isValidDate(
      event.end,
    )
  ) {
    return null;
  }

  const startDate =
    toUtcDateOnly(
      event.start,
    );

  const exclusiveEndDate =
    toUtcDateOnly(
      event.end,
    );

  if (
    exclusiveEndDate.getTime() <=
    startDate.getTime()
  ) {
    return null;
  }

  /*
   * In iCal DTEND per un evento all-day
   * è esclusivo.
   *
   * PropertyAvailabilityBlock usa invece
   * endDate inclusivo.
   */
  const endDate =
    new Date(
      exclusiveEndDate.getTime() -
        MILLISECONDS_PER_DAY,
    );

  const externalSummary =
    event.summary?.trim() || null;

  return {
    externalEventId,
    externalSummary,
    startDate,
    endDate,
  };
}

function toUtcDateOnly(
  date: Date,
): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    ),
  );
}

function isValidDate(
  date: Date,
): boolean {
  return !Number.isNaN(
    date.getTime(),
  );
}

