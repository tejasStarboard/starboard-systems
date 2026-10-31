import { NextResponse } from "next/server"
import { quotesListQuerySchema } from "@starboard/lib-contracts"

import { requireApiSession } from "@/lib/auth/session"
import { getQuotesManager } from "@/lib/domain/quotes/quotes.manager"
import { ServiceClientError } from "@/lib/clients/http"

export async function GET(request: Request) {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return authResult.error
  }

  const searchParams = new URL(request.url).searchParams
  const query = quotesListQuerySchema.parse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    q: searchParams.get("q") ?? "",
  })

  try {
    const result = await getQuotesManager().listQuotesForOrg(
      authResult.organizationId,
      query
    )
    return NextResponse.json(result)
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

export async function POST() {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return authResult.error
  }

  try {
    const created = await getQuotesManager().createQuoteForSession({
      ownerId: authResult.session.user.id,
      organizationId: authResult.organizationId,
    })
    return NextResponse.json(created, { status: 201 })
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
