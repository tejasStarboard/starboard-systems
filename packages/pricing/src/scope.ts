import type { ScopeBucket } from "./total-inclusion"

/**
 * Door → bucket scope from ticket 068.
 * Quote totals use {@link excludedBucketsForIncoterm} instead. Door presence
 * is no longer the knock-out rule for origin/destination charges.
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
