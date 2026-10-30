import { headers } from "next/headers"

import { columns } from "@/components/quotes/columns"
import { CreateQuoteButton } from "@/components/quotes/create-quote-button"
import { QuotesDataTable } from "@/components/quotes/quotes-data-table"
import { auth } from "@/lib/auth"
import { listQuotes } from "@/lib/quotes/queries"

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const quotes = await listQuotes(session?.session.activeOrganizationId)

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-sm font-medium">Quotes</h1>
          <p className="text-muted-foreground text-xs">
            Open a quote to edit details, validity, and commercial terms.
          </p>
        </div>
        <CreateQuoteButton />
      </div>

      <QuotesDataTable columns={columns} data={quotes} />
    </div>
  )
}
