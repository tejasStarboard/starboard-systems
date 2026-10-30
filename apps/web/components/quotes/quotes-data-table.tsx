"use client"

import { useRouter } from "next/navigation"
import { useTable, type ColumnDef, type RowData } from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import {
  features,
  type DataTableFeatures,
} from "@/components/quotes/data-table-features"

interface QuotesDataTableProps<TData extends RowData & { id: string }> {
  columns: ColumnDef<DataTableFeatures, TData>[]
  data: TData[]
}

export function QuotesDataTable<TData extends RowData & { id: string }>({
  columns,
  data,
}: QuotesDataTableProps<TData>) {
  const router = useRouter()
  const table = useTable({
    features,
    data,
    columns,
    getRowId: (row) => row.id,
  })

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
                No quotes yet. Create one to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
