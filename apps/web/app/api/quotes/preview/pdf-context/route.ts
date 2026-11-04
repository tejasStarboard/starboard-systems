import { NextResponse } from "next/server"

import { resolveQuotePdfContext } from "@starboard/ext-quoting-pdf/server"

import { requireApiSession } from "@/lib/auth/session"
import { getOrganizationPlan } from "@/lib/billing/plan"
import { getQuotesManager } from "@/lib/domain/quotes/quotes.manager"
import {
  isExtensionActive,
  listActivePointContributions,
} from "@/lib/extensions"

/**
 * Org branding + selected PDF template id for the client-side PDF preview
 * (ticket 094). Thin: auth, `quoting.pdf` gate, delegate to the extension.
 */
export async function GET() {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return authResult.error
  }
  const { organizationId } = authResult

  const plan = await getOrganizationPlan(organizationId)
  if (!(await isExtensionActive("quoting.pdf", plan, organizationId))) {
    return NextResponse.json(
      { error: "PDF preview is not available" },
      { status: 404 }
    )
  }

  const [context, templates] = await Promise.all([
    getQuotesManager().getQuoteDocumentContextForOrg(organizationId),
    listActivePointContributions("quoting.pdf.templates", plan, organizationId),
  ])
  const result = resolveQuotePdfContext({
    organization: context.organization,
    activeTemplateIds: templates.map((template) => template.id),
  })
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } })
}
