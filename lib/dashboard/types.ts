import type { getCommandCenter } from "@/lib/dashboard/get-command-center";
import type { getDashboardPageData } from "@/lib/dashboard/get-dashboard-page-data";

type CommandCenterData = Awaited<
  ReturnType<typeof getCommandCenter>
>;

type DashboardPageData = Awaited<
  ReturnType<typeof getDashboardPageData>
>;

export type DashboardTodayCheckIn =
  CommandCenterData["checkInsToday"][number];

export type DashboardTodayCheckOut =
  CommandCenterData["checkOutsToday"][number];

export type DashboardPriorityTask =
  CommandCenterData["priorityTasks"][number];

export type DashboardUpcomingCheckIn =
  DashboardPageData["nextCheckIns"][number];

export type DashboardUpcomingCheckOut =
  DashboardPageData["nextCheckOuts"][number];

export type DashboardUrgentTask =
  DashboardPageData["urgentTasks"][number];