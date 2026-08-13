export type IcalBookingEvent = {
  uid: string;

  summary: string;

  start: Date;
  end: Date;

  status?: string;

  description?: string;
  location?: string;

  isAllDay: boolean;
};