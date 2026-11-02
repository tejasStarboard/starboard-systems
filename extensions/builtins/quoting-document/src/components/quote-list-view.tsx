"use client"

import { useCallback, useEffect, useState } from "react"

import type { ListQuotesViewResponse } from "@starboard/lib-contracts"
import { Button } from "@starboard/lib-ui/components/button"
import { cn } from "@starboard/lib-ui/lib/utils"

import type { BuiltinViewProps } from "../host"
import { CreateQuoteButton } from "./create-quote-button"

const PAGE_SIZE = 20

/** Contributed sidebar view: compact quotes list; each row opens a `quote` tab. */
export function QuoteListView({ host }: BuiltinViewProps) {
  const [page, setPage] = useState(1)
  const [reload, setReload] = useState(0)
  const [data, setData] = useState<ListQuotesViewResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const response = await fetch(
          `/api/quotes?page=${page}&pageSize=${PAGE_SIZE}`,
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
  }, [page, reload])

  const refresh = useCallback(() => setReload((n) => n + 1), [])
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

  return (
    <div data-testid="quote-list-view" className="flex flex-col gap-2 px-2">
      <CreateQuoteButton host={host} size="sm" onCreated={refresh} />
      {error ? (
        <p role="alert" className="px-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}
      <ul>
        {data?.quotes.map((quote) => {
          const active =
            host.activeEditor?.viewType === "quote" &&
            host.activeEditor.resourceId === quote.id
          return (
            <li key={quote.id}>
              <button
                type="button"
                onClick={() =>
                  host.openEditor({
                    viewType: "quote",
                    resourceId: quote.id,
                    title: quote.quoteId,
                  })
                }
                className={cn(
                  "flex w-full flex-col px-2 py-1.5 text-left text-sm hover:bg-muted",
                  active && "bg-muted font-medium"
                )}
              >
                <span className="tabular-nums">{quote.quoteId}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {quote.customerName ?? "No customer"} · {quote.status}
                </span>
              </button>
            </li>
          )
        })}
        {data && data.quotes.length === 0 ? (
          <li className="px-2 py-1.5 text-xs text-muted-foreground">
            No quotes yet.
          </li>
        ) : null}
        {!data && !error ? (
          <li className="px-2 py-1.5 text-xs text-muted-foreground">
            Loading…
          </li>
        ) : null}
      </ul>
      {data && data.total > data.pageSize ? (
        <div className="flex items-center justify-between px-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <span className="text-xs text-muted-foreground">
            {page} / {pages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  )
}
