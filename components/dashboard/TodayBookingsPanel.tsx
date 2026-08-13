import { ActionButton } from "@/components/ui/ActionButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/format/date";

export type TodayBookingItem = {
  id: string;
  guestName: string;
  propertyName: string;
  date: Date;
  channel: string;
  operationalStatus: string;
};

type TodayBookingsPanelProps = {
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  bookings: TodayBookingItem[];
};

export function TodayBookingsPanel({
  title,
  emptyTitle,
  emptyDescription,
  bookings,
}: TodayBookingsPanelProps) {
  return (
    <Panel>
      <SectionTitle
        title={title}
        subtitle="Soggiorni pianificati nella giornata."
        action={
          <StatusBadge
            label={`${bookings.length} prenotazioni`}
            compact
          />
        }
      />

      {bookings.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
        />
      ) : (
        <div className="grid gap-3">
          {bookings.map((booking) => (
            <article
              key={booking.id}
              className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="min-w-0">
                <strong className="block truncate text-base font-semibold text-slate-950">
                  {booking.guestName}
                </strong>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {booking.propertyName} · {formatDateTime(booking.date)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  label={booking.channel}
                  tone="blue"
                  compact
                />

                <StatusBadge
                  label={booking.operationalStatus}
                  compact
                />

                <ActionButton
                  label="Apri"
                  href={`/bookings/${booking.id}`}
                  variant="secondary"
                  compact
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}