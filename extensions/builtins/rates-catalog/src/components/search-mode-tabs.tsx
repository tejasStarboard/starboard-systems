"use client"

import { cn } from "@starboard/lib-ui/lib/utils"

const MODES = [
  { id: "fcl", label: "Ocean FCL", enabled: true },
  { id: "lcl", label: "Ocean LCL", enabled: false },
  { id: "drayage", label: "Drayage", enabled: false },
  { id: "cartage", label: "Cartage", enabled: false },
  { id: "air", label: "Air", enabled: false },
] as const

/**
 * Prod-shaped mode bar: FCL active; other modes disabled until later tickets.
 */
export function SearchModeTabs() {
  return (
    <div
      role="tablist"
      aria-label="Search mode"
      className="flex flex-wrap gap-1"
    >
      {MODES.map((mode) => (
        <button
          key={mode.id}
          type="button"
          role="tab"
          aria-selected={mode.enabled}
          disabled={!mode.enabled}
          title={mode.enabled ? undefined : "Coming soon"}
          className={cn(
            "rounded-md border px-2.5 py-1.5 text-xs font-medium",
            mode.enabled
              ? "border-foreground bg-foreground text-background"
              : "cursor-not-allowed border-border text-muted-foreground opacity-60"
          )}
        >
          {mode.label}
        </button>
      ))}
    </div>
  )
}
