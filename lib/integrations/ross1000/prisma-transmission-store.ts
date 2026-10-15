import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type PrepareRoss1000TransmissionInput = {
  propertyId: string;
  movementDate: Date;
  payloadHash: string;
  payloadXml: string;
};

export class PrismaRoss1000TransmissionStore {
  async prepare(
    input: PrepareRoss1000TransmissionInput,
  ) {
    return prisma.ross1000Transmission.upsert({
      where: {
        propertyId_movementDate_payloadHash: {
          propertyId: input.propertyId,
          movementDate: input.movementDate,
          payloadHash: input.payloadHash,
        },
      },
      create: {
        propertyId: input.propertyId,
        movementDate: input.movementDate,
        payloadHash: input.payloadHash,
        payloadXml: input.payloadXml,
      },
      update: {},
    });
  }

  async getById(
    transmissionId: string,
  ) {
    return prisma.ross1000Transmission.findUnique({
      where: {
        id: transmissionId,
      },
      select: {
        id: true,
        propertyId: true,
        movementDate: true,
        status: true,
        payloadHash: true,
        payloadXml: true,
      },
    });
  }
  async beginSending(
    transmissionId: string,
  ): Promise<boolean> {
    return prisma.$transaction(async (transaction) => {
      const current = await transaction.ross1000Transmission.findUnique({
        where: { id: transmissionId },
        select: { propertyId: true, movementDate: true, status: true },
      });
      if (!current || current.status !== "PREPARED") return false;
      const conflict = await transaction.ross1000Transmission.findFirst({
        where: { propertyId: current.propertyId, movementDate: current.movementDate,
          id: { not: transmissionId }, status: { in: ["SENDING", "OUTCOME_UNKNOWN", "CONFIRMED"] } },
        select: { id: true },
      });
      if (conflict) return false;
      const result = await transaction.ross1000Transmission.updateMany({
        where: { id: transmissionId, status: "PREPARED" },
        data: { status: "SENDING", sendStartedAt: new Date(), lastError: null },
      });
      return result.count === 1;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async markConfirmed(
    transmissionId: string,
    responseSuccess: boolean = true,
  ): Promise<boolean> {
    const result =
      await prisma.ross1000Transmission.updateMany({
        where: {
          id: transmissionId,
          status: "SENDING",
        },
        data: {
          status: "CONFIRMED",
          responseSuccess,
          responseError: null,
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
      await prisma.ross1000Transmission.updateMany({
        where: {
          id: transmissionId,
          status: "SENDING",
        },
        data: {
          status: "REJECTED",
          responseSuccess: false,
          responseError: error,
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
      await prisma.ross1000Transmission.updateMany({
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

export const prismaRoss1000TransmissionStore =
  new PrismaRoss1000TransmissionStore();
