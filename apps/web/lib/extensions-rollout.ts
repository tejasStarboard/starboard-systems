import type { ExtensionRolloutState } from "@starboard/ext-host"

export type RolloutContextValue = {
  organizationId: string
  rollouts: Map<string, ExtensionRolloutState>
}

/**
 * Load org rollout map. On failure return null (fail closed for shell + gates).
 * Missing map rows are still treated as "on" by @starboard/ext-host when context
 * is present — only infrastructure failure uses null.
 */
export async function loadRolloutContext(
  organizationId: string,
  getRolloutMap: () => Promise<Map<string, ExtensionRolloutState>>,
  onError?: (error: unknown) => void
): Promise<RolloutContextValue | null> {
  try {
    const rollouts = await getRolloutMap()
    return { organizationId, rollouts }
  } catch (error) {
    onError?.(error)
    return null
  }
}
