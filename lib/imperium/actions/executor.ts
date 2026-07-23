import type { WorkflowContext } from "../workflow/types";
import { getAction } from "./registry";
import type { ImperiumActionResult } from "./types";

export async function executeAction(
  actionId: string,
  context: WorkflowContext
): Promise<ImperiumActionResult> {
  const action = getAction(actionId);

  if (!action) {
    return {
      actionId,
      actionName: actionId,
      success: false,
      error: `IMPERIUM action non registrata: ${actionId}`,
    };
  }

  try {
    return await action.execute(context);
  } catch (error) {
    return {
      actionId: action.id,
      actionName: action.name,
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Errore sconosciuto durante l'esecuzione dell'action.",
    };
  }
}

export async function executeActions(
  actionIds: string[],
  context: WorkflowContext
): Promise<ImperiumActionResult[]> {
  const results: ImperiumActionResult[] = [];

  for (const actionId of actionIds) {
    const result = await executeAction(actionId, context);
    results.push(result);

    if (!result.success) {
      break;
    }
  }

  return results;
}