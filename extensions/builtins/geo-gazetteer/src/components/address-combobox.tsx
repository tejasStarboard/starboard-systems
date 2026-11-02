"use client"

import { useEffect, useMemo, useState } from "react"

import type { AddressPrediction, DoorAddress } from "@starboard/lib-contracts"
import { emptyDoorAddress, isDoorAddressEmpty } from "@starboard/lib-contracts"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@starboard/lib-ui/components/combobox"

const DEBOUNCE_MS = 300
const MIN_QUERY = 3

type AddressOption = AddressPrediction & { kind: "prediction" }

export function AddressCombobox({
  value,
  onChange,
  placeholder = "Search address…",
  invalid,
  id,
}: {
  value: DoorAddress
  onChange: (value: DoorAddress) => void
  placeholder?: string
  invalid?: boolean
  id?: string
}) {
  const [query, setQuery] = useState("")
  const [predictions, setPredictions] = useState<AddressPrediction[]>([])
  const [loading, setLoading] = useState(false)

  const selected = useMemo((): AddressOption | null => {
    if (isDoorAddressEmpty(value)) return null
    // Synthetic item for the committed door snapshot. Use label as placeId so
    // isItemEqualToValue can match after Places details resolve.
    return {
      kind: "prediction",
      placeId: value.label,
      description: value.label,
      mainText: value.label,
      secondaryText: [value.city, value.state, value.countryCode]
        .filter(Boolean)
        .join(", "),
    }
  }, [value])

  const items: AddressOption[] = useMemo(() => {
    const next = predictions.map((p) => ({ ...p, kind: "prediction" as const }))
    if (selected && !next.some((p) => p.placeId === selected.placeId)) {
      return [selected, ...next]
    }
    return next
  }, [predictions, selected])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < MIN_QUERY) {
      setPredictions([])
      return
    }

    const handle = window.setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ q: trimmed })
        const response = await fetch(`/api/geography/addresses?${params}`)
        if (!response.ok) return
        const body = (await response.json()) as {
          addresses?: AddressPrediction[]
        }
        setPredictions(body.addresses ?? [])
      } finally {
        setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => window.clearTimeout(handle)
  }, [query])

  async function selectPrediction(prediction: AddressPrediction) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ placeId: prediction.placeId })
      const response = await fetch(`/api/geography/addresses/details?${params}`)
      if (!response.ok) return
      const body = (await response.json()) as { address?: DoorAddress }
      if (!body.address) return
      onChange({
        ...body.address,
        label: body.address.label || prediction.description,
      })
      setQuery("")
      setPredictions([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Combobox
      items={items}
      filter={null}
      value={selected}
      onValueChange={(option) => {
        if (!option) {
          onChange(emptyDoorAddress())
          return
        }
        // Selected snapshot (already resolved) — ignore re-select.
        if (option.placeId === value.label) return
        void selectPrediction(option)
      }}
      onInputValueChange={(next) => {
        setQuery(next)
        if (!next.trim()) {
          onChange(emptyDoorAddress())
        }
      }}
      // Base UI: label → input display; value → form identity. Without label,
      // objects serialize as JSON in the input (no `{ value, label }` shape).
      itemToStringLabel={(option) => option.description}
      itemToStringValue={(option) => option.placeId}
      isItemEqualToValue={(a, b) => a.placeId === b.placeId}
    >
      <ComboboxInput
        id={id}
        className="w-full"
        placeholder={placeholder}
        aria-invalid={invalid}
        showClear={!isDoorAddressEmpty(value)}
      />
      <ComboboxContent className="w-(--anchor-width)">
        <ComboboxEmpty>
          {loading
            ? "Searching…"
            : query.trim().length < MIN_QUERY
              ? `Type at least ${MIN_QUERY} characters`
              : "No addresses found."}
        </ComboboxEmpty>
        <ComboboxList>
          {(option) => (
            <ComboboxItem key={option.placeId} value={option}>
              <span className="flex min-w-0 flex-col">
                <span className="truncate">
                  {option.mainText || option.description}
                </span>
                {option.secondaryText ? (
                  <span className="truncate text-xs text-muted-foreground">
                    {option.secondaryText}
                  </span>
                ) : null}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
