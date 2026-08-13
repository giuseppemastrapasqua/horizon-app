type TimelineInput = {
  bookings: Array<{
    id: string;
    guestName: string;
    createdAt: Date;
    operationalStatus: string;
  }>;

  tasks: Array<{
    id: string;
    title: string;
    status: string;
    updatedAt: Date;
  }>;

  documents: Array<{
    id: string;
    title: string;
    status: string;
    updatedAt: Date;
  }>;
};

export function buildPropertyTimeline({
  bookings,
  tasks,
  documents,
}: TimelineInput) {
  const bookingItems = bookings.map((booking) => ({
    id: `booking-${booking.id}`,
    title: `Prenotazione ${booking.guestName}`,
    description: `Stato operativo: ${booking.operationalStatus}`,
    occurredAt: booking.createdAt,
    category: "BOOKING" as const,
    href: `/bookings/${booking.id}`,
    status:
      booking.operationalStatus === "OK"
        ? ("SUCCESS" as const)
        : ("WARNING" as const),
  }));

  const taskItems = tasks.map((task) => ({
    id: `task-${task.id}`,
    title: task.title,
    description: `Task · ${task.status}`,
    occurredAt: task.updatedAt,
    category: "TASK" as const,
    href: `/tasks/${task.id}`,
    status:
      task.status === "DONE"
        ? ("SUCCESS" as const)
        : task.status === "IN_PROGRESS"
          ? ("WARNING" as const)
          : ("INFO" as const),
  }));

  const documentItems = documents.map((document) => ({
    id: `document-${document.id}`,
    title: document.title,
    description: `Documento · ${document.status}`,
    occurredAt: document.updatedAt,
    category: "DOCUMENT" as const,
    href: `/documents/${document.id}`,
    status:
      document.status === "FINAL" ||
      document.status === "ISSUED"
        ? ("SUCCESS" as const)
        : ("INFO" as const),
  }));

  return [
    ...bookingItems,
    ...taskItems,
    ...documentItems,
  ]
    .sort(
      (first, second) =>
        second.occurredAt.getTime() -
        first.occurredAt.getTime(),
    )
    .slice(0, 10);
}