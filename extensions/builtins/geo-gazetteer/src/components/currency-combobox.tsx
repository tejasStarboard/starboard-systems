"use client"

import { useEffect, useMemo, useState } from "react"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@starboard/lib-ui/components/combobox"
import { cn } from "@starboard/lib-ui/lib/utils"

import type { ComboboxOption } from "../lib/options"

let currencyRequest: Promise<ComboboxOption[] | null> | null = null

/**
 * One `GET /api/geography/currencies` per page session (geography seeds ISO).
 * Resolves `null` on failure and clears the cache so the next call retries.
 */
function loadCurrencyOptions(): Promise<ComboboxOption[] | null> {
  currencyRequest ??= fetch("/api/geography/currencies")
    .then(async (response) => {
      if (!response.ok) throw new Error("currencies unavailable")
      const body = (await response.json()) as { currencies?: ComboboxOption[] }
      return body.currencies ?? []
    })
    .catch(() => {
      currencyRequest = null
      return null
    })
  return currencyRequest
}

/**
 * Searchable ISO currency picker (quote base, charge-line CCY, org default).
 * Options come from geography via the BFF, merged with any seed options; the
 * current value always stays selectable. Input shows the 3-letter code; the
 * list shows `USD — US Dollar` and matches code or name.
 */
export function CurrencyCombobox({
  options: seedOptions = [],
  value,
  onChange,
  placeholder = "Search currency …",
  invalid,
  disabled,
  id,
  className,
}: {
  options?: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  invalid?: boolean
  disabled?: boolean
  id?: string
  className?: string
}) {
  const [loaded, setLoaded] = useState<ComboboxOption[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)

  // Failure keeps `loaded` empty and unlocks a retry (Retry button, or the
  // next time the list opens) instead of freezing an empty list.
  useEffect(() => {
    let active = true
    setLoading(true)
    void loadCurrencyOptions().then((next) => {
      if (!active) return
      if (next) setLoaded(next)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [attempt])

  const options = useMemo(() => {
    const byValue = new Map<string, ComboboxOption>()
    for (const option of loaded ?? []) byValue.set(option.value, option)
    for (const option of seedOptions) {
      if (!byValue.has(option.value)) byValue.set(option.value, option)
    }
    const code = value.trim().toUpperCase()
    if (code && !byValue.has(code))
      byValue.set(code, { value: code, label: code })
    return [...byValue.values()].sort((a, b) => a.value.localeCompare(b.value))
  }, [loaded, seedOptions, value])

  const selected =
    options.find((option) => option.value === value.trim().toUpperCase()) ??
    null

  return (
    <Combobox
      items={options}
      value={selected}
      disabled={disabled}
      onOpenChange={(open) => {
        if (open && !loading && loaded === null) setAttempt((n) => n + 1)
      }}
      onValueChange={(option) => {
        onChange((option as ComboboxOption | null)?.value ?? "")
      }}
      filter={(option, query) =>
        option.label.toLowerCase().includes(query.trim().toLowerCase())
      }
      itemToStringLabel={(option) => option.label}
      itemToStringValue={(option) => option.value}
      isItemEqualToValue={(a, b) => a.value === b.value}
    >
      <ComboboxInput
        id={id}
        className={cn("w-full", className)}
        placeholder={placeholder}
        aria-invalid={invalid}
        disabled={disabled}
        showClear={!!selected && !disabled}
        loading={loading}
      />
      <ComboboxContent className="w-(--anchor-width) min-w-56">
        <ComboboxEmpty>
          {loading
            ? "Loading currencies…"
            : options.length === 0
              ? "No currencies available — reopen to retry."
              : "No currencies found."}
        </ComboboxEmpty>
        <ComboboxList>
          {(option) => (
            <ComboboxItem key={option.value} value={option}>
              {option.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
