"use client"

import { useState } from "react"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox"

import { type QuoteFormOption } from "@/lib/domain/quotes.schema"

export function CustomerCombobox({
  options: initialOptions,
  value,
  onChange,
  invalid,
}: {
  options: QuoteFormOption[]
  value: string
  onChange: (value: string) => void
  invalid?: boolean
}) {
  const [options, setOptions] = useState(initialOptions)
  const [query, setQuery] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const selected = options.find((option) => option.value === value) ?? null
  const trimmedQuery = query.trim()
  const canCreate =
    trimmedQuery.length > 0 &&
    !options.some(
      (option) => option.label.toLowerCase() === trimmedQuery.toLowerCase()
    )

  async function createCustomer() {
    if (!canCreate || creating) return

    setCreating(true)
    setCreateError(null)
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedQuery }),
      })
      const body = (await response.json().catch(() => null)) as {
        id?: string
        name?: string
        error?: string
      } | null

      if (!response.ok || !body?.id || !body.name) {
        setCreateError(body?.error ?? "Failed to create customer")
        return
      }

      const created: QuoteFormOption = { value: body.id, label: body.name }
      setOptions((prev) =>
        [...prev, created].sort((a, b) => a.label.localeCompare(b.label))
      )
      onChange(created.value)
      setQuery("")
    } catch {
      setCreateError("Failed to create customer")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex w-full flex-col gap-1">
      <Combobox
        items={options}
        value={selected}
        onValueChange={(option) => {
          onChange(option?.value ?? "")
        }}
        itemToStringValue={(option) => option.label}
      >
        <ComboboxInput
          className="w-full"
          placeholder="Search or create customer..."
          aria-invalid={invalid}
          showClear={!!selected}
          onChange={(event) => setQuery(event.target.value)}
        />
        <ComboboxContent className="w-(--anchor-width)">
          <ComboboxEmpty>
            {canCreate ? (
              <button
                type="button"
                className="w-full px-2 py-1.5 text-left text-sm text-foreground hover:underline"
                disabled={creating}
                onMouseDown={(event) => {
                  event.preventDefault()
                  void createCustomer()
                }}
              >
                {creating ? "Creating…" : `Create customer “${trimmedQuery}”`}
              </button>
            ) : (
              "No customers found."
            )}
          </ComboboxEmpty>
          <ComboboxList>
            {(option) => (
              <ComboboxItem key={option.value} value={option}>
                {option.label}
              </ComboboxItem>
            )}
          </ComboboxList>
          {canCreate && options.length > 0 ? (
            <button
              type="button"
              className="border-t px-2 py-1.5 text-left text-sm text-muted-foreground hover:text-foreground"
              disabled={creating}
              onMouseDown={(event) => {
                event.preventDefault()
                void createCustomer()
              }}
            >
              {creating ? "Creating…" : `Create “${trimmedQuery}”`}
            </button>
          ) : null}
        </ComboboxContent>
      </Combobox>
      {createError ? (
        <p className="text-xs text-destructive">{createError}</p>
      ) : null}
    </div>
  )
}
