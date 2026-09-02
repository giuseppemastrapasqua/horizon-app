import {
  prisma,
} from "@/lib/prisma";

export type PrepareAlloggiatiTransmissionInput = {
  bookingId: string;
  propertyId: string;
  apartmentId: string;
  payloadHash: string;
  recordsCount: number;
};

export class PrismaAlloggiatiTransmissionStore {
  async prepare(
    input: PrepareAlloggiatiTransmissionInput,
  ) {
    return prisma.alloggiatiWebTransmission.upsert({
      where: {
        bookingId_payloadHash: {
          bookingId: input.bookingId,
          payloadHash: input.payloadHash,
        },
      },
      create: {
        bookingId: input.bookingId,
        propertyId: input.propertyId,
        apartmentId: input.apartmentId,
        payloadHash: input.payloadHash,
        recordsCount: input.recordsCount,
      },
      update: {},
    });
  }

  async beginSending(
    transmissionId: string,
  ): Promise<boolean> {
    const result =
      await prisma.alloggiatiWebTransmission.updateMany({
        where: {
          id: transmissionId,
          status: "PREPARED",
        },
        data: {
          status: "SENDING",
          sendStartedAt: new Date(),
        },
      });

    return result.count === 1;
  }

  async confirm(
    transmissionId: string,
  ): Promise<boolean> {
    const result =
      await prisma.alloggiatiWebTransmission.updateMany({
        where: {
          id: transmissionId,
          status: "SENDING",
        },
        data: {
          status: "CONFIRMED",
          confirmedAt: new Date(),
          lastError: null,
        },
      });

    return result.count === 1;
  }

  async markRejected(
    transmissionId: string,
    error: string,
  ): Promise<boolean> {
    const result =
      await prisma.alloggiatiWebTransmission.updateMany({
        where: {
          id: transmissionId,
          status: "SENDING",
        },
        data: {
          status: "REJECTED",
          rejectedAt: new Date(),
          lastError: error,
        },
      });

    return result.count === 1;
  }

  async markOutcomeUnknown(
    transmissionId: string,
    error: string,
  ): Promise<boolean> {
    const result =
      await prisma.alloggiatiWebTransmission.updateMany({
        where: {
          id: transmissionId,
          status: "SENDING",
        },
        data: {
          status: "OUTCOME_UNKNOWN",
          outcomeUnknownAt: new Date(),
          lastError: error,
        },
      });

    return result.count === 1;
  }
}

export const prismaAlloggiatiTransmissionStore =
  new PrismaAlloggiatiTransmissionStore();
