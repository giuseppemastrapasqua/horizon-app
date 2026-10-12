export type IcalBookingEvent = {
  uid: string;

  summary: string;

  start: Date;
  end: Date;

  created?: Date;

  status?: string;

  description?: string;
  location?: string;

  isAllDay: boolean;
};