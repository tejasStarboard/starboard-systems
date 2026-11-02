import { NextResponse } from "next/server"

import { buildQuotePdfModel, renderQuotePdf } from "@starboard/ext-quoting-pdf"
import type { QuoteStatus } from "@starboard/lib-contracts"

import { requireApiSession } from "@/lib/auth/session"
import { getOrganizationPlan } from "@/lib/billing/plan"
import { ServiceClientError } from "@/lib/clients/http"
import { getQuotesManager } from "@/lib/domain/quotes/quotes.manager"
import { isExtensionActive } from "@/lib/extensions"

const EXPORT_ALLOWED = new Set<QuoteStatus>(["sent", "win", "loss"])

/**
 * PDF bytes for a quote. Product UI lives in `quoting.pdf`; this BFF route
 * only serves download when that built-in is active (ticket 083).
 */
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
    const plan = await getOrganizationPlan(organizationId)
    if (!(await isExtensionActive("quoting.pdf", plan, organizationId))) {
      return NextResponse.json(
        { error: "PDF export is not available" },
        { status: 404 }
      )
    }

    const quote = await getQuotesManager().getQuoteFormValuesForOrg(
      quoteId,
      organizationId
    )
    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 })
    }

    if (!EXPORT_ALLOWED.has(quote.status)) {
      return NextResponse.json(
        { error: "Export available when status is sent, win, or loss" },
        { status: 403 }
      )
    }

    const model = buildQuotePdfModel(quote)
    const bytes = await renderQuotePdf(model)
    const filename = `quote-${model.quoteId || quoteId}.pdf`

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
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
