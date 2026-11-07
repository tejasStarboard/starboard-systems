"use client"

import { PlusIcon, QuestionIcon, TrashIcon } from "@phosphor-icons/react"
import type { FieldArrayWithId } from "react-hook-form"

import { Button } from "@starboard/lib-ui/components/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@starboard/lib-ui/components/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@starboard/lib-ui/components/tooltip"
import { cn } from "@starboard/lib-ui/lib/utils"

import type { QuoteStepId } from "../lib/quote-builder-steps"
import type {
  LaneFormValues,
  QuoteFormOption,
  QuoteFormValues,
} from "../lib/quotes.schema"

function portLabel(
  code: string,
  portOptions: QuoteFormOption[] | undefined
): string {
  const trimmed = code.trim()
  if (!trimmed) return ""
  const upper = trimmed.toUpperCase()
  const hit = portOptions?.find(
    (option) => option.value.trim().toUpperCase() === upper
  )
  return hit?.label?.trim() || upper
}

function laneListLabel(
  lane: LaneFormValues | undefined,
  index: number,
  portOptions: QuoteFormOption[] | undefined
) {
  if (!lane) {
    return `Lane ${index + 1}`
  }
  const origin = portLabel(lane.origin, portOptions)
  const destination = portLabel(lane.destination, portOptions)
  if (origin && destination) {
    return `${origin} → ${destination}`
  }
  if (origin || destination) {
    return origin || destination
  }
  return `Lane ${index + 1}`
}

function modeLabel(mode: LaneFormValues["mode"] | undefined) {
  if (mode === "fcl") return "FCL"
  if (mode === "lcl") return "LCL"
  if (mode === "air") return "Air"
  return "—"
}

function stepLabel(step: QuoteStepId | undefined) {
  return step === "rate" ? "Rate" : "Route"
}

export function QuoteLanesPanel({
  variant = "sidebar",
  laneFields,
  lanes,
  selectedLaneIndex,
  laneSteps,
  portOptions,
  onSelectLane,
  onAddLane,
  onRemoveLane,
  commercialEditable = true,
}: {
  /** `sidebar` beside the form; `strip` above it when the panel is narrow. */
  variant?: "sidebar" | "strip"
  laneFields: FieldArrayWithId<QuoteFormValues, "lanes", "id">[]
  lanes: LaneFormValues[] | undefined
  selectedLaneIndex: number
  /** Per-lane position in Route → Rate (keyed by RHF field id). */
  laneSteps?: Record<string, QuoteStepId>
  portOptions?: QuoteFormOption[]
  onSelectLane: (index: number) => void
  onAddLane: () => void
  onRemoveLane: (index: number) => void
  commercialEditable?: boolean
}) {
  const isStrip = variant === "strip"

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col gap-2",
        isStrip ? "border-b pb-3" : "h-full min-h-0 w-52 border-l pl-3 xl:w-60"
      )}
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {isStrip ? (
            <span className="text-xs tabular-nums">{laneFields.length}</span>
          ) : null}
          <h2 className="text-sm font-medium">Lanes</h2>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground"
                  aria-label="Lanes help"
                />
              }
            >
              <QuestionIcon className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-52 text-left">
              Select a lane, then complete its steps.
            </TooltipContent>
          </Tooltip>
        </div>
        {/* {isStrip ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddLane}
            disabled={!commercialEditable}
          >
            <PlusIcon data-icon="inline-start" />
            Add lane
          </Button>
        ) : null} */}
      </div>

      <ul
        className={cn(
          "-mx-1 flex min-w-0 gap-2 px-1",
          isStrip
            ? "overflow-x-auto"
            : "min-h-0 flex-1 flex-col overflow-y-auto"
        )}
      >
        {laneFields.map((field, index) => {
          const lane = lanes?.[index]
          const selected = index === selectedLaneIndex
          const laneStep = laneSteps?.[field.id] ?? "route"
          const canRemove = laneFields.length > 1 && commercialEditable
          return (
            <li key={field.id} className={cn("shrink-0", !isStrip && "w-full")}>
              <Card
                size="sm"
                role="button"
                tabIndex={0}
                aria-current={selected ? "true" : undefined}
                className={cn(
                  "group cursor-pointer py-0 transition-colors",
                  isStrip && "min-w-[14rem]",
                  selected ? "bg-muted ring-foreground/20" : "hover:bg-muted/60"
                )}
                onClick={() => onSelectLane(index)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    onSelectLane(index)
                  }
                }}
              >
                <CardHeader className="gap-0.5 px-2.5 py-2 has-data-[slot=card-action]:grid-cols-[minmax(0,1fr)_auto]">
                  <CardTitle className="truncate text-sm">
                    {laneListLabel(lane, index, portOptions)}
                  </CardTitle>
                  <CardDescription className="truncate text-[11px]">
                    <span className="uppercase">{modeLabel(lane?.mode)}</span>
                    <span aria-hidden> · </span>
                    <span
                      className={cn(
                        selected && "text-foreground",
                        laneStep === "rate" && "text-foreground/80"
                      )}
                    >
                      {stepLabel(laneStep)}
                    </span>
                  </CardDescription>
                  {canRemove ? (
                    <CardAction>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-sm"
                        className={cn(
                          "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                        )}
                        aria-label={`Remove lane ${index + 1}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          onRemoveLane(index)
                        }}
                      >
                        <TrashIcon />
                      </Button>
                    </CardAction>
                  ) : null}
                </CardHeader>
              </Card>
            </li>
          )
        })}
      </ul>

      {!isStrip ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-auto w-full"
          onClick={onAddLane}
          disabled={!commercialEditable}
        >
          <PlusIcon data-icon="inline-start" />
          Add lane
        </Button>
      ) : null}
    </aside>
  )
}
