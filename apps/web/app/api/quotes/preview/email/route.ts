import { NextResponse } from "next/server"

import { renderQuoteEmailPreview } from "@starboard/ext-quoting-email/server"
import { quoteFormSchema } from "@starboard/lib-contracts"

import { requireApiSession } from "@/lib/auth/session"
import { getOrganizationPlan } from "@/lib/billing/plan"
import { getQuotesManager } from "@/lib/domain/quotes/quotes.manager"
import {
  isExtensionActive,
  listActivePointContributions,
} from "@/lib/extensions"

/**
 * react-email quote draft HTML for the live Email preview tab (092 / 094).
 * Stateless: renders the posted (possibly unsaved) form values through the
 * extension's server helper (same `QuoteDocumentView` as the PDF, org-selected
 * template); nothing is persisted or sent. Served only while `quoting.email`
 * is active.
 */
export async function POST(request: Request) {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return authResult.error
  }
  const { organizationId } = authResult

  const plan = await getOrganizationPlan(organizationId)
  if (!(await isExtensionActive("quoting.email", plan, organizationId))) {
    return NextResponse.json(
      { error: "Email preview is not available" },
      { status: 404 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const input =
    typeof body === "object" && body !== null
      ? (body as { quote?: unknown; customerName?: unknown })
      : {}

  const parsed = quoteFormSchema.safeParse(input.quote)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid quote" },
      { status: 400 }
    )
  }

  const [context, templates] = await Promise.all([
    getQuotesManager().getQuoteDocumentContextForOrg(organizationId),
    listActivePointContributions(
      "quoting.email.templates",
      plan,
      organizationId
    ),
  ])
  const result = await renderQuoteEmailPreview({
    quote: parsed.data,
    organization: context.organization,
    activeTemplateIds: templates.map((template) => template.id),
    customerName:
      typeof input.customerName === "string" && input.customerName.trim()
        ? input.customerName.trim()
        : undefined,
  })
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } })
}
