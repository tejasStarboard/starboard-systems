"use client"

import type { ComponentType, ReactNode } from "react"

import type { SlotContribution } from "../host"
import type { SpotSourceProps } from "./spot-source"

/**
 * Host for `rates.slots.spotSearch`. Renders contributed UI factories
 * (e.g. `rates.spotSource` from optional `spot.*`). Fail closed — empty
 * contributions yield null so the editor can show a gated empty state.
 */
export const RATES_SPOT_SEARCH_POINT = "rates.slots.spotSearch" as const

export function SpotSearchSlot({
  contributions = [],
  pointComponents = {},
  origin,
  destination,
  className,
}: {
  contributions?: readonly SlotContribution[]
  pointComponents?: Readonly<Record<string, ComponentType<never>>>
  origin?: string
  destination?: string
  className?: string
}): ReactNode {
  const entries = contributions.flatMap((contribution) => {
    const key = contribution.component ?? contribution.id
    const Component = pointComponents[key] as
      ComponentType<SpotSourceProps> | undefined
    if (!Component) return []
    return [{ contribution, Component }]
  })

  if (entries.length === 0) {
    return null
  }

  return (
    <div data-rates-slot={RATES_SPOT_SEARCH_POINT} className={className}>
      {entries.map(({ contribution, Component }) => (
        <Component
          key={contribution.id}
          contribution={contribution}
          origin={origin}
          destination={destination}
        />
      ))}
    </div>
  )
}
