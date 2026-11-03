import { isLaneReady, type LaneFormValues } from "./quotes.schema"

/**
 * Quote builder step model (ticket 089). Step 1 is quote-level; steps 2–5 walk
 * the active lane. Pure helpers — no React — so gates are unit-testable.
 */
export const QUOTE_STEPS = [
  {
    id: "basics",
    label: "Basics",
    scope: "quote",
    hint: "Customer, currency and terms for the whole quote.",
  },
  {
    id: "route",
    label: "Route",
    scope: "lane",
    hint: "Choose a mode and set where this lane starts and ends.",
  },
  {
    id: "cargo",
    label: "Cargo",
    scope: "lane",
    hint: "What is moving on this lane.",
  },
  {
    id: "rates",
    label: "Rates",
    scope: "lane",
    hint: "Find or add the rate for this lane.",
  },
  {
    id: "build",
    label: "Build",
    scope: "lane",
    hint: "Review charges, markup and totals.",
  },
] as const

export type QuoteStep = (typeof QUOTE_STEPS)[number]
export type QuoteStepId = QuoteStep["id"]
export type LaneStepId = Exclude<QuoteStepId, "basics">

export function stepIndex(id: QuoteStepId): number {
  return QUOTE_STEPS.findIndex((step) => step.id === id)
}

export function isLaneStep(id: QuoteStepId): id is LaneStepId {
  return id !== "basics"
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
 * Why `target` cannot be entered yet for `lane`, or `null` when open. Going
 * back is always open; going forward requires every earlier lane gate:
 * ports before Cargo, valid cargo before Rates / Build.
 */
export function stepBlockedReason(
  target: QuoteStepId,
  lane: LaneFormValues | undefined
): string | null {
  const index = stepIndex(target)
  if (index <= stepIndex("route")) {
    return null
  }
  if (!lane || !isLaneReady(lane)) {
    return "Set origin and destination first."
  }
  if (index > stepIndex("cargo") && !isCargoValid(lane)) {
    return "Add valid cargo first."
  }
  return null
}
