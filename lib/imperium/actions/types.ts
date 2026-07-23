import type { WorkflowContext } from "../workflow/types";

export type ImperiumActionResult = {
  actionId: string;
  actionName: string;
  success: boolean;
  skipped?: boolean;
  data?: unknown;
  error?: string;
};

export type ImperiumAction = {
  id: string;
  name: string;
  description?: string;
  execute: (
    context: WorkflowContext
  ) => Promise<ImperiumActionResult>;
};