import { planSchema, type Plan } from "./manifest.js"

/** Default org plan until an org row specifies otherwise. */
export const DEFAULT_PLAN: Plan = "credit"

/** Coerce unknown storage values to a valid Plan; invalid → DEFAULT_PLAN. */
export function parsePlan(value: unknown): Plan {
  const parsed = planSchema.safeParse(value)
  return parsed.success ? parsed.data : DEFAULT_PLAN
}
