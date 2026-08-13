export type CalendarBooking = {
  id: string;

  channel:
    | "AIRBNB"
    | "BOOKING"
    | "DIRECT"
    | "VRBO"
    | "OTHER";

  guestName: string;

  checkIn: string;
  checkOut: string;

  grossAmount: number;
  currency: string;

  bookingStatus:
    | "PENDING"
    | "CONFIRMED"
    | "CHECKED_IN"
    | "CHECKED_OUT"
    | "CANCELLED";

  integrationConnectionId:
    | string
    | null;
};

export type CalendarPriceOverride = {
  id: string;
  startDate: string;
  endDate: string;

  nightlyPrice:
    | number
    | null;

  minimumStay:
    | number
    | null;

  maximumStay:
    | number
    | null;

  occupancyIncluded:
    | number
    | null;

  source:
    | "MANUAL"
    | "AI"
    | "RULE";

  createdAt: string;
};

export type CalendarAvailabilityBlock = {
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

export type CalendarRevenueData = {
  snapshot: {
    id: string;
    provider: string;
    marketName: string | null;
    currency: string;
    marketAdr: number | null;
    marketOccupancy: number | null;
    demandIndex: number | null;
    bookingPace: number | null;
    activeSupply: number | null;
    capturedAt: string;
  } | null;

  days: Array<{
    id: string;
    date: string;
    provider: string;
    currency: string;
    marketMedianPrice: number | null;
    marketLowPrice: number | null;
    marketHighPrice: number | null;
    marketOccupancy: number | null;
    competitorAvailability: number | null;
    demandIndex: number | null;
    propertyOccupancy: number | null;
    bookingPace: number | null;
    leadTimeDays: number | null;
    gapBeforeNights: number | null;
    gapAfterNights: number | null;
    eventScore: number | null;
    confidence: number | null;
  }>;

  comparables: Array<{
    id: string;
    provider: string;
    externalListingId: string;
    name: string | null;
    distanceKm: number | null;
    maxGuests: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    nightlyPrice: number | null;
    adr: number | null;
    occupancyRate: number | null;
    similarityScore: number | null;
  }>;
};

export type CalendarDay = {
  date: Date;
  dayNumber: number;
  currentMonth: boolean;
};

export type CalendarSegment = {
  booking: CalendarBooking;
  startColumn: number;
  endColumn: number;
  lane: number;
};

export type CalendarMetrics = {
  occupiedNights: number;
  freeNights: number;
  occupancyRate: number;
  bookingsCount: number;
  grossRevenue: number;
  currency: string;
};

export type PropertyCalendarProps = {
  propertyId: string;
  propertyName: string;

  bookings:
    CalendarBooking[];

  cleaningCost: number;

  priceOverrides:
    CalendarPriceOverride[];

  availabilityBlocks:
    CalendarAvailabilityBlock[];

  revenueData:
    CalendarRevenueData;

  savePricingAction:
    (
      formData: FormData,
    ) => Promise<void>;

  closePropertyAction:
    (
      formData: FormData,
    ) => Promise<void>;

  openPropertyAction:
    (
      formData: FormData,
    ) => Promise<void>;
};
