import { NextResponse } from "next/server"

import { getQuoteFormValues } from "@/lib/quotes/queries"
import { quoteFormSchema } from "@/lib/quotes/schema"
import { saveQuote } from "@/lib/quotes/service"
import { requireApiSession } from "@/lib/quotes/session"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return authResult.error
  }

  const { quoteId } = await params
  const quote = await getQuoteFormValues(quoteId)

  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 })
  }

  return NextResponse.json({ quote })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return authResult.error
  }

  const { quoteId } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = quoteFormSchema.safeParse({
    ...(typeof body === "object" && body !== null ? body : {}),
    id: quoteId,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid quote" },
      { status: 400 }
    )
  }

  const result = await saveQuote(parsed.data, {
    ownerId: authResult.session.user.id,
    organizationId: authResult.session.session.activeOrganizationId!,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json(result.quote)
}
