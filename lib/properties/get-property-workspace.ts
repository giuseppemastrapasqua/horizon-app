import { prisma } from "@/lib/prisma";

import { buildPropertyMetrics } from "@/lib/properties/build-property-metrics";
import { buildPropertyTimeline } from "@/lib/properties/build-property-timeline";
import { mapPropertyDocuments } from "@/lib/properties/map-property-documents";
import { mapPropertyDocumentsSummary } from "@/lib/properties/map-property-documents-summary";
import { mapRecentPropertyBookings } from "@/lib/properties/map-recent-property-bookings";
import { mapWorkspaceProperty } from "@/lib/properties/map-property-workspace";

export async function getPropertyWorkspace(
  propertyId: string,
) {
  const propertyData =
    await Promise.all([
      prisma.property.findUnique({
        where: {
          id: propertyId,
        },

        include: {
          owner: true,

          images: {
            orderBy: [
              {
                sortOrder:
                  "asc",
              },
              {
                createdAt:
                  "asc",
              },
            ],
          },

          amenities: {
            include: {
              amenity:
                true,
            },

            orderBy: {
              createdAt:
                "asc",
            },
          },

          houseRules: {
            include: {
              houseRule:
                true,
            },

            orderBy: {
              createdAt:
                "asc",
            },
          },

          checkInConfiguration:
            true,

          propertyCodeVerifications:
            {
              orderBy: {
                createdAt:
                  "desc",
              },

              take: 20,
            },

          integrationMappings:
            {
              orderBy: {
                provider:
                  "asc",
              },
            },
      ratePlans: {
        where: {
          active: true,
        },

        orderBy: [
          {
            isDefault: "desc",
          },
          {
            createdAt: "asc",
          },
        ],
      },

      bookings: {
            orderBy: {
              checkIn:
                "desc",
            },
          },

          tasks: {
            orderBy: {
              updatedAt:
                "desc",
            },
          },

          documents: {
            orderBy: {
              updatedAt:
                "desc",
            },

            take: 6,
          },

          propertyDocuments:
            {
              orderBy: [
                {
                  expiryDate:
                    "asc",
                },
                {
                  updatedAt:
                    "desc",
                },
              ],
            },
        },
      }),

      prisma.amenity.findMany({
        orderBy: [
          {
            category:
              "asc",
          },
          {
            sortOrder:
              "asc",
          },
          {
            label:
              "asc",
          },
        ],
      }),

      prisma.houseRule.findMany({
        orderBy: [
          {
            category:
              "asc",
          },
          {
            sortOrder:
              "asc",
          },
          {
            label:
              "asc",
          },
        ],
      }),
    ]);

  const [
    property,
    amenities,
    houseRules,
  ] = propertyData;

  if (!property) {
    return null;
  }

  const workspaceProperty =
    mapWorkspaceProperty(
      property,
    );

  const metrics =
    buildPropertyMetrics({
      bookings:
        property.bookings,

      tasks:
        property.tasks,

      documents:
        property.documents,
    });

  const recentBookings =
    mapRecentPropertyBookings(
      property.bookings,
    );

  const documents =
    mapPropertyDocumentsSummary(
      property.documents,
    );

  const propertyDocuments =
    mapPropertyDocuments(
      property.propertyDocuments,
    );

  const timeline =
    buildPropertyTimeline({
      bookings:
        property.bookings.slice(
          0,
          5,
        ),

      tasks:
        property.tasks.slice(
          0,
          5,
        ),

      documents:
        property.documents.slice(
          0,
          5,
        ),
    });

  const integrationMappings =
    property.integrationMappings.map(
      (mapping) => ({
        id:
          mapping.id,

        provider:
          mapping.provider,

        externalPropertyId:
          mapping.externalPropertyId,

        createdAt:
          mapping.createdAt,

        updatedAt:
          mapping.updatedAt,
      }),
    );

  /*
   * Dataset dedicato al calendario
   * premium della singola property.
   *
   * Convertiamo Date e Decimal in
   * valori serializzabili perché
   * PropertyCalendar è un Client
   * Component.
   */
  const revenueRatePlan =
    property.ratePlans[0]
      ? {
          id:
            property.ratePlans[0].id,

          name:
            property.ratePlans[0].name,

          code:
            property.ratePlans[0].code,

          basePrice:
            Number(
              property.ratePlans[0].basePrice,
            ),

          currency:
            property.ratePlans[0].currency,

          minimumStay:
            property.ratePlans[0].minimumStay,

          maximumStay:
            property.ratePlans[0].maximumStay,

          occupancyIncluded:
            property.ratePlans[0].occupancyIncluded,

          isDefault:
            property.ratePlans[0].isDefault,
        }
      : null;

  const calendarBookings =
    property.bookings.map(
      (booking) => ({
        id:
          booking.id,

        channel:
          booking.channel,

        guestName:
          booking.guestName,

        checkIn:
          booking.checkIn.toISOString(),

        checkOut:
          booking.checkOut.toISOString(),

        grossAmount:
          Number(
            booking.grossAmount,
          ),

        currency:
          booking.currency,

        bookingStatus:
          booking.bookingStatus,

        integrationConnectionId:
          booking.integrationConnectionId,
      }),
    );

  return {
  property:
    workspaceProperty,

  cleaningCost:
    Number(
      property.cleaningCost,
    ),

  amenities:
    amenities.map(
      (amenity) => ({
        id: amenity.id,
        key: amenity.key,
        label: amenity.label,
        category:
          amenity.category,
        description:
          amenity.description,
        isActive:
          amenity.isActive,
        sortOrder:
          amenity.sortOrder,
      }),
    ),

  houseRules:
    houseRules.map(
      (houseRule) => ({
        id: houseRule.id,
        key: houseRule.key,
        label: houseRule.label,
        category:
          houseRule.category,
        description:
          houseRule.description,
        isActive:
          houseRule.isActive,
        sortOrder:
          houseRule.sortOrder,
      }),
    ),

  integrationMappings,
  metrics,
  recentBookings,
  calendarBookings,
  revenueRatePlan,
  documents,
  propertyDocuments,
   timeline,
};
}


