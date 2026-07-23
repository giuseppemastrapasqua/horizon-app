"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function markTaskDone(taskId: string) {
  await prisma.task.update({
    where: {
      id: taskId,
    },
    data: {
      status: "DONE",
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/");
}

export async function reopenTask(taskId: string) {
  await prisma.task.update({
    where: {
      id: taskId,
    },
    data: {
      status: "TODO",
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/");
}