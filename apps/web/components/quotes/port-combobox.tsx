"use client"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox"

import { type QuoteFormOption } from "@/lib/domain/quotes.schema"

export function PortCombobox({
  options,
  value,
  onChange,
  placeholder = "Search port...",
  invalid,
  id,
}: {
  options: QuoteFormOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  invalid?: boolean
  id?: string
}) {
  const selected = options.find((option) => option.value === value) ?? null

  return (
    <Combobox
      items={options}
      value={selected}
      onValueChange={(option) => {
        onChange(option?.value ?? "")
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
        <ComboboxEmpty>No ports found.</ComboboxEmpty>
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
