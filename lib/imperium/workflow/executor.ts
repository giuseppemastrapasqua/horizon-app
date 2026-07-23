import type { SystemEvent } from "@prisma/client";
import { getWorkflows } from "./registry";
import type {
  ImperiumWorkflow,
  WorkflowContext,
  WorkflowTrigger,
} from "./types";

export type WorkflowExecutionResult = {
  workflowId: string;
  workflowName: string;
  executed: boolean;
  skipped: boolean;
  actionsCompleted: number;
  error?: string;
};

export async function executeWorkflowsForEvent(
  event: SystemEvent
): Promise<WorkflowExecutionResult[]> {
  const trigger = event.eventType as WorkflowTrigger;

  const workflows = getWorkflows(trigger);

  const context: WorkflowContext = {
    event,
    correlationId: event.correlationId,
    causationId: event.causationId,
  };

  const results: WorkflowExecutionResult[] = [];

  for (const workflow of workflows) {
    const result = await executeWorkflow(
      workflow,
      context
    );

    results.push(result);
  }

  return results;
}

async function executeWorkflow(
  workflow: ImperiumWorkflow,
  context: WorkflowContext
): Promise<WorkflowExecutionResult> {
  try {
    const conditionsPassed =
      await evaluateConditions(workflow, context);

    if (!conditionsPassed) {
      return {
        workflowId: workflow.id,
        workflowName: workflow.name,
        executed: false,
        skipped: true,
        actionsCompleted: 0,
      };
    }

    let actionsCompleted = 0;

    for (const action of workflow.actions) {
      await action(context);
      actionsCompleted += 1;
    }

    return {
      workflowId: workflow.id,
      workflowName: workflow.name,
      executed: true,
      skipped: false,
      actionsCompleted,
    };
  } catch (error) {
    return {
      workflowId: workflow.id,
      workflowName: workflow.name,
      executed: false,
      skipped: false,
      actionsCompleted: 0,
      error:
        error instanceof Error
          ? error.message
          : "Errore sconosciuto durante il workflow.",
    };
  }
}

async function evaluateConditions(
  workflow: ImperiumWorkflow,
  context: WorkflowContext
) {
  if (!workflow.conditions?.length) {
    return true;
  }

  for (const condition of workflow.conditions) {
    const passed = await condition(context);

    if (!passed) {
      return false;
    }
  }

  return true;
}