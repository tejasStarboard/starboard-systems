"use client"

import { PlusIcon, TrashIcon } from "@phosphor-icons/react"
import type { FieldArrayWithId } from "react-hook-form"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import type { LaneFormValues, QuoteFormValues } from "@/lib/quotes/schema"

function laneListLabel(lane: LaneFormValues | undefined, index: number) {
  if (!lane) {
    return `Lane ${index + 1}`
  }
  const origin = lane.origin.trim()
  const destination = lane.destination.trim()
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

export function QuoteLanesPanel({
  variant,
  laneFields,
  lanes,
  selectedLaneIndex,
  onSelectLane,
  onAddLane,
  onRemoveLane,
}: {
  variant: "strip" | "sidebar"
  laneFields: FieldArrayWithId<QuoteFormValues, "lanes", "id">[]
  lanes: LaneFormValues[] | undefined
  selectedLaneIndex: number
  onSelectLane: (index: number) => void
  onAddLane: () => void
  onRemoveLane: (index: number) => void
}) {
  const isStrip = variant === "strip"

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col gap-2",
        isStrip ? "border-b pb-3" : "h-full w-64 border-l pl-4 xl:w-72"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium">Lanes</h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            {laneFields.length}
          </span>
        </div>
        {isStrip ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddLane}
          >
            <PlusIcon data-icon="inline-start" />
            Add lane
          </Button>
        ) : null}
      </div>

      <ul
        className={cn(
          "-mx-1 flex min-w-0 gap-1 px-1",
          isStrip
            ? "overflow-x-auto"
            : "min-h-0 flex-1 flex-col overflow-x-visible overflow-y-auto"
        )}
      >
        {laneFields.map((field, index) => {
          const lane = lanes?.[index]
          const selected = index === selectedLaneIndex
          return (
            <li
              key={field.id}
              className={cn("shrink-0", !isStrip && "w-full")}
            >
              <div
                className={cn(
                  "group flex items-start gap-1 rounded-md",
                  selected ? "bg-muted" : "hover:bg-muted/60"
                )}
              >
                <button
                  type="button"
                  className={cn(
                    "flex-1 px-2.5 py-2 text-left",
                    isStrip ? "min-w-[9.5rem]" : "min-w-0"
                  )}
                  onClick={() => onSelectLane(index)}
                >
                  <p className="truncate text-sm font-medium">
                    {laneListLabel(lane, index)}
                  </p>
                  <p className="text-[11px] text-muted-foreground uppercase">
                    {modeLabel(lane?.mode)}
                  </p>
                </button>
                {laneFields.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className={cn(
                      "mt-1 mr-1",
                      isStrip
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    )}
                    aria-label={`Remove lane ${index + 1}`}
                    onClick={() => onRemoveLane(index)}
                  >
                    <TrashIcon />
                  </Button>
                ) : null}
              </div>
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
        >
          <PlusIcon data-icon="inline-start" />
          Add lane
        </Button>
      ) : null}
    </aside>
  )
}
