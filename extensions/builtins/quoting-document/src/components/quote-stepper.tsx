"use client"

import { Tabs, TabsList, TabsTrigger } from "@starboard/lib-ui/components/tabs"
import { cn } from "@starboard/lib-ui/lib/utils"

import {
  QUOTE_STEPS,
  stepIndex,
  type QuoteStepId,
} from "../lib/quote-builder-steps"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@starboard/lib-ui/components/tooltip"

/**
 * Top stepper: Route → Rate. `blockedReason` returns why a step cannot be
 * entered yet (or null); blocked steps are disabled with the reason as their
 * tooltip.
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
    <nav aria-label="Quote steps" className={cn("w-fit shrink-0", className)}>
      <Tabs
        value={current}
        onValueChange={(value) => onSelect(value as QuoteStepId)}
      >
        <TabsList className="h-auto w-fit justify-start gap-1 bg-transparent p-0">
          {QUOTE_STEPS.map((step, index) => {
            const reason = blockedReason(step.id)
            const blocked = reason !== null
            return (
              <TooltipProvider key={step.id}>
                <Tooltip>
                  <TooltipTrigger>
                    <TabsTrigger
                      value={step.id}
                      data-testid={`quote-step-${step.id}`}
                      disabled={blocked}
                      title={reason ?? step.hint}
                      className={cn(
                        "flex-none gap-1.5 px-2.5 py-1.5 data-active:bg-foreground data-active:text-background",
                        !blocked &&
                          index < currentIndex &&
                          "text-foreground data-active:bg-foreground"
                      )}
                    >
                      <span className="tabular-nums">{index + 1}</span>
                      {step.label}
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{step.hint}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          })}
        </TabsList>
      </Tabs>
    </nav>
  )
}
