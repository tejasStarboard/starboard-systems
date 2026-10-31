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

import { type QuoteFormOption } from "@/lib/domain/quotes/quotes.schema"

const DEBOUNCE_MS = 250

export function PortCombobox({
  options: initialOptions = [],
  value,
  onChange,
  placeholder = "Search port …",
  invalid,
  id,
}: {
  /** Seed list + selected labels (e.g. form options / resolved codes). */
  options?: QuoteFormOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  invalid?: boolean
  id?: string
}) {
  const [options, setOptions] = useState<QuoteFormOption[]>(initialOptions)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)

  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value]
  )

  useEffect(() => {
    if (initialOptions.length === 0) return
    setOptions((prev) => {
      const byValue = new Map(prev.map((o) => [o.value, o]))
      for (const option of initialOptions) {
        byValue.set(option.value, option)
      }
      return [...byValue.values()]
    })
  }, [initialOptions])

  useEffect(() => {
    const trimmed = query.trim()

    const handle = window.setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (trimmed) params.set("q", trimmed)
        const qs = params.size > 0 ? `?${params}` : ""
        const response = await fetch(`/api/geography/ports${qs}`)
        if (!response.ok) return
        const body = (await response.json()) as {
          ports?: QuoteFormOption[]
        }
        const next = body.ports ?? []
        setOptions((prev) => {
          const byValue = new Map(next.map((o) => [o.value, o]))
          if (selected) {
            byValue.set(selected.value, selected)
          }
          for (const option of initialOptions) {
            if (option.value === value || !trimmed) {
              byValue.set(option.value, option)
            }
          }
          return [...byValue.values()]
        })
      } finally {
        setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => window.clearTimeout(handle)
  }, [query, selected, initialOptions, value])

  return (
    <Combobox
      items={options}
      // Server already ranks with pg_trgm; disable client substring filter
      // so typos still surface ranked port matches.
      filter={null}
      value={selected}
      onValueChange={(option) => {
        onChange(option?.value ?? "")
      }}
      onInputValueChange={(next) => {
        setQuery(next)
      }}
      itemToStringValue={(option) => option.label}
    >
      <ComboboxInput
        id={id}
        className="w-full"
        placeholder={placeholder}
        aria-invalid={invalid}
        showClear={!!selected}
      />
      <ComboboxContent className="w-(--anchor-width)">
        <ComboboxEmpty>
          {loading ? "Searching…" : "No ports found."}
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
