"use client"

import type { ComponentType, ReactNode } from "react"

import type { BuiltinHost, SlotContribution } from "../host"

/**
 * Host for `rates.slots.ingestActions`. Renders contributed UI factories
 * (e.g. `rates.ingestUpload` from optional `ingestion.*`). Fail closed.
 */
export const RATES_INGEST_ACTIONS_POINT = "rates.slots.ingestActions" as const

export function IngestActionsSlot({
  contributions = [],
  pointComponents = {},
  host,
  className,
}: {
  contributions?: readonly SlotContribution[]
  pointComponents?: Readonly<Record<string, ComponentType<never>>>
  host?: Pick<BuiltinHost, "openEditor">
  className?: string
}): ReactNode {
  const entries = contributions.flatMap((contribution) => {
    const key = contribution.component ?? contribution.id
    const Component = pointComponents[key] as
      | ComponentType<{
          contribution: SlotContribution
          host?: Pick<BuiltinHost, "openEditor">
        }>
      | undefined
    if (!Component) return []
    return [{ contribution, Component }]
  })

  if (entries.length === 0) {
    return null
  }

  return (
    <div data-rates-slot={RATES_INGEST_ACTIONS_POINT} className={className}>
      {entries.map(({ contribution, Component }) => (
        <Component
          key={contribution.id}
          contribution={contribution}
          host={host}
        />
      ))}
    </div>
  )
}
