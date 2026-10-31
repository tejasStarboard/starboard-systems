"use client"

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useTable, type ColumnDef, type RowData } from "@tanstack/react-table"

import type { ListQuotesViewResponse } from "@starboard/lib-contracts"
import { Button } from "@starboard/lib-ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@starboard/lib-ui/components/table"
import { toast } from "@starboard/lib-ui/components/toast"

import {
  features,
  type DataTableFeatures,
} from "@/components/quotes/data-table-features"

const QUOTES_PAGE_SIZE = 25

function totalPages(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / pageSize))
}

interface QuotesDataTableProps<TData extends RowData & { id: string }> {
  columns: ColumnDef<DataTableFeatures, TData>[]
  initial: ListQuotesViewResponse
}

export function QuotesDataTable<TData extends RowData & { id: string }>({
  columns,
  initial,
}: QuotesDataTableProps<TData>) {
  const router = useRouter()
  const [data, setData] = useState(initial.quotes as TData[])
  const [total, setTotal] = useState(initial.total)
  const [pageSize] = useState(initial.pageSize || QUOTES_PAGE_SIZE)
  const [listQuery, setListQuery] = useState({ page: initial.page, q: "" })
  const [loading, setLoading] = useState(false)
  const skipFetchRef = useRef(true)

  useEffect(() => {
    setData(initial.quotes as TData[])
    setTotal(initial.total)
    setListQuery({ page: initial.page, q: "" })
  }, [initial])

  useEffect(() => {
    if (skipFetchRef.current) {
      skipFetchRef.current = false
      return
    }

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
          | (ListQuotesViewResponse & { error?: string })
          | null
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
          setData(body.quotes as TData[])
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
                onClick={() => router.push(`/quote/${row.original.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    router.push(`/quote/${row.original.id}`)
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
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                {loading
                  ? "Loading…"
                  : "No quotes yet. Create one to get started."}
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
