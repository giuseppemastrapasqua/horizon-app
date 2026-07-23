import {
  WorkspaceTimeline,
  type WorkspaceTimelineItem,
} from "../../../../components/ui/WorkspaceTimeline";

type BookingTimelineProps = {
  items: WorkspaceTimelineItem[];
};

export function BookingTimeline({
  items,
}: BookingTimelineProps) {
  return (
    <WorkspaceTimeline
      title="Timeline"
      subtitle="Cronologia completa della prenotazione."
      emptyTitle="Timeline vuota"
      emptyDescription="Gli eventi della prenotazione compariranno qui."
      items={items}
    />
  );
}