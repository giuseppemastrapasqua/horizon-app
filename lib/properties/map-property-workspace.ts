import type {
  Amenity,
  HouseRule,
  Property,
  PropertyAmenity,
  PropertyCheckInConfiguration,
  PropertyCodeVerification,
  PropertyHouseRule,
  PropertyImage,
  User,
} from "@prisma/client";

type PropertyAmenityWithAmenity =
  PropertyAmenity & {
    amenity: Amenity;
  };

type PropertyHouseRuleWithHouseRule =
  PropertyHouseRule & {
    houseRule: HouseRule;
  };

export type WorkspacePropertyInput = Property & {
  owner: User;
  images: PropertyImage[];
  amenities: PropertyAmenityWithAmenity[];
  houseRules: PropertyHouseRuleWithHouseRule[];
  checkInConfiguration:
    | PropertyCheckInConfiguration
    | null;
  propertyCodeVerifications:
    PropertyCodeVerification[];
};

export function mapWorkspaceProperty(
  property: WorkspacePropertyInput,
) {
  return {
    id: property.id,
    name: property.name,
    address: property.address,
    city: property.city,
    zone: property.zone,
    description: property.description,
    cleaningCost: property.cleaningCost,
    status: property.status,
    commercialClass: property.commercialClass,
    victoryModel: property.victoryModel,
    currentScore: property.currentScore,
    initialScore: property.initialScore,
    maxGuests: property.maxGuests,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    createdAt: property.createdAt,

    cin: property.cin,
    cir: property.cir,
    codeVerificationStatus:
      property.codeVerificationStatus,
    codeVerifiedAt: property.codeVerifiedAt,
    codeVerificationNotes:
      property.codeVerificationNotes,

    propertyCodeVerifications:
      property.propertyCodeVerifications.map(
        (verification) => ({
          id: verification.id,
          propertyId: verification.propertyId,
          provider: verification.provider,
          cin: verification.cin,
          cir: verification.cir,
          status: verification.status,
          notes: verification.notes,
          rawResponse: verification.rawResponse,
          createdAt: verification.createdAt,
        }),
      ),

    images: property.images.map((image) => ({
      id: image.id,
      url: image.url,
      filename: image.filename,
      caption: image.caption,
      sortOrder: image.sortOrder,
      isCover: image.isCover,
      width: image.width,
      height: image.height,
      createdAt: image.createdAt,
    })),

    amenities: property.amenities.map(
      (propertyAmenity) => ({
        id: propertyAmenity.id,
        amenityId: propertyAmenity.amenityId,
        createdAt: propertyAmenity.createdAt,
        amenity: {
          id: propertyAmenity.amenity.id,
          key: propertyAmenity.amenity.key,
          label: propertyAmenity.amenity.label,
          category:
            propertyAmenity.amenity.category,
          description:
            propertyAmenity.amenity.description,
          isActive:
            propertyAmenity.amenity.isActive,
          sortOrder:
            propertyAmenity.amenity.sortOrder,
        },
      }),
    ),

    amenityIds: property.amenities.map(
      (propertyAmenity) =>
        propertyAmenity.amenityId,
    ),

    houseRules: property.houseRules.map(
      (propertyHouseRule) => ({
        id: propertyHouseRule.id,
        houseRuleId:
          propertyHouseRule.houseRuleId,
        createdAt:
          propertyHouseRule.createdAt,
        houseRule: {
          id: propertyHouseRule.houseRule.id,
          key: propertyHouseRule.houseRule.key,
          label:
            propertyHouseRule.houseRule.label,
          category:
            propertyHouseRule.houseRule.category,
          description:
            propertyHouseRule.houseRule.description,
          isActive:
            propertyHouseRule.houseRule.isActive,
          sortOrder:
            propertyHouseRule.houseRule.sortOrder,
        },
      }),
    ),

    houseRuleIds: property.houseRules.map(
      (propertyHouseRule) =>
        propertyHouseRule.houseRuleId,
    ),

    checkInConfiguration:
      property.checkInConfiguration
        ? {
            id: property.checkInConfiguration.id,
            propertyId:
              property.checkInConfiguration
                .propertyId,
            checkInType:
              property.checkInConfiguration
                .checkInType,
            arrivalInstructions:
              property.checkInConfiguration
                .arrivalInstructions,
            accessInstructions:
              property.checkInConfiguration
                .accessInstructions,
            buildingAccessCode:
              property.checkInConfiguration
                .buildingAccessCode,
            apartmentAccessCode:
              property.checkInConfiguration
                .apartmentAccessCode,
            wifiName:
              property.checkInConfiguration.wifiName,
            wifiPassword:
              property.checkInConfiguration
                .wifiPassword,
            emergencyContactName:
              property.checkInConfiguration
                .emergencyContactName,
            emergencyContactPhone:
              property.checkInConfiguration
                .emergencyContactPhone,
            parkingInstructions:
              property.checkInConfiguration
                .parkingInstructions,
            additionalNotes:
              property.checkInConfiguration
                .additionalNotes,
            createdAt:
              property.checkInConfiguration
                .createdAt,
            updatedAt:
              property.checkInConfiguration
                .updatedAt,
          }
        : null,

    owner: {
      id: property.owner.id,
      fullName: property.owner.fullName,
      email: property.owner.email,
      phone: property.owner.phone,
    },
  };
}