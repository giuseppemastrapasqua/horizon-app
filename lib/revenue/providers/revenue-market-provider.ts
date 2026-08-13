export type RevenueMarketQuery = {
  propertyId: string;

  location: {
    city: string;
    zone?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };

  property: {
    maxGuests: number;
    bedrooms?: number | null;
    bathrooms?: number | null;
  };

  startDate: Date;
  endDate: Date;
};

export type RevenueMarketComparable = {
  externalListingId: string;
  name?: string | null;

  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;

  maxGuests?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;

  nightlyPrice?: number | null;
  adr?: number | null;
  occupancyRate?: number | null;

  similarityScore?: number | null;

  rawData?: unknown;
};

export type RevenueMarketDay = {
  date: Date;

  marketMedianPrice?: number | null;
  marketLowPrice?: number | null;
  marketHighPrice?: number | null;

  marketOccupancy?: number | null;

  competitorAvailability?: number | null;

  demandIndex?: number | null;

  eventScore?: number | null;

  confidence?: number | null;

  factors?: Record<string, unknown>;
};

export type RevenueMarketResult = {
  provider: string;

  capturedAt: Date;

  currency: string;

  market: {
    name?: string | null;

    adr?: number | null;
    occupancy?: number | null;
    revenue?: number | null;

    demandIndex?: number | null;
    bookingPace?: number | null;

    activeSupply?: number | null;
  };

  comparables: RevenueMarketComparable[];

  days: RevenueMarketDay[];

  rawData?: unknown;
};

export interface RevenueMarketProvider {
  readonly name: string;

  getMarketData(
    query: RevenueMarketQuery,
  ): Promise<RevenueMarketResult>;
}
