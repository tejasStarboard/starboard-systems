import { NextResponse } from "next/server"

import { requireApiSession } from "@/lib/auth/session"
import {
  createQuoteForSession,
  listQuotesForOrg,
} from "@/lib/quotes/orchestrator"
import { ServiceClientError } from "@/lib/clients/http"

export async function GET() {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return authResult.error
  }

  try {
    const quotes = await listQuotesForOrg(
      authResult.session.session.activeOrganizationId!
    )
    return NextResponse.json({ quotes })
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
    const created = await createQuoteForSession({
      ownerId: authResult.session.user.id,
      organizationId: authResult.session.session.activeOrganizationId!,
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
