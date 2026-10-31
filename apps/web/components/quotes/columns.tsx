"use client"

import { createColumnHelper } from "@tanstack/react-table"

import { Badge } from "@workspace/ui/components/badge"

import { type DataTableFeatures } from "@/components/quotes/data-table-features"
import { type QuoteListItem } from "@/lib/domain/quotes.schema"

const columnHelper = createColumnHelper<DataTableFeatures, QuoteListItem>()

function formatDate(value: string | null) {
  if (!value) {
    return "—"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export const columns = columnHelper.columns([
  columnHelper.accessor("quoteId", {
    header: "Quote",
    cell: ({ row }) => (
      <span className="font-medium tabular-nums">{row.original.quoteId}</span>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => (
      <Badge variant="outline" className="capitalize">
        {getValue()}
      </Badge>
    ),
  }),
  columnHelper.accessor("customerName", {
    header: "Customer",
    cell: ({ getValue }) => getValue() || "—",
  }),
  columnHelper.accessor("currencyCode", {
    header: "Currency",
    cell: ({ getValue }) => (
      <span className="tabular-nums">{getValue() || "—"}</span>
    ),
  }),
  columnHelper.accessor("ownerName", {
    header: "Owner",
  }),
  columnHelper.accessor("effectiveFrom", {
    header: "Effective",
    cell: ({ getValue }) => formatDate(getValue()),
  }),
  columnHelper.accessor("expiryAt", {
    header: "Expires",
    cell: ({ getValue }) => formatDate(getValue()),
  }),
  columnHelper.accessor("createdAt", {
    header: "Created",
    cell: ({ getValue }) => formatDate(getValue()),
  }),
])
