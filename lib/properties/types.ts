import type { Prisma } from "@prisma/client";

export type PropertyListItem = Prisma.PropertyGetPayload<{
  include: {
    owner: true;
    bookings: true;
    tasks: true;
  };
}>;