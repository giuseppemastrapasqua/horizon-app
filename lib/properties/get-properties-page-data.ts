import { prisma } from "@/lib/prisma";

export type PropertySortOption =
  | "newest"
  | "oldest"
  | "name-asc"
  | "name-desc"
  | "score-desc";

type GetPropertiesPageDataOptions = {
  search?: string;
  sort?: PropertySortOption;
};

export async function getPropertiesPageData({
  search = "",
  sort = "newest",
}: GetPropertiesPageDataOptions = {}) {
  const query = search.trim();

  return prisma.property.findMany({
    where:
      query.length > 0
        ? {
            OR: [
              {
                name: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                address: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                city: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                zone: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            ],
          }
        : undefined,

    orderBy: getPropertyOrderBy(sort),

    include: {
      owner: true,
      bookings: true,
      tasks: true,
    },
  });
}

function getPropertyOrderBy(sort: PropertySortOption) {
  if (sort === "oldest") {
    return {
      createdAt: "asc" as const,
    };
  }

  if (sort === "name-asc") {
    return {
      name: "asc" as const,
    };
  }

  if (sort === "name-desc") {
    return {
      name: "desc" as const,
    };
  }

  if (sort === "score-desc") {
    return {
      score: "desc" as const,
    };
  }

  return {
    createdAt: "desc" as const,
  };
}