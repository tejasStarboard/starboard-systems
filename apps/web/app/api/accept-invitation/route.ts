import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

export async function POST(request: Request) {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({
    headers: requestHeaders,
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let invitationId: string | undefined

  try {
    const body = (await request.json()) as { invitationId?: string }
    invitationId = body.invitationId?.trim()
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    )
  }

  if (!invitationId) {
    return NextResponse.json(
      { error: "invitationId is required" },
      { status: 400 },
    )
  }

  try {
    const result = await auth.api.acceptInvitation({
      body: { invitationId },
      headers: requestHeaders,
    })

    const organizationId =
      result?.invitation?.organizationId ?? result?.member?.organizationId

    if (organizationId) {
      await auth.api.setActiveOrganization({
        body: { organizationId },
        headers: requestHeaders,
      })
    }

    return NextResponse.json({
      success: true,
      invitation: result?.invitation ?? null,
      member: result?.member ?? null,
      organizationId: organizationId ?? null,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to accept invitation"

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
