"use client"

import type { ComponentType, ReactNode } from "react"

/**
 * Stub host for `rates.slots.ingestActions` (086). Renders nothing until an
 * extension contributes a UI factory (087 / ingestion). Fail closed.
 */
export const RATES_INGEST_ACTIONS_POINT = "rates.slots.ingestActions" as const

type Contribution = {
  id: string
  label?: string
  component?: string
  href?: string
}

export function IngestActionsSlot({
  contributions = [],
  pointComponents = {},
  className,
}: {
  contributions?: readonly Contribution[]
  pointComponents?: Readonly<Record<string, ComponentType<never> | unknown>>
  className?: string
}): ReactNode {
  const entries = contributions.flatMap((contribution) => {
    const key = contribution.component ?? contribution.id
    const Component = pointComponents[key] as
      ComponentType<{ contribution: Contribution }> | undefined
    if (!Component) return []
    return [{ contribution, Component }]
  })

  if (entries.length === 0) {
    return null
  }

  return (
    <div data-rates-slot={RATES_INGEST_ACTIONS_POINT} className={className}>
      {entries.map(({ contribution, Component }) => (
        <Component key={contribution.id} contribution={contribution} />
      ))}
    </div>
  )
}
