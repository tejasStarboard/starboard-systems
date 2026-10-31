import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { columns } from "@/components/quotes/columns"
import { CreateQuoteButton } from "@/components/quotes/create-quote-button"
import { QuotesDataTable } from "@/components/quotes/quotes-data-table"
import { auth } from "@/lib/auth"
import { getQuotesManager } from "@/lib/domain/quotes.manager"

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const organizationId = session?.session.activeOrganizationId
  if (!organizationId) {
    redirect("/select-org")
  }

  const quotes = await getQuotesManager().listQuotesForOrg(organizationId)

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-sm font-medium">Quotes</h1>
          <p className="text-xs text-muted-foreground">
            Open a quote to edit details, validity, and commercial terms.
          </p>
        </div>
        <CreateQuoteButton />
      </div>

      <QuotesDataTable columns={columns} data={quotes} />
    </div>
  )
}
