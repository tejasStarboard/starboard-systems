"use client"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox"

import { type QuoteFormOption } from "@/lib/quotes/schema"

export function CustomerCombobox({
  options,
  value,
  onChange,
  invalid,
}: {
  options: QuoteFormOption[]
  value: string
  onChange: (value: string) => void
  invalid?: boolean
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
        className="w-full"
        placeholder="Search customer..."
        aria-invalid={invalid}
        showClear={!!selected}
      />
      <ComboboxContent className="w-(--anchor-width)">
        <ComboboxEmpty>No customers found.</ComboboxEmpty>
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
