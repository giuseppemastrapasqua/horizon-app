import type {
  ImperiumWorkflow,
  WorkflowTrigger,
} from "./types";

const workflows: ImperiumWorkflow[] = [];

export function registerWorkflow(
  workflow: ImperiumWorkflow
) {
  workflows.push({
    enabled: true,
    priority: 100,
    ...workflow,
  });
}

export function getWorkflows(
  trigger: WorkflowTrigger
) {
  return workflows
    .filter(
      (workflow) =>
        workflow.enabled &&
        workflow.trigger === trigger
    )
    .sort(
      (first, second) =>
        (first.priority ?? 100) -
        (second.priority ?? 100)
    );
}

export function getRegisteredWorkflows() {
  return [...workflows];
}