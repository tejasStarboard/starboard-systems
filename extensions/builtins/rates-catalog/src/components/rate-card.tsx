"use client"

import { useState, type ReactNode } from "react"

import { Button } from "@starboard/lib-ui/components/button"
import { cn } from "@starboard/lib-ui/lib/utils"

import { carrierMonogram, type RateCardModel } from "../lib/rate-card-model"

function formatAmount(amount: number, currencyCode: string) {
  try {
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: currencyCode,
    })
  } catch {
    // Unknown / malformed currency code: show the number and the raw code.
    return `${amount.toLocaleString("en-US")} ${currencyCode}`
  }
}

/** Carrier logo when a URL is known and loads; otherwise a monogram tile. */
export function CarrierLogo({
  carrier,
  logoUrl,
}: {
  carrier: string | null
  logoUrl?: string
}) {
  const [failed, setFailed] = useState(false)
  if (logoUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- carrier logo URLs are arbitrary; no next/image loader config.
      <img
        src={logoUrl}
        alt=""
        className="size-9 shrink-0 border border-border bg-background object-contain"
        onError={() => setFailed(true)}
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      data-testid="carrier-monogram"
      className="flex size-9 shrink-0 items-center justify-center border border-border bg-muted text-xs font-semibold text-muted-foreground"
    >
      {carrierMonogram(carrier)}
    </span>
  )
}

/**
 * Uber-style rate card: carrier, amount, optional schedule chips, Select.
 * The selected card elevates (ring + shadow + lift).
 */
export function RateCard({
  card,
  selected,
  onSelect,
}: {
  card: RateCardModel
  selected: boolean
  onSelect: () => void
}) {
  return (
    <article
      data-rate-card={card.key}
      data-selected={selected ? "true" : undefined}
      aria-label={`${card.carrier ?? card.title} ${formatAmount(card.amount, card.currencyCode)}`}
      className={cn(
        "flex w-64 shrink-0 snap-start flex-col gap-3 border bg-card p-3 text-card-foreground transition-all",
        selected
          ? "-translate-y-0.5 border-primary shadow-lg ring-2 ring-primary"
          : "border-border hover:border-foreground/30"
      )}
    >
      <div className="flex items-center gap-2">
        <CarrierLogo carrier={card.carrier} logoUrl={card.logoUrl} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {card.carrier ?? card.title}
          </p>
          {card.carrier ? (
            <p className="truncate text-xs text-muted-foreground">
              {card.title}
            </p>
          ) : null}
        </div>
      </div>

      <p className="text-xl font-semibold tabular-nums">
        {formatAmount(card.amount, card.currencyCode)}
        <span className="ml-1 text-xs font-normal text-muted-foreground">
          {card.currencyCode}
        </span>
      </p>

      {card.chips.length > 0 ? (
        <ul className="flex flex-wrap gap-1" data-testid="rate-card-chips">
          {card.chips.map((chip) => (
            <li
              key={chip.kind}
              data-chip={chip.kind}
              className="border border-border px-1.5 py-0.5 text-[11px] leading-4"
            >
              <span className="text-muted-foreground">{chip.label}</span>{" "}
              {chip.value}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-auto flex flex-col gap-0.5 text-[11px] text-muted-foreground">
        {card.lane ? <span className="truncate">{card.lane}</span> : null}
        {card.validity ? <span>{card.validity}</span> : null}
      </div>

      <Button
        type="button"
        size="sm"
        variant={selected ? "default" : "outline"}
        aria-pressed={selected}
        onClick={selected ? undefined : onSelect}
      >
        {selected ? "Selected" : "Select"}
      </Button>
    </article>
  )
}

/**
 * Horizontal snap-scroll rail on mobile; wraps into a grid-like flow from `md`.
 */
export function RateCardRail({ children }: { children: ReactNode }) {
  return (
    <div
      data-testid="rate-card-rail"
      className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pt-1 pb-3 md:flex-wrap md:overflow-visible"
    >
      {children}
    </div>
  )
}
