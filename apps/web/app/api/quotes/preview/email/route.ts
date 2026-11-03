import { NextResponse } from "next/server"

import { renderQuoteEmailPreview } from "@starboard/ext-quoting-email/server"
import { quoteFormSchema } from "@starboard/lib-contracts"

import { requireApiSession } from "@/lib/auth/session"
import { getOrganizationPlan } from "@/lib/billing/plan"
import { isExtensionActive } from "@/lib/extensions"

/**
 * react-email quote draft HTML for the live Email preview tab (ticket 092).
 * Stateless: renders the posted (possibly unsaved) form values with the same
 * model as the 083 PDF; nothing is persisted or sent. Served only while the
 * `quoting.email` built-in is active.
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

  const result = await renderQuoteEmailPreview({
    quote: parsed.data,
    customerName:
      typeof input.customerName === "string" && input.customerName.trim()
        ? input.customerName.trim()
        : undefined,
  })
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } })
}
