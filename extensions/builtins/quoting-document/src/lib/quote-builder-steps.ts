import { isLaneReady, type LaneFormValues } from "./quotes.schema"

/**
 * Per-lane step model (lane is parent; pick a lane, then walk these):
 * 1. Route — mode, ports, and cargo
 * 2. Rate — quote basics + rate pick + charges/totals
 */
export const QUOTE_STEPS = [
  {
    id: "route",
    label: "Route",
    scope: "lane",
    hint: "Set the lane route and what is moving.",
  },
  {
    id: "rate",
    label: "Rate",
    scope: "lane",
    hint: "Customer and currency, then pick a rate and review charges.",
  },
] as const

export type QuoteStep = (typeof QUOTE_STEPS)[number]
export type QuoteStepId = QuoteStep["id"]

export function stepIndex(id: QuoteStepId): number {
  return QUOTE_STEPS.findIndex((step) => step.id === id)
}

export function previousStep(id: QuoteStepId): QuoteStepId | null {
  return QUOTE_STEPS[stepIndex(id) - 1]?.id ?? null
}

export function nextStep(id: QuoteStepId): QuoteStepId | null {
  return QUOTE_STEPS[stepIndex(id) + 1]?.id ?? null
}

/** FCL needs a typed container with a count; LCL / Air need some cargo measure. */
export function isCargoValid(lane: LaneFormValues): boolean {
  if (lane.mode === "fcl") {
    return lane.containers.some(
      (line) => line.containerType.trim().length > 0 && line.count > 0
    )
  }
  return lane.weight > 0 || lane.volume > 0 || lane.palletCount > 0
}

/**
 * Why `target` cannot be entered yet for `lane`, or `null` when open.
 * Rate requires ports + valid cargo on the active lane.
 */
export function stepBlockedReason(
  target: QuoteStepId,
  lane: LaneFormValues | undefined
): string | null {
  if (target === "route") return null
  if (!lane || !isLaneReady(lane)) {
    return "Set origin and destination first."
  }
  if (!isCargoValid(lane)) {
    return "Add valid cargo first."
  }
  return null
}
