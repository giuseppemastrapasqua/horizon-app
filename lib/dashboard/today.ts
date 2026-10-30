type Stay = { bookingStatus:string;guestName:string;checkIn:Date;checkOut:Date };
export function dashboardDay(now:Date) {
  const key = new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const start = new Date(`${key}T00:00:00Z`);
  return {start,end:new Date(start.getTime()+86400000-1)};
}
export function operationalBookings<T extends Stay>(bookings:T[]):T[] {
  return bookings.filter(b=>['CONFIRMED','CHECKED_IN','CHECKED_OUT'].includes(b.bookingStatus)&&b.guestName!=='CLOSED');
}
/** Calendar dates are stored at UTC midnight; checkout releases the following night. */
export function bookedTonight(bookings:Stay[],start:Date,end:Date) {
  return operationalBookings(bookings).some(b=>b.checkIn<=end && b.checkOut>start);
}
