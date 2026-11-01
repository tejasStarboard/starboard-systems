import type { ScopeBucket } from "./total-inclusion"

/**
 * Lean door → bucket scope: missing pickup/delivery doors drop that end's
 * charges from sell / rollup_buy totals (port/CY ends).
 */
export function deriveExcludedBuckets(input: {
  hasPickupDoor: boolean
  hasDeliveryDoor: boolean
}): ScopeBucket[] {
  const excluded: ScopeBucket[] = []
  if (!input.hasPickupDoor) {
    excluded.push("origin")
  }
  if (!input.hasDeliveryDoor) {
    excluded.push("destination")
  }
  return excluded
}
