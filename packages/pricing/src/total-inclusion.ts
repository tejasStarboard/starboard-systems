export type TotalKind = "sell" | "buy" | "rollup_buy"

export type ScopeBucket = "origin" | "freight" | "destination"

export type SurchargeFlagInput = {
  is_removed?: boolean | null
  is_visible?: boolean | null
  is_included_in_total?: boolean | null
  leg?: string | null
  scope_override?: "include" | "exclude" | null
  source?: string | null
}

export type LegContext = {
  excluded_by_incoterm?: boolean | null
}

export type ScopeContext = {
  excluded_buckets?: readonly ScopeBucket[] | null
}

type ResolvedFlags = {
  is_removed: boolean
  is_visible: boolean
  is_included_in_total: boolean
}

function isOperatorRow(surcharge: SurchargeFlagInput): boolean {
  return surcharge.source === "global" || surcharge.source === "manual"
}

function scopeExcluded(
  surcharge: SurchargeFlagInput,
  scope?: ScopeContext | null
): boolean {
  if (surcharge.scope_override === "exclude") {
    return true
  }
  if (surcharge.scope_override === "include") {
    return false
  }
  // Quote-level globals are immune to origin/freight/destination bucket scope.
  if (surcharge.source === "global") {
    return false
  }
  const buckets = scope?.excluded_buckets
  if (!buckets || buckets.length === 0) {
    return false
  }
  const leg = surcharge.leg
  if (leg !== "origin" && leg !== "freight" && leg !== "destination") {
    return false
  }
  return buckets.includes(leg)
}

function normalizeFlags(input: SurchargeFlagInput): ResolvedFlags {
  return {
    is_removed: input.is_removed === true,
    is_visible: input.is_visible !== false,
    is_included_in_total: input.is_included_in_total !== false,
  }
}

function evaluateFlags(
  flags: ResolvedFlags,
  totalKind: TotalKind,
  excludedByIncoterm: boolean,
  isScopeExcluded = false,
  operatorRow = false
): boolean {
  if (flags.is_removed) {
    return false
  }
  if (totalKind === "buy") {
    return !operatorRow || flags.is_included_in_total
  }
  if (excludedByIncoterm) {
    return false
  }
  if (isScopeExcluded) {
    return false
  }
  if (!flags.is_included_in_total) {
    return false
  }
  return true
}

/**
 * Whether a surcharge amount lands in the given total kind.
 * `is_visible` is presentation-only and is not read for math.
 */
export function isIncludedInTotal(
  surcharge: SurchargeFlagInput,
  leg: LegContext,
  totalKind: TotalKind,
  scope?: ScopeContext | null
): boolean {
  return evaluateFlags(
    normalizeFlags(surcharge),
    totalKind,
    leg.excluded_by_incoterm === true,
    scopeExcluded(surcharge, scope),
    isOperatorRow(surcharge)
  )
}
