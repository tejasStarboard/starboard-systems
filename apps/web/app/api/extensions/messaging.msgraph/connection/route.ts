import { NextResponse } from "next/server"

import { requireApiSession } from "@/lib/auth/session"
import { getOrganizationPlan } from "@/lib/billing/plan"
import { ServiceClientError } from "@/lib/clients/http"
import { getMessagingManager } from "@/lib/domain/messaging/messaging.manager"
import { isExtensionActive } from "@/lib/extensions"

async function requireMessagingSession() {
  const authResult = await requireApiSession()
  if (authResult.error) {
    return { error: authResult.error }
  }
  const organizationId = authResult.session.session.activeOrganizationId!
  const plan = await getOrganizationPlan(organizationId)
  if (!isExtensionActive("messaging.msgraph", plan)) {
    return {
      error: NextResponse.json(
        { error: "Extension messaging.msgraph is not enabled" },
        { status: 404 }
      ),
    }
  }
  return { organizationId }
}

export async function GET() {
  const gate = await requireMessagingSession()
  if (gate.error) {
    return gate.error
  }

  try {
    const result = await getMessagingManager().getConnection(
      gate.organizationId
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
  const gate = await requireMessagingSession()
  if (gate.error) {
    return gate.error
  }

  try {
    const started = await getMessagingManager().startConnection(
      gate.organizationId
    )
    // Vertical slice: complete stub OAuth immediately after start.
    const result = await getMessagingManager().completeConnection(
      gate.organizationId,
      "stub"
    )
    return NextResponse.json({
      ...result,
      authUrl: started.authUrl ?? null,
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

export async function DELETE() {
  const gate = await requireMessagingSession()
  if (gate.error) {
    return gate.error
  }

  try {
    const result = await getMessagingManager().disconnect(gate.organizationId)
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
