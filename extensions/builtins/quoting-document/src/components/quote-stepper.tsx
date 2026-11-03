"use client"

import { cn } from "@starboard/lib-ui/lib/utils"

import {
  QUOTE_STEPS,
  stepIndex,
  type QuoteStepId,
} from "../lib/quote-builder-steps"

/**
 * Top stepper: Basics → Route → Cargo → Rates → Build. `blockedReason`
 * returns why a step cannot be entered yet (or null); blocked steps are
 * disabled with the reason as their tooltip. Going back is always open.
 */
export function QuoteStepper({
  current,
  blockedReason,
  onSelect,
  className,
}: {
  current: QuoteStepId
  blockedReason: (step: QuoteStepId) => string | null
  onSelect: (step: QuoteStepId) => void
  className?: string
}) {
  const currentIndex = stepIndex(current)
  return (
    <nav aria-label="Quote steps" className={cn("min-w-0", className)}>
      <ol className="flex min-w-0 items-center gap-1 overflow-x-auto">
        {QUOTE_STEPS.map((step, index) => {
          const active = step.id === current
          const reason = blockedReason(step.id)
          const blocked = reason !== null
          return (
            <li key={step.id} className="flex shrink-0 items-center gap-1">
              {index === 1 ? (
                <span
                  aria-hidden
                  className="mr-1 h-4 w-px bg-border"
                  title="Per lane"
                />
              ) : null}
              <button
                type="button"
                data-testid={`quote-step-${step.id}`}
                aria-current={active ? "step" : undefined}
                aria-disabled={blocked || undefined}
                disabled={blocked}
                title={reason ?? step.hint}
                onClick={() => onSelect(step.id)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  blocked && "opacity-50 hover:bg-transparent"
                )}
              >
                <span
                  className={cn(
                    "tabular-nums",
                    !active && index < currentIndex && "text-foreground"
                  )}
                >
                  {index + 1}
                </span>
                {step.label}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
