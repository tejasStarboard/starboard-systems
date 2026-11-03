import type { PortOption } from "./options"

/**
 * Shallow-merge two views of the same port. `over` wins, but its missing
 * (`undefined` / `null`) fields never wipe data the base already has — e.g. a
 * seed `{ value, label }` must not drop lat/lng from an API hit.
 */
export function mergePortOption(
  base: PortOption | undefined,
  over: PortOption
): PortOption {
  if (!base) return over
  const merged: PortOption = { ...base }
  for (const [key, val] of Object.entries(over)) {
    if (val !== undefined && val !== null) {
      ;(merged as Record<string, unknown>)[key] = val
    }
  }
  return merged
}

/** Merge `over` into `map` by `value`, preserving geo already in the map. */
export function mergePortInto(
  map: Map<string, PortOption>,
  over: PortOption
): void {
  map.set(over.value, mergePortOption(map.get(over.value), over))
}
