import { NextResponse } from "next/server"

import { listQuotes } from "@/lib/quotes/queries"
import { createQuote } from "@/lib/quotes/service"
import { requireApiSession } from "@/lib/quotes/session"

export async function GET() {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return authResult.error
  }

  const quotes = await listQuotes(
    authResult.session.session.activeOrganizationId
  )

  return NextResponse.json({ quotes })
}

export async function POST() {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return authResult.error
  }

  const created = await createQuote({
    ownerId: authResult.session.user.id,
    organizationId: authResult.session.session.activeOrganizationId!,
  })

  return NextResponse.json(created, { status: 201 })
}
