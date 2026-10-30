/**
 * Effective billable usage after free/min/max constraints.
 *
 * Procedure (CR-1 / dossier): max caps raw → free subtracts → min floors.
 * Rows with raw ≤ max are order-invariant vs free→min→max.
 */
export function getEffectiveUsageAmount(input: {
  usageAmount: number
  freeUsage?: number | null
  minUsage?: number | null
  maxUsage?: number | null
}): number {
  if (!Number.isFinite(input.usageAmount)) {
    return 0
  }

  let effective = input.usageAmount

  if (input.maxUsage != null && effective > input.maxUsage) {
    effective = input.maxUsage
  }

  if (input.freeUsage != null && input.freeUsage > 0) {
    effective = Math.max(effective - input.freeUsage, 0)
  }

  if (input.minUsage != null && effective < input.minUsage) {
    effective = input.minUsage
  }

  return effective
}
