"use client"

import { useEffect, useState } from "react"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@starboard/lib-ui/components/combobox"
import { toast } from "@starboard/lib-ui/components/toast"

import type { ComboboxOption } from "../lib/options"

export function CustomerCombobox({
  options: initialOptions,
  value,
  onChange,
  invalid,
  disabled,
}: {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  invalid?: boolean
  disabled?: boolean
}) {
  const [options, setOptions] = useState(initialOptions)

  // Resync when the parent supplies new options (e.g. editor context reload);
  // keep customers created locally that the parent list doesn't know yet.
  useEffect(() => {
    setOptions((prev) => {
      const byValue = new Map(initialOptions.map((o) => [o.value, o]))
      for (const option of prev) {
        if (!byValue.has(option.value)) byValue.set(option.value, option)
      }
      return [...byValue.values()].sort((a, b) =>
        a.label.localeCompare(b.label)
      )
    })
  }, [initialOptions])
  const [query, setQuery] = useState("")
  const [creating, setCreating] = useState(false)

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
        toast.add({
          type: "error",
          title: "Unable to create customer",
          description: body?.error ?? "Something went wrong. Try again.",
        })
        return
      }

      const created: ComboboxOption = { value: body.id, label: body.name }
      setOptions((prev) =>
        [...prev, created].sort((a, b) => a.label.localeCompare(b.label))
      )
      onChange(created.value)
      setQuery("")
    } catch {
      toast.add({
        type: "error",
        title: "Unable to create customer",
        description: "Something went wrong. Try again.",
      })
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
          disabled={disabled}
          showClear={!!selected && !disabled}
          onChange={(event) => setQuery(event.target.value)}
        />
        <ComboboxContent className="w-(--anchor-width)">
          <ComboboxEmpty>
            {canCreate && !disabled ? (
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
          {canCreate && !disabled && options.length > 0 ? (
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
    </div>
  )
}
