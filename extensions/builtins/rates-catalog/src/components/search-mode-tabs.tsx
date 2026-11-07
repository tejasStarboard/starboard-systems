"use client"

import { Tabs, TabsList, TabsTrigger } from "@starboard/lib-ui/components/tabs"

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
    <Tabs defaultValue="fcl" aria-label="Search mode">
      <TabsList>
        {MODES.map((mode) => (
          <TabsTrigger
            key={mode.id}
            value={mode.id}
            disabled={!mode.enabled}
            title={mode.enabled ? undefined : "Coming soon"}
          >
            {mode.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
