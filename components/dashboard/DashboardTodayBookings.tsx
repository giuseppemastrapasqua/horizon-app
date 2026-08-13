import { TodayBookingsPanel } from "@/components/dashboard/TodayBookingsPanel";
import type {
  DashboardTodayCheckIn,
  DashboardTodayCheckOut,
} from "@/lib/dashboard/types";

type DashboardTodayBookingsProps = {
  checkInsToday: DashboardTodayCheckIn[];
  checkOutsToday: DashboardTodayCheckOut[];
};

export function DashboardTodayBookings({
  checkInsToday,
  checkOutsToday,
}: DashboardTodayBookingsProps) {
  return (
    <>
      <TodayBookingsPanel
        title="Check-in di oggi"
        emptyTitle="Nessun check-in oggi"
        emptyDescription="Non risultano arrivi previsti per oggi."
        bookings={checkInsToday.map((booking) => ({
          id: booking.id,
          guestName: booking.guestName,
          propertyName: booking.property.name,
          date: booking.checkIn,
          channel: booking.channel,
          operationalStatus: booking.operationalStatus,
        }))}
      />

      <TodayBookingsPanel
        title="Check-out di oggi"
        emptyTitle="Nessun check-out oggi"
        emptyDescription="Non risultano partenze previste per oggi."
        bookings={checkOutsToday.map((booking) => ({
          id: booking.id,
          guestName: booking.guestName,
          propertyName: booking.property.name,
          date: booking.checkOut,
          channel: booking.channel,
          operationalStatus: booking.operationalStatus,
        }))}
      />
    </>
  );
}