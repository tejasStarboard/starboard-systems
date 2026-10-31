"use client"

import { useEffect, useMemo, useState } from "react"

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@workspace/ui/components/combobox"

export type OrgOption = {
  id: string
  name: string
  slug: string
  plan?: string
}

export function OrgMultiCombobox({
  value,
  onChange,
  placeholder = "Search organizations by name…",
}: {
  value: OrgOption[]
  onChange: (next: OrgOption[]) => void
  placeholder?: string
}) {
  const anchor = useComboboxAnchor()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<OrgOption[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setLoading(true)
      void fetch(`/api/admin/organizations?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("Search failed")
          }
          const body = (await response.json()) as {
            organizations: OrgOption[]
          }
          setResults(body.organizations)
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return
          }
          setResults([])
        })
        .finally(() => setLoading(false))
    }, 200)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [query])

  const items = useMemo(() => {
    const byId = new Map<string, OrgOption>()
    for (const org of value) {
      byId.set(org.id, org)
    }
    for (const org of results) {
      byId.set(org.id, org)
    }
    return [...byId.values()]
  }, [results, value])

  return (
    <Combobox
      multiple
      items={items}
      value={value}
      onValueChange={(next) => onChange(next ?? [])}
      itemToStringValue={(org) => org.name}
      isItemEqualToValue={(a, b) => a.id === b.id}
      onInputValueChange={(next) => setQuery(next)}
    >
      <ComboboxChips ref={anchor} className="w-full min-w-0">
        {value.map((org) => (
          <ComboboxChip key={org.id}>{org.name}</ComboboxChip>
        ))}
        <ComboboxChipsInput placeholder={placeholder} />
      </ComboboxChips>
      <ComboboxContent anchor={anchor} className="w-(--anchor-width)">
        <ComboboxEmpty>
          {loading ? "Searching…" : "No organizations found."}
        </ComboboxEmpty>
        <ComboboxList>
          {(org) => (
            <ComboboxItem key={org.id} value={org}>
              <span className="flex min-w-0 flex-col">
                <span className="truncate">{org.name}</span>
                <span className="truncate font-mono text-[10px] text-muted-foreground">
                  {org.slug}
                </span>
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
