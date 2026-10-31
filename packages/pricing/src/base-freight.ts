/**
 * Lean base-freight row identity (SB-6190 / SB-5501).
 *
 * Stamp `isBaseFreight === true` wins; otherwise name allowlist unless vetoed.
 * Globals never claim the freight slot. Oracle:
 * `fixtures/base-freight-row-identity.json`.
 */

const BASE_NAME_VETO_SOURCES = new Set(["manual", "global"])
const ACCESSORIAL_LEG_TAGS = new Set(["origin", "destination", "globals"])

const BASE_SURCHARGE_PREFIXES = [
  "ocean freight",
  "basic ocean freight",
  "drayage base",
  "cartage base",
  "air freight",
  "consol ocean freight",
  "lcl freight",
  "all-in lcl ocean freight",
  "all-in air freight",
] as const

export type BaseFreightRowInput = {
  name?: string | null
  leg?: string | null
  source?: string | null
  isBaseFreight?: boolean | null
  isRemoved?: boolean | null
}

function normalizeBaseName(name: string | null | undefined): string | null {
  if (!name) {
    return null
  }
  const normalized = name.toLowerCase().replace(/_/g, " ").trim()
  if (normalized.includes("surcharge")) {
    return null
  }
  return normalized
}

/** Name-only allowlist (prefix / exact freight aliases). */
export function isBaseSurchargeName(name: string | null | undefined): boolean {
  const normalized = normalizeBaseName(name)
  if (!normalized) {
    return false
  }
  if (
    normalized === "freight" ||
    normalized === "cartage" ||
    normalized === "drayage"
  ) {
    return true
  }
  return BASE_SURCHARGE_PREFIXES.some(
    (prefix) =>
      normalized === prefix ||
      normalized.startsWith(`${prefix} `) ||
      normalized.startsWith(`${prefix}(`)
  )
}

/**
 * Broker/manual/global or accessorial-leg rows never win by name
 * (stamp still wins via {@link isBaseFreightRow}).
 */
export function vetoesBaseName(row: BaseFreightRowInput): boolean {
  return (
    BASE_NAME_VETO_SOURCES.has(row.source ?? "") ||
    ACCESSORIAL_LEG_TAGS.has((row.leg ?? "").toLowerCase())
  )
}

export function isBaseSurchargeRow(row: BaseFreightRowInput): boolean {
  return !vetoesBaseName(row) && isBaseSurchargeName(row.name)
}

/**
 * Stamp wins over name vetoes (SB-5501); name allowlist is the fallback.
 * Globals never claim the freight slot even when stamped (SB-2854 / fixture
 * oracle: `source !== 'global' && isBaseFreightRow`).
 */
export function isBaseFreightRow(row: BaseFreightRowInput): boolean {
  if (row.source === "global") {
    return false
  }
  return row.isBaseFreight === true || isBaseSurchargeRow(row)
}

/**
 * Elect the base-freight row: stamp → name allowlist → `leg === 'freight'`
 * without veto. Skips removed rows and `source === 'global'`.
 */
export function findBaseFreightRow<T extends BaseFreightRowInput>(
  rows: readonly T[]
): T | undefined {
  const candidate = (row: T): boolean =>
    row.source !== "global" && row.isRemoved !== true

  return (
    rows.find((row) => candidate(row) && row.isBaseFreight === true) ??
    rows.find((row) => candidate(row) && isBaseFreightRow(row)) ??
    rows.find(
      (row) => candidate(row) && row.leg === "freight" && !vetoesBaseName(row)
    )
  )
}
