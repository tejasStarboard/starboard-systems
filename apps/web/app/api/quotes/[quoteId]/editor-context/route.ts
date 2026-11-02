import { NextResponse } from "next/server"

import { requireApiSession } from "@/lib/auth/session"
import { getOrganizationPlan } from "@/lib/billing/plan"
import { ServiceClientError } from "@/lib/clients/http"
import { getQuotesManager } from "@/lib/domain/quotes/quotes.manager"
import { listActiveSpotRateSources } from "@/lib/extensions"

/** Everything the `quoting.document` quote editor needs to mount `QuoteForm`. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return authResult.error
  }

  const { quoteId } = await params
  const { organizationId } = authResult

  try {
    const quotesManager = getQuotesManager()
    const [quote, options, plan] = await Promise.all([
      quotesManager.getQuoteFormValuesForOrg(quoteId, organizationId),
      quotesManager.loadQuoteFormOptions(organizationId),
      getOrganizationPlan(organizationId),
    ])
    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 })
    }
    const spotRateSources = await listActiveSpotRateSources(
      plan,
      organizationId
    )

    return NextResponse.json({ quote, options, spotRateSources })
  } catch (error) {
    if (error instanceof ServiceClientError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }
    throw error
  }
}
