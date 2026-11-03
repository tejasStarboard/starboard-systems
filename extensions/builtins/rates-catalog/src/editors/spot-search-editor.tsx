"use client"

import { useState } from "react"

import { PortCombobox } from "@starboard/ext-geo-gazetteer"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@starboard/lib-ui/components/field"

import type { BuiltinEditorProps } from "../host"
import { RATES_SPOT_SEARCH_POINT, SpotSearchSlot } from "../slots/spot-search"

/**
 * `rate.spotSearch` editor: standalone spot offer search (ticket 098).
 * No quote document — lane ports are local; apply-to-lane stays on quote
 * `quoting.slots.rateSources`.
 */
export function SpotSearchEditor({ host }: BuiltinEditorProps) {
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const contributions = host.slots?.[RATES_SPOT_SEARCH_POINT] ?? []

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-1">
        <h1 className="text-sm font-medium">Spot search</h1>
        <p className="text-sm text-muted-foreground">
          Query live or fixture spot offers without opening a quote. Apply to a
          lane from the quote Rates step.
        </p>
      </div>

      <FieldGroup className="grid max-w-2xl gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="spot-search-origin">Origin port</FieldLabel>
          <PortCombobox
            id="spot-search-origin"
            value={origin}
            onChange={setOrigin}
            placeholder="UNLOCODE"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="spot-search-destination">
            Destination port
          </FieldLabel>
          <PortCombobox
            id="spot-search-destination"
            value={destination}
            onChange={setDestination}
            placeholder="UNLOCODE"
          />
        </Field>
      </FieldGroup>

      {contributions.length === 0 ? (
        <p
          role="status"
          className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground"
        >
          No spot rate sources are available for this organization. Enable a
          spot extension or check your plan — Search Rates and Rate Sheets still
          work without spot.
        </p>
      ) : (
        <SpotSearchSlot
          contributions={contributions}
          pointComponents={host.pointComponents ?? {}}
          origin={origin || undefined}
          destination={destination || undefined}
          className="max-w-2xl space-y-3"
        />
      )}
    </div>
  )
}
