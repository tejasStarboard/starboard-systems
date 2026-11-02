"use client"

import {
  createContext,
  useContext,
  useMemo,
  type ComponentType,
  type ReactNode,
} from "react"

import type {
  QuoteSlotContributions,
  SlotComponentProps,
  SlotContribution,
} from "./types"

/** UI factories keyed by contribution id / `component` (from `BuiltinHost`). */
export type SlotComponentRegistry = Readonly<
  Record<string, ComponentType<never>>
>

type SlotsContextValue = {
  slots: QuoteSlotContributions
  components: SlotComponentRegistry
}

const EMPTY: SlotsContextValue = { slots: {}, components: {} }
const QuoteSlotsContext = createContext<SlotsContextValue>(EMPTY)

export function QuoteSlotsProvider({
  slots,
  components,
  children,
}: SlotsContextValue & { children: ReactNode }) {
  const value = useMemo(() => ({ slots, components }), [slots, components])
  return (
    <QuoteSlotsContext.Provider value={value}>
      {children}
    </QuoteSlotsContext.Provider>
  )
}

type ResolvedEntry = {
  contribution: SlotContribution
  Component: ComponentType<Record<string, unknown>>
}

/**
 * Contributions that actually have a registered UI factory, in manifest order.
 * Fail closed: no contribution or no factory = nothing mounts.
 */
export function resolveSlotEntries(
  contributions: readonly SlotContribution[] | undefined,
  components: SlotComponentRegistry
): ResolvedEntry[] {
  const entries: ResolvedEntry[] = []
  for (const contribution of contributions ?? []) {
    const Component = components[contribution.component ?? contribution.id]
    if (Component) {
      entries.push({
        contribution,
        Component: Component as unknown as ResolvedEntry["Component"],
      })
    }
  }
  return entries
}

/** Resolved entries for a defined point (see `resolveSlotEntries`). */
export function useQuoteSlotEntries(pointId: string): ResolvedEntry[] {
  const { slots, components } = useContext(QuoteSlotsContext)
  const contributions = slots[pointId]
  return useMemo(
    () => resolveSlotEntries(contributions, components),
    [contributions, components]
  )
}

/**
 * Slot host: mounts every active contribution to `point` with `props`.
 * Renders nothing when empty.
 */
export function QuoteSlot<P extends object>({
  point,
  props,
  className,
}: {
  point: string
  props: P
  className?: string
}) {
  const entries = useQuoteSlotEntries(point)
  if (entries.length === 0) {
    return null
  }
  return (
    <div data-quote-slot={point} className={className}>
      {entries.map(({ contribution, Component }) => {
        const slotProps: SlotComponentProps<P> = { ...props, contribution }
        return <Component key={contribution.id} {...slotProps} />
      })}
    </div>
  )
}
