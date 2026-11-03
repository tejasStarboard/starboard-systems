import { NextResponse } from "next/server"

import { renderQuotePdfBytes } from "@starboard/ext-quoting-pdf/server"
import type { QuoteStatus } from "@starboard/lib-contracts"

import { requireApiSession } from "@/lib/auth/session"
import { getOrganizationPlan } from "@/lib/billing/plan"
import { ServiceClientError } from "@/lib/clients/http"
import { getQuotesManager } from "@/lib/domain/quotes/quotes.manager"
import {
  isExtensionActive,
  listActivePointContributions,
} from "@/lib/extensions"

const EXPORT_ALLOWED = new Set<QuoteStatus>(["review", "sent", "win", "loss"])

/**
 * PDF bytes for a quote. Product UI lives in `quoting.pdf`; this BFF route
 * only authenticates, gates on the built-in, and delegates to its server
 * helper (083 / 094: same view + org-selected template as the preview).
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
        {
          error: "Export available when status is review, sent, win, or loss",
        },
        { status: 403 }
      )
    }

    const [context, templates] = await Promise.all([
      getQuotesManager().getQuoteDocumentContextForOrg(
        organizationId,
        quote.customerId
      ),
      listActivePointContributions(
        "quoting.pdf.templates",
        plan,
        organizationId
      ),
    ])
    const { bytes, quoteNumber } = await renderQuotePdfBytes({
      quote,
      organization: context.organization,
      customerName: context.customerName,
      activeTemplateIds: templates.map((template) => template.id),
    })
    const filename = `quote-${quoteNumber || quoteId}.pdf`

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
