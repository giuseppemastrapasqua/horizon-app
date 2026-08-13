import { prisma } from "@/lib/prisma";

export type PropertyAvailabilityBlockDTO = {
  id: string;
  startDate: string;
  endDate: string;
  source:
    | "MANUAL"
    | "AI"
    | "OWNER"
    | "INTEGRATION";
  note: string | null;
};

export async function getPropertyAvailabilityBlocks(
  propertyId: string,
): Promise<PropertyAvailabilityBlockDTO[]> {
  const rows =
    await prisma.propertyAvailabilityBlock.findMany({
      where: {
        propertyId,
      },

      select: {
        id: true,
        startDate: true,
        endDate: true,
        source: true,
        note: true,
      },

      orderBy: {
        startDate: "asc",
      },
    });

  return rows.map(
    (row) => ({
      id: row.id,

      startDate:
        row.startDate.toISOString(),

      endDate:
        row.endDate.toISOString(),

      source:
        row.source,

      note:
        row.note,
    }),
  );
}
