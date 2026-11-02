import type { ScopeBucket } from "./total-inclusion"

/**
 * Lean ocean FCL Incoterm × customer role matrix.
 *
 * `shipper`: buckets the seller does **not** pay are excluded from the sell total.
 * `consignee`: the inverse — buckets the seller already covers are excluded.
 *
 * Blank or unknown incoterm excludes nothing (existing quotes stay fully counted).
 * Quote-level globals stay in the total; `source: "global"` is immune in
 * `isIncludedInTotal` and is not a matrix bucket.
 *
 * Deferred: trucking remaps, DAT alias, and any non-ocean mode.
 */
export const OCEAN_INCOTERMS = [
  "EXW",
  "FCA",
  "FAS",
  "FOB",
  "CFR",
  "CIF",
  "CPT",
  "CIP",
  "DAP",
  "DPU",
  "DDP",
] as const

export type OceanIncoterm = (typeof OCEAN_INCOTERMS)[number]

export type IncotermCustomerRole = "shipper" | "consignee"

const ALL_BUCKETS: ScopeBucket[] = ["origin", "freight", "destination"]

/** Buckets excluded from a shipper-side sell total. */
const SHIPPER_EXCLUDED: Record<OceanIncoterm, ScopeBucket[]> = {
  EXW: ["origin", "freight", "destination"],
  FCA: ["freight", "destination"],
  FAS: ["freight", "destination"],
  FOB: ["freight", "destination"],
  CFR: ["destination"],
  CIF: ["destination"],
  CPT: ["destination"],
  CIP: ["destination"],
  DAP: [],
  DPU: [],
  DDP: [],
}

export function excludedBucketsForIncoterm(input: {
  incoterm: string | null | undefined
  role: string | null | undefined
}): ScopeBucket[] {
  const code = (input.incoterm ?? "").trim().toUpperCase() as OceanIncoterm
  const shipperExcluded = SHIPPER_EXCLUDED[code]
  if (!shipperExcluded) {
    return []
  }
  if (input.role === "consignee") {
    return ALL_BUCKETS.filter((bucket) => !shipperExcluded.includes(bucket))
  }
  return [...shipperExcluded]
}
