"use client"

import { columns } from "../components/columns"
import { CreateQuoteButton } from "../components/create-quote-button"
import { QuotesDataTable } from "../components/quotes-data-table"
import type { BuiltinEditorProps } from "../host"

/** `quote.list` editor: the full quotes table (formerly the shell home page). */
export function QuoteListEditor({ host }: BuiltinEditorProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-sm font-medium">Quotes</h1>
          <p className="text-xs text-muted-foreground">
            Open a quote to edit details, validity, and commercial terms.
          </p>
        </div>
        <CreateQuoteButton host={host} />
      </div>

      <QuotesDataTable columns={columns} host={host} />
    </div>
  )
}
