"use client"

import { useMemo, useState } from "react"

import type { Rate } from "@starboard/lib-contracts"
import { toast } from "@starboard/lib-ui/components/toast"

import { SearchFclFilters } from "../components/search-fcl-filters"
import { SearchModeTabs } from "../components/search-mode-tabs"
import { SearchRatesResults } from "../components/search-rates-results"
import type { BuiltinEditorProps } from "../host"
import {
  applyClientSearchFilters,
  buildSearchRatesParams,
  emptySearchRatesFilters,
  paginateSearchRates,
  sortSearchRates,
  type SearchRatesFilters,
  type SearchRatesSort,
} from "../lib/search-rates-query"

/**
 * `rate.search` editor: Ocean FCL Search Rates (ticket 097).
 * Empty until Search; Clear resets filters and results.
 */
export function RateSearchEditor({ host }: BuiltinEditorProps) {
  const [draft, setDraft] = useState<SearchRatesFilters>(
    emptySearchRatesFilters
  )
  const [rates, setRates] = useState<Rate[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState<SearchRatesSort>("lane")
  const [page, setPage] = useState(1)

  const sorted = useMemo(() => sortSearchRates(rates, sort), [rates, sort])
  const pageRows = useMemo(
    () => paginateSearchRates(sorted, page),
    [sorted, page]
  )

  async function runSearch(filters: SearchRatesFilters) {
    setLoading(true)
    try {
      const params = buildSearchRatesParams(filters)
      const qs = params.toString()
      const response = await fetch(qs ? `/api/rates?${qs}` : "/api/rates")
      const body = (await response.json().catch(() => null)) as {
        rates?: Rate[]
        error?: string
      } | null
      if (!response.ok || !body?.rates) {
        toast.add({
          type: "error",
          title: "Unable to search rates",
          description: body?.error ?? "Something went wrong. Try again.",
        })
        return
      }
      setRates(applyClientSearchFilters(body.rates, filters))
      setHasSearched(true)
      setPage(1)
    } catch {
      toast.add({
        type: "error",
        title: "Unable to search rates",
        description: "Something went wrong. Try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  function onClear() {
    setDraft(emptySearchRatesFilters())
    setRates([])
    setHasSearched(false)
    setPage(1)
  }

  function onSortChange(next: SearchRatesSort) {
    setSort(next)
    setPage(1)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-auto p-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-sm font-medium">Search Rates</h1>
        <p className="text-xs text-muted-foreground">
          Find vendor rates across modes. Ocean FCL is available; other modes
          coming soon.
        </p>
      </div>
      <SearchModeTabs />
      <SearchFclFilters
        filters={draft}
        onChange={setDraft}
        onSearch={() => void runSearch(draft)}
        onClear={onClear}
        searching={loading}
      />
      <SearchRatesResults
        rates={pageRows}
        total={sorted.length}
        page={page}
        onPageChange={setPage}
        loading={loading}
        hasSearched={hasSearched}
        sort={sort}
        onSortChange={onSortChange}
        host={host}
      />
    </div>
  )
}
