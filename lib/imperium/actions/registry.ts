import type { ImperiumAction } from "./types";

const actions = new Map<string, ImperiumAction>();

export function registerAction(
  action: ImperiumAction
): void {
  if (actions.has(action.id)) {
    throw new Error(
      `IMPERIUM action già registrata: ${action.id}`
    );
  }

  actions.set(action.id, action);
}

export function getAction(
  actionId: string
): ImperiumAction | undefined {
  return actions.get(actionId);
}

export function getRegisteredActions(): ImperiumAction[] {
  return Array.from(actions.values());
}