import { NextResponse } from "next/server"

import { requireApiSession } from "@/lib/auth/session"
import { getOrganizationPlan } from "@/lib/billing/plan"
import { ServiceClientError } from "@/lib/clients/http"
import { getQuotesManager } from "@/lib/domain/quotes/quotes.manager"
import { listActiveOwnerPointContributions } from "@/lib/extensions"

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
    const [quote, plan] = await Promise.all([
      quotesManager.getQuoteFormValuesForOrg(quoteId, organizationId),
      getOrganizationPlan(organizationId),
    ])
    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 })
    }
    const [options, defaultBaseCurrency] = await Promise.all([
      quotesManager.loadQuoteFormOptions(organizationId, {
        customerId: quote.customerId,
      }),
      quotesManager.getDefaultBaseCurrencyForOrg(organizationId),
    ])
    // Contributions into the slots `quoting.document` defines (host-resolved,
    // rollout-aware, empty when the owner is inactive).
    const slots = await listActiveOwnerPointContributions(
      "quoting.document",
      plan,
      organizationId
    )

    return NextResponse.json({
      quote,
      options,
      slots,
      defaults: { baseCurrency: defaultBaseCurrency },
    })
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
