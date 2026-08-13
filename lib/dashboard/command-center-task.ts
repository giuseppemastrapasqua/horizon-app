type OpenTask = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  dueDate: Date | null;
  property: {
    id: string;
    name: string;
  };
  booking: {
    id: string;
    guestName: string;
  } | null;
};

export function getPriorityTasks(
  tasks: OpenTask[],
  now: Date
) {
  return tasks
    .map((task) => {
      const dueDate = task.dueDate;

      return {
        id: task.id,
        title: task.title,
        description: task.description,
        type: task.type,
        status: task.status,
        dueDate,
        property: task.property,
        booking: task.booking,
        isOverdue:
          dueDate !== null &&
          dueDate < now,
      };
    })
    .sort((first, second) => {
      if (first.isOverdue && !second.isOverdue) {
        return -1;
      }

      if (!first.isOverdue && second.isOverdue) {
        return 1;
      }

      const firstDue =
        first.dueDate?.getTime() ??
        Number.MAX_SAFE_INTEGER;

      const secondDue =
        second.dueDate?.getTime() ??
        Number.MAX_SAFE_INTEGER;

      return firstDue - secondDue;
    });
}