/** `beta` = custom per-extension allowlist; `common` = shared platform beta list. */
export type RolloutMode = "off" | "common" | "beta" | "on"

export type ExtensionRolloutState = {
  mode: RolloutMode
  /**
   * Org ids allowed when mode is `beta` or `common`
   * (common list is resolved before calling isRolloutAllowed).
   */
  organizationIds: readonly string[]
}

export function parseRolloutMode(
  value: string | null | undefined
): RolloutMode {
  if (
    value === "off" ||
    value === "common" ||
    value === "beta" ||
    value === "on"
  ) {
    return value
  }
  return "on"
}

/** Missing rollout row = on for all entitled orgs (preserve deploy defaults). */
export function isRolloutAllowed(
  state: ExtensionRolloutState | undefined,
  organizationId: string
): boolean {
  if (!state) {
    return true
  }
  if (state.mode === "off") {
    return false
  }
  if (state.mode === "on") {
    return true
  }
  return state.organizationIds.includes(organizationId)
}
