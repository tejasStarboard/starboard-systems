"use client"

import { ArrowsLeftRightIcon } from "@phosphor-icons/react"

import { PortCombobox } from "@starboard/ext-geo-gazetteer"
import { Button } from "@starboard/lib-ui/components/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@starboard/lib-ui/components/field"
import { Input } from "@starboard/lib-ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@starboard/lib-ui/components/select"

import {
  EQUIPMENT_OPTIONS,
  type SearchRatesFilters,
} from "../lib/search-rates-query"

export function SearchFclFilters({
  filters,
  onChange,
  onSearch,
  onClear,
  searching,
}: {
  filters: SearchRatesFilters
  onChange: (next: SearchRatesFilters) => void
  onSearch: () => void
  onClear: () => void
  searching: boolean
}) {
  function set<K extends keyof SearchRatesFilters>(
    key: K,
    value: SearchRatesFilters[K]
  ) {
    onChange({ ...filters, [key]: value })
  }

  function swapPorts() {
    onChange({
      ...filters,
      origin: filters.destination,
      destination: filters.origin,
    })
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        onSearch()
      }}
    >
      <FieldGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field>
          <FieldLabel htmlFor="search-origin">Origin port</FieldLabel>
          <div className="flex items-center gap-1.5">
            <div className="min-w-0 flex-1">
              <PortCombobox
                id="search-origin"
                value={filters.origin}
                onChange={(value) => set("origin", value)}
                placeholder="UNLOCODE"
              />
            </div>
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              aria-label="Swap origin and destination"
              onClick={swapPorts}
            >
              <ArrowsLeftRightIcon className="size-4" />
            </Button>
          </div>
        </Field>
        <Field>
          <FieldLabel htmlFor="search-destination">Destination port</FieldLabel>
          <PortCombobox
            id="search-destination"
            value={filters.destination}
            onChange={(value) => set("destination", value)}
            placeholder="UNLOCODE"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="search-valid-from">Valid between</FieldLabel>
          <div className="flex items-center gap-1.5">
            <Input
              id="search-valid-from"
              type="date"
              value={filters.validFrom}
              onChange={(event) => set("validFrom", event.target.value)}
              aria-label="Valid from"
            />
            <span className="text-xs text-muted-foreground">–</span>
            <Input
              id="search-valid-to"
              type="date"
              value={filters.validTo}
              onChange={(event) => set("validTo", event.target.value)}
              aria-label="Valid to"
            />
          </div>
        </Field>
        <Field>
          <FieldLabel htmlFor="search-equipment">Equipment</FieldLabel>
          <Select
            value={filters.equipment || "__any__"}
            onValueChange={(value) =>
              set(
                "equipment",
                !value || value === "__any__" ? "" : String(value)
              )
            }
          >
            <SelectTrigger id="search-equipment" size="sm" className="w-full">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__any__">Any</SelectItem>
              {EQUIPMENT_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="search-agent">Agent</FieldLabel>
          <Input
            id="search-agent"
            value={filters.agent}
            onChange={(event) => set("agent", event.target.value)}
            placeholder="Customer / agent id"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="search-carrier">Carrier</FieldLabel>
          <Input
            id="search-carrier"
            value={filters.carrier}
            onChange={(event) => set("carrier", event.target.value)}
            placeholder="Carrier name"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="search-document-id">Document ID</FieldLabel>
          <Input
            id="search-document-id"
            value={filters.documentId}
            onChange={(event) => set("documentId", event.target.value)}
            placeholder="Label search"
          />
        </Field>
      </FieldGroup>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={searching}>
          {searching ? "Searching…" : "Search rates"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onClear}
          disabled={searching}
        >
          Clear
        </Button>
      </div>
    </form>
  )
}
