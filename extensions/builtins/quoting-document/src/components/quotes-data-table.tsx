"use client"

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react"
import { useEffect, useState } from "react"
import { useTable, type ColumnDef } from "@tanstack/react-table"

import type { ListQuotesViewResponse } from "@starboard/lib-contracts"
import { Button } from "@starboard/lib-ui/components/button"
import { LoadingState } from "@starboard/lib-ui/components/loading-state"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@starboard/lib-ui/components/table"
import { toast } from "@starboard/lib-ui/components/toast"

import { features, type DataTableFeatures } from "./data-table-features"
import type { BuiltinHost } from "../host"
import { type QuoteListItem } from "../lib/quotes.schema"

const QUOTES_PAGE_SIZE = 25

function totalPages(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / pageSize))
}

interface QuotesDataTableProps {
  columns: ColumnDef<DataTableFeatures, QuoteListItem>[]
  host: BuiltinHost
}

function openQuote(host: BuiltinHost, quote: QuoteListItem) {
  host.openEditor({
    viewType: "quote",
    resourceId: quote.id,
    title: quote.quoteId,
  })
}

export function QuotesDataTable({ columns, host }: QuotesDataTableProps) {
  const [data, setData] = useState<QuoteListItem[]>([])
  const [total, setTotal] = useState(0)
  const [pageSize] = useState(QUOTES_PAGE_SIZE)
  const [listQuery, setListQuery] = useState({ page: 1, q: "" })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: String(listQuery.page),
          pageSize: String(pageSize),
        })
        if (listQuery.q) params.set("q", listQuery.q)
        const response = await fetch(`/api/quotes?${params}`)
        const body = (await response.json().catch(() => null)) as
          (ListQuotesViewResponse & { error?: string }) | null
        if (!response.ok || !body?.quotes) {
          if (!cancelled) {
            toast.add({
              type: "error",
              title: "Unable to load quotes",
              description: body?.error ?? "Something went wrong. Try again.",
            })
          }
          return
        }
        if (!cancelled) {
          setData(body.quotes)
          setTotal(body.total)
        }
      } catch {
        if (!cancelled) {
          toast.add({
            type: "error",
            title: "Unable to load quotes",
            description: "Something went wrong. Try again.",
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [listQuery, pageSize])

  const table = useTable({
    features,
    data,
    columns,
    getRowId: (row) => row.id,
  })
  const pages = totalPages(total, pageSize)

  return (
    <div className="overflow-hidden rounded-none border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : (
                    <table.FlexRender header={header} />
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer"
                tabIndex={0}
                onClick={() => openQuote(host, row.original)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    openQuote(host, row.original)
                  }
                }}
              >
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 p-0">
                {loading ? (
                  <LoadingState size="sm">Loading quotes…</LoadingState>
                ) : (
                  <p className="text-center text-muted-foreground">
                    No quotes yet. Create one to get started.
                  </p>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading || listQuery.page <= 1}
          onClick={() =>
            setListQuery((prev) => ({
              ...prev,
              page: Math.max(1, prev.page - 1),
            }))
          }
          aria-label="Previous page"
        >
          <CaretLeftIcon className="size-4" />
          <span className="sr-only sm:not-sr-only">Prev</span>
        </Button>
        <span className="text-xs text-muted-foreground">
          {total === 0 ? "0" : listQuery.page} / {total === 0 ? 0 : pages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading || listQuery.page >= pages || total === 0}
          onClick={() =>
            setListQuery((prev) => ({ ...prev, page: prev.page + 1 }))
          }
          aria-label="Next page"
        >
          <span className="sr-only sm:not-sr-only">Next</span>
          <CaretRightIcon className="size-4" />
        </Button>
      </div>
    </div>
  )
}
