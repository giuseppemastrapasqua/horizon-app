import type { BookingGuestGender, BookingGuestRole } from "@prisma/client";

export type Ross1000MovementGuestInput = {
  id: string;
  ross1000Idswh: string;
  role: BookingGuestRole;
  firstName: string;
  lastName: string;
  gender: BookingGuestGender;
  birthDate: Date;
  birthCity: string | null;
  birthProvince: string | null;
  birthCountry: string;
  citizenship: string;
  residenceCountry: string | null;
  residenceCity: string | null;
  residenceProvince: string | null;
};

export type Ross1000MovementBookingInput = {
  id: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  tourismType: string;
  transportType: string;
  roomsOccupied: number;
  bookingGuests: Ross1000MovementGuestInput[];
};

export type Ross1000MovementPropertyInput = {
  structureCode: string;
  roomsAvailable: number;
  bedsAvailable: number;
  isOpen: boolean;
};

export type Ross1000MovementGeneratorInput = {
  product: string;
  movementDate: Date;
  property: Ross1000MovementPropertyInput;
  bookings: Ross1000MovementBookingInput[];
};
