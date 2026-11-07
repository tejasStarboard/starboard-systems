"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { FunnelSimpleIcon, PlusIcon } from "@phosphor-icons/react"

import type {
  ListQuotesViewResponse,
  QuoteListItemView,
  QuoteStatus,
} from "@starboard/lib-contracts"
import { ButtonGroup } from "@starboard/lib-ui/components/button-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@starboard/lib-ui/components/dropdown-menu"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@starboard/lib-ui/components/input-group"
import { LoadingState } from "@starboard/lib-ui/components/loading-state"

import type { BuiltinViewProps } from "../host"
import { CreateQuoteButton } from "./create-quote-button"
import { QuoteListCard } from "./quote-list-card"

const PAGE_SIZE = 50

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "review", label: "Review" },
  { value: "sent", label: "Sent" },
  { value: "win", label: "Won" },
  { value: "loss", label: "Loss" },
  { value: "expired", label: "Expired" },
] as const satisfies ReadonlyArray<{
  value: "all" | QuoteStatus
  label: string
}>

type StatusFilter = (typeof STATUS_FILTERS)[number]["value"]

const SORT_OPTIONS = [
  { value: "createdAt", label: "Date created" },
  { value: "effectiveFrom", label: "Effective date" },
  { value: "expiryAt", label: "Expiry date" },
  { value: "quoteId", label: "Quote id" },
] as const

type SortField = (typeof SORT_OPTIONS)[number]["value"]

function compareQuotes(
  a: QuoteListItemView,
  b: QuoteListItemView,
  sortBy: SortField
): number {
  if (sortBy === "quoteId") {
    return a.quoteId.localeCompare(b.quoteId)
  }
  const left = a[sortBy]
  const right = b[sortBy]
  if (!left && !right) return 0
  if (!left) return 1
  if (!right) return -1
  return right.localeCompare(left)
}

/** Contributed sidebar view: filtered/sorted quotes; each row opens a `quote` tab. */
export function QuoteListView({ host }: BuiltinViewProps) {
  const [reload, setReload] = useState(0)
  const [data, setData] = useState<ListQuotesViewResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [sortBy, setSortBy] = useState<SortField>("createdAt")
  const [query, setQuery] = useState("")

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const response = await fetch(
          `/api/quotes?page=1&pageSize=${PAGE_SIZE}`,
          { signal: controller.signal }
        )
        const body = (await response.json().catch(() => null)) as
          (ListQuotesViewResponse & { error?: string }) | null
        if (!response.ok || !body?.quotes) {
          setError(body?.error ?? "Unable to load quotes.")
          return
        }
        setError(null)
        setData(body)
      } catch {
        if (!controller.signal.aborted) setError("Unable to load quotes.")
      }
    }
    void load()
    return () => controller.abort()
  }, [reload])

  const refresh = useCallback(() => setReload((n) => n + 1), [])

  const visible = useMemo(() => {
    const quotes = data?.quotes ?? []
    const needle = query.trim().toLowerCase()
    const filtered = quotes.filter((quote) => {
      if (statusFilter !== "all" && quote.status !== statusFilter) return false
      if (!needle) return true
      return quote.quoteId.toLowerCase().includes(needle)
    })
    return [...filtered].sort((a, b) => compareQuotes(a, b, sortBy))
  }, [data, statusFilter, sortBy, query])

  return (
    <div data-testid="quote-list-view" className="flex flex-col gap-2 px-2">
      <div className="px-1">
        <ButtonGroup aria-label="Quote list tools" className="w-full">
          <ButtonGroup>
            <CreateQuoteButton
              host={host}
              size="icon-sm"
              variant="outline"
              aria-label="New quote"
              onCreated={refresh}
            >
              <PlusIcon className="size-3.5" />
            </CreateQuoteButton>
          </ButtonGroup>
          <ButtonGroup className="min-w-0 flex-1">
            <InputGroup className="h-7">
              <InputGroupInput
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by quote id"
                aria-label="Search quotes by short id"
                data-testid="quote-list-search"
              />
              <InputGroupAddon align="inline-end">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <InputGroupButton
                        size="icon-xs"
                        aria-label="Filter and sort quotes"
                        data-testid="quote-list-filter"
                        title="Filter and sort"
                      />
                    }
                  >
                    <FunnelSimpleIcon className="size-3.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-44">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>View</DropdownMenuLabel>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          Filter by
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuRadioGroup
                            value={statusFilter}
                            onValueChange={(value) => {
                              if (
                                STATUS_FILTERS.some(
                                  (item) => item.value === value
                                )
                              ) {
                                setStatusFilter(value as StatusFilter)
                              }
                            }}
                          >
                            {STATUS_FILTERS.map((item) => (
                              <DropdownMenuRadioItem
                                key={item.value}
                                value={item.value}
                              >
                                {item.label}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Sort by</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuRadioGroup
                            value={sortBy}
                            onValueChange={(value) => {
                              if (
                                SORT_OPTIONS.some(
                                  (item) => item.value === value
                                )
                              ) {
                                setSortBy(value as SortField)
                              }
                            }}
                          >
                            {SORT_OPTIONS.map((item) => (
                              <DropdownMenuRadioItem
                                key={item.value}
                                value={item.value}
                              >
                                {item.label}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    </DropdownMenuGroup>
                    {statusFilter !== "all" || sortBy !== "createdAt" ? (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            onClick={() => {
                              setStatusFilter("all")
                              setSortBy("createdAt")
                            }}
                          >
                            Reset to All Quotes
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </InputGroupAddon>
            </InputGroup>
          </ButtonGroup>
        </ButtonGroup>
      </div>

      {error ? (
        <p role="alert" className="px-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}
      <ul className="flex flex-col gap-2 px-1 pb-2">
        {visible.map((quote) => {
          const active =
            host.activeEditor?.viewType === "quote" &&
            host.activeEditor.resourceId === quote.id
          return (
            <li key={quote.id}>
              <QuoteListCard
                quote={quote}
                active={active}
                onOpen={(item) =>
                  host.openEditor({
                    viewType: "quote",
                    resourceId: item.id,
                    title: item.quoteId,
                  })
                }
              />
            </li>
          )
        })}
        {data && visible.length === 0 ? (
          <li className="px-2 py-1.5 text-xs text-muted-foreground">
            {query.trim()
              ? "No quotes match this search."
              : "No quotes match this filter."}
          </li>
        ) : null}
        {!data && !error ? (
          <li>
            <LoadingState size="inline">Loading quotes…</LoadingState>
          </li>
        ) : null}
      </ul>
    </div>
  )
}
