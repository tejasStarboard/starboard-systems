import { NextResponse } from "next/server"
import { quoteFormSchema } from "@starboard/contracts"

import { requireApiSession } from "@/lib/auth/session"
import { ServiceClientError } from "@/lib/clients/http"
import { getQuotesManager } from "@/lib/quotes/manager"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return authResult.error
  }

  const { quoteId } = await params

  try {
    const quote = await getQuotesManager().getQuoteFormValuesForOrg(
      quoteId,
      authResult.session.session.activeOrganizationId!
    )

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 })
    }

    return NextResponse.json({ quote })
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

  try {
    const quote = await getQuotesManager().saveQuoteForSession(parsed.data, {
      ownerId: authResult.session.user.id,
      organizationId: authResult.session.session.activeOrganizationId!,
    })
    return NextResponse.json(quote)
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
