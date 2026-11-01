import { z } from "zod"

/** Leg bucket for charge lines. Quote-level globals use `source: "global"`. */
export const surchargeLegSchema = z.enum(["origin", "freight", "destination"])
export type SurchargeLeg = z.infer<typeof surchargeLegSchema>

/**
 * Billing unit vocabulary (lean rewrite subset of prod UsageUnit + percentage).
 * `unknown` is for ingest reject/flag — never silently bill as flat.
 */
export const usageUnitSchema = z.enum([
  "flat",
  "container",
  "teu",
  "cbm",
  "kg",
  "ton",
  "wm",
  "pallet",
  "per_time",
  "percentage",
  "unknown",
])
export type UsageUnit = z.infer<typeof usageUnitSchema>

/** Row provenance — aligned with pricing inclusion fixtures. */
export const surchargeSourceSchema = z.enum([
  "carrier",
  "breakdown",
  "manual",
  "global",
  "added",
])
export type SurchargeSource = z.infer<typeof surchargeSourceSchema>

export const scopeOverrideSchema = z.enum(["include", "exclude"])
export type ScopeOverride = z.infer<typeof scopeOverrideSchema>

/** Lean surcharge / charge line (prod qv2_surcharge subset). */
export const surchargeLineSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  leg: surchargeLegSchema,
  usageUnit: usageUnitSchema,
  rate: z.number().nullable(),
  ratePercentage: z.number().nullable(),
  currencyCode: z.string().length(3),
  source: surchargeSourceSchema,
  isIncludedInTotal: z.boolean(),
  isRemoved: z.boolean(),
  isVisible: z.boolean(),
  freeUsage: z.number().nullable(),
  minUsage: z.number().nullable(),
  maxUsage: z.number().nullable(),
  buyAmount: z.number().nullable(),
  sellAmount: z.number().nullable(),
  scopeOverride: scopeOverrideSchema.nullable(),
})

export type SurchargeLine = z.infer<typeof surchargeLineSchema>

export function createSurchargeLine(
  overrides?: Partial<SurchargeLine>
): SurchargeLine {
  return {
    id: crypto.randomUUID(),
    name: "",
    leg: "freight",
    usageUnit: "flat",
    rate: null,
    ratePercentage: null,
    currencyCode: "USD",
    source: "manual",
    isIncludedInTotal: true,
    isRemoved: false,
    isVisible: true,
    freeUsage: null,
    minUsage: null,
    maxUsage: null,
    buyAmount: null,
    sellAmount: null,
    scopeOverride: null,
    ...overrides,
  }
}
