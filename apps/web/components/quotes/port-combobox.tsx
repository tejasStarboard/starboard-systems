"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@starboard/lib-ui/components/combobox"

import { type QuoteFormOption } from "@/lib/domain/quotes/quotes.schema"

const DEBOUNCE_MS = 150

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

  // Keep merge inputs fresh without re-firing the search effect.
  const selectedRef = useRef(selected)
  const initialOptionsRef = useRef(initialOptions)
  const valueRef = useRef(value)
  selectedRef.current = selected
  initialOptionsRef.current = initialOptions
  valueRef.current = value

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
    const controller = new AbortController()
    setLoading(true)

    const handle = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams()
        if (trimmed) params.set("q", trimmed)
        const qs = params.size > 0 ? `?${params}` : ""
        const response = await fetch(`/api/geography/ports${qs}`, {
          signal: controller.signal,
        })
        if (!response.ok) return
        const body = (await response.json()) as {
          ports?: QuoteFormOption[]
        }
        const next = body.ports ?? []
        const selectedOption = selectedRef.current
        const seeds = initialOptionsRef.current
        const currentValue = valueRef.current
        setOptions(() => {
          const byValue = new Map(next.map((o) => [o.value, o]))
          if (selectedOption) {
            byValue.set(selectedOption.value, selectedOption)
          }
          for (const option of seeds) {
            if (option.value === currentValue || !trimmed) {
              byValue.set(option.value, option)
            }
          }
          return [...byValue.values()]
        })
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }, DEBOUNCE_MS)

    return () => {
      controller.abort()
      window.clearTimeout(handle)
    }
  }, [query])

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
      itemToStringLabel={(option) => option.label}
      itemToStringValue={(option) => option.value}
      isItemEqualToValue={(a, b) => a.value === b.value}
    >
      <ComboboxInput
        id={id}
        className="w-full"
        placeholder={placeholder}
        aria-invalid={invalid}
        showClear={!!selected}
        loading={loading}
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
