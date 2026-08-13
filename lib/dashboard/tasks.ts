type TaskLike = {
  status: string;
};

export function getOpenTasks<TTask extends TaskLike>(
  tasks: TTask[]
) {
  return tasks.filter(
    (task) => task.status !== "DONE"
  );
}

export function getCompletedTasks<TTask extends TaskLike>(
  tasks: TTask[]
) {
  return tasks.filter(
    (task) => task.status === "DONE"
  );
}

export function getUrgentTasks<TTask>(
  tasks: TTask[],
  limit = 4
) {
  return tasks.slice(0, limit);
}